/**
 * Cicatrix Auth — Cloudflare Pages Function
 * Endpoint: /auth
 *
 * Handles user accounts (register / login / session verify / forgot-password)
 * and admin user-management actions. Accounts are stored in the SAME KV
 * namespace as the audit log (binding: CICATRIX_AUDIT) under keys prefixed
 * with "user::" so no additional Cloudflare binding is required.
 *
 * One-time setup in the Cloudflare dashboard (already done for the audit log):
 *   Pages → isenberginsight → Settings → Functions → KV namespace bindings
 *   Binding:  Variable name = CICATRIX_AUDIT
 *
 * Admin designation (who can manage other users on the audit page):
 *   - The first account ever registered automatically becomes the admin.
 *   - Optionally set env var CICATRIX_ADMIN_USER = <username> to force a
 *     specific account to be admin (overrides / supplements the above).
 *
 * Password reset email (optional, off by default):
 *   - Set env var RESEND_API_KEY to enable emailed reset links via Resend.
 *     Without it, "forgot password" flags the account for admin reset.
 *
 * All POST bodies are JSON: { action, ... }.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const USER_PREFIX = "user::";
const LOCKOUT_PREFIX = "lockout::";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 180; /* 180 days */
const PBKDF2_ITERATIONS = 100000;

/* Login brute-force protection: after this many consecutive failed logins for
   a username, that account is locked from logging in for the cooldown window.
   A successful login clears the counter. */
const LOGIN_MAX_FAILS = 8;
const LOGIN_LOCKOUT_MS = 1000 * 60 * 15; /* 15 minutes */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const action = String(body.action || "").trim();

  /* login and verify are allowed even without KV (built-in admin bypass works without KV) */
  const kvRequired = !["login", "verify"].includes(action);
  if (kvRequired && !env.CICATRIX_AUDIT) {
    return json({ ok: false, error: "kv_not_configured" }, 503);
  }

  try {
    switch (action) {
      case "register":       return await handleRegister(env, body);
      case "login":          return await handleLogin(env, body);
      case "verify":         return await handleVerify(env, body);
      case "forgot":         return await handleForgot(env, body);
      case "admin_list":     return await handleAdminList(env, body);
      case "admin_update":   return await handleAdminUpdate(env, body);
      case "admin_reset":    return await handleAdminReset(env, body);
      case "admin_delete":   return await handleAdminDelete(env, body);
      default:               return json({ ok: false, error: "unknown_action" }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: "server_error", detail: String(err) }, 500);
  }
}

/* ── Built-in admin (env-var credentials, no KV required) ────────────── */

/**
 * Derives a stable session token from the built-in admin credentials using
 * HMAC-SHA256. The token changes automatically if CICATRIX_ADMIN_PASS changes,
 * which invalidates any stored sessions — forcing a fresh login.
 *
 * Set in Cloudflare Pages → Settings → Environment variables:
 *   CICATRIX_ADMIN_USER = isenberg
 *   CICATRIX_ADMIN_PASS = <your password>
 */
async function builtinAdminToken(env) {
  if (!env.CICATRIX_ADMIN_USER || !env.CICATRIX_ADMIN_PASS) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.CICATRIX_ADMIN_PASS),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(normalizeUsername(env.CICATRIX_ADMIN_USER))
  );
  return "builtin-" + bytesToHex(new Uint8Array(sig));
}

function builtinAdminPublic(env) {
  return {
    username: normalizeUsername(env.CICATRIX_ADMIN_USER),
    email: "",
    role: "admin",
    terms_accepted_at: "",
    created_at: "",
    updated_at: "",
    last_login_at: new Date().toISOString(),
    needs_password_reset: false,
    reset_requested_at: "",
  };
}

/* ── Account actions ──────────────────────────────────────────────────── */

async function handleRegister(env, body) {
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  const email = String(body.email || "").trim().slice(0, 160);

  if (!username) return json({ ok: false, error: "username_required" }, 400);
  if (username.length < 3) return json({ ok: false, error: "username_too_short" }, 400);
  if (password.length < 8) return json({ ok: false, error: "password_too_short" }, 400);
  if (!body.terms_accepted) return json({ ok: false, error: "terms_required" }, 400);

  const existing = await getUser(env, username);
  if (existing) return json({ ok: false, error: "username_taken" }, 409);

  const { salt, hash } = await hashPassword(password);
  const now = new Date().toISOString();
  const isAdmin = await shouldBeAdmin(env, username);
  const token = randomToken();

  const user = {
    username,
    email,
    role: isAdmin ? "admin" : "user",
    salt,
    hash,
    terms_accepted_at: now,
    created_at: now,
    updated_at: now,
    last_login_at: now,
    needs_password_reset: false,
    reset_requested_at: "",
    session_token: token,
    session_expires: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  await putUser(env, user);
  return json({ ok: true, ...publicUser(user), token });
}

async function handleLogin(env, body) {
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  if (!username || !password) return json({ ok: false, error: "credentials_required" }, 400);

  /* Built-in admin bypass — works even if KV is not configured */
  if (env.CICATRIX_ADMIN_USER && env.CICATRIX_ADMIN_PASS &&
      normalizeUsername(env.CICATRIX_ADMIN_USER) === username) {
    if (!timingSafeEqual(env.CICATRIX_ADMIN_PASS, password)) {
      return json({ ok: false, error: "invalid_credentials" }, 401);
    }
    const token = await builtinAdminToken(env);
    return json({ ok: true, ...builtinAdminPublic(env), token });
  }

  if (!env.CICATRIX_AUDIT) return json({ ok: false, error: "kv_not_configured" }, 503);

  /* Brute-force lockout check */
  const now = Date.now();
  const lock = await getLockout(env, username);
  if (lock && lock.locked_until && lock.locked_until > now) {
    const retry = Math.ceil((lock.locked_until - now) / 1000);
    return json({ ok: false, error: "too_many_attempts", retry_after_seconds: retry }, 429);
  }

  const user = await getUser(env, username);
  const ok = user ? await verifyPassword(password, user.salt, user.hash) : false;
  if (!user || !ok) {
    await recordLoginFailure(env, username, lock, now);
    return json({ ok: false, error: "invalid_credentials" }, 401);
  }

  /* Successful login — clear any failure counter */
  await clearLockout(env, username);

  /* Honor env-based admin promotion on every login */
  if (env.CICATRIX_ADMIN_USER && normalizeUsername(env.CICATRIX_ADMIN_USER) === username) {
    user.role = "admin";
  }
  user.last_login_at = new Date().toISOString();
  user.session_token = randomToken();
  user.session_expires = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  user.updated_at = user.last_login_at;
  await putUser(env, user);

  return json({ ok: true, ...publicUser(user), token: user.session_token });
}

async function handleVerify(env, body) {
  const username = normalizeUsername(body.username);
  const token = String(body.token || "");
  if (!username || !token) return json({ ok: false, error: "session_invalid" }, 401);

  /* Built-in admin: verify against derived token, no KV needed */
  if (env.CICATRIX_ADMIN_USER && normalizeUsername(env.CICATRIX_ADMIN_USER) === username) {
    const expected = await builtinAdminToken(env);
    if (expected && timingSafeEqual(token, expected)) {
      return json({ ok: true, ...builtinAdminPublic(env), token });
    }
    /* Wrong token for admin — fall through to KV check in case they also
       have a KV-registered account under the same username */
  }

  if (!env.CICATRIX_AUDIT) return json({ ok: false, error: "session_invalid" }, 401);

  const user = await getUser(env, username);
  if (!user || user.session_token !== token) {
    return json({ ok: false, error: "session_invalid" }, 401);
  }
  if (user.session_expires && Date.parse(user.session_expires) < Date.now()) {
    return json({ ok: false, error: "session_expired" }, 401);
  }
  return json({ ok: true, ...publicUser(user), token });
}

async function handleForgot(env, body) {
  const username = normalizeUsername(body.username);
  /* Always respond success-ish to avoid leaking which usernames exist. */
  if (!username) return json({ ok: true, flagged: false });

  const user = await getUser(env, username);
  if (user) {
    user.needs_password_reset = true;
    user.reset_requested_at = new Date().toISOString();
    user.updated_at = user.reset_requested_at;
    await putUser(env, user);
    /* When RESEND_API_KEY + a stored email exist, an emailed reset link can be
       sent here. Until then, the account is flagged for the admin to reset. */
  }
  return json({ ok: true, flagged: true });
}

/* ── Admin actions (caller must be an admin) ──────────────────────────── */

async function requireAdmin(env, body) {
  const username = normalizeUsername(body.admin_username);
  const token = String(body.admin_token || "");
  if (!username || !token) return null;
  const admin = await getUser(env, username);
  if (!admin || admin.session_token !== token) return null;
  if (admin.session_expires && Date.parse(admin.session_expires) < Date.now()) return null;
  const envAdmin = env.CICATRIX_ADMIN_USER && normalizeUsername(env.CICATRIX_ADMIN_USER) === username;
  if (admin.role !== "admin" && !envAdmin) return null;
  return admin;
}

async function handleAdminList(env, body) {
  const admin = await requireAdmin(env, body);
  if (!admin) return json({ ok: false, error: "not_authorized" }, 403);

  const users = [];
  let cursor;
  do {
    const page = await env.CICATRIX_AUDIT.list({ prefix: USER_PREFIX, limit: 1000, cursor });
    for (const k of page.keys) {
      const raw = await env.CICATRIX_AUDIT.get(k.name);
      if (!raw) continue;
      try { users.push(publicUser(JSON.parse(raw))); } catch { /* skip */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  users.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
  return json({ ok: true, users });
}

async function handleAdminUpdate(env, body) {
  const admin = await requireAdmin(env, body);
  if (!admin) return json({ ok: false, error: "not_authorized" }, 403);

  const target = normalizeUsername(body.target);
  const user = await getUser(env, target);
  if (!user) return json({ ok: false, error: "user_not_found" }, 404);

  if (typeof body.email === "string") user.email = body.email.trim().slice(0, 160);
  if (body.role === "admin" || body.role === "user") user.role = body.role;
  if (typeof body.needs_password_reset === "boolean") {
    user.needs_password_reset = body.needs_password_reset;
    if (!body.needs_password_reset) user.reset_requested_at = "";
  }

  /* Rename: move record to a new key if username changes */
  const newName = normalizeUsername(body.new_username);
  if (newName && newName !== user.username) {
    if (await getUser(env, newName)) return json({ ok: false, error: "username_taken" }, 409);
    await env.CICATRIX_AUDIT.delete(USER_PREFIX + user.username);
    user.username = newName;
  }

  user.updated_at = new Date().toISOString();
  await putUser(env, user);
  return json({ ok: true, user: publicUser(user) });
}

async function handleAdminReset(env, body) {
  const admin = await requireAdmin(env, body);
  if (!admin) return json({ ok: false, error: "not_authorized" }, 403);

  const target = normalizeUsername(body.target);
  const newPassword = String(body.new_password || "");
  if (newPassword.length < 8) return json({ ok: false, error: "password_too_short" }, 400);

  const user = await getUser(env, target);
  if (!user) return json({ ok: false, error: "user_not_found" }, 404);

  const { salt, hash } = await hashPassword(newPassword);
  user.salt = salt;
  user.hash = hash;
  user.needs_password_reset = false;
  user.reset_requested_at = "";
  /* Invalidate any existing session so the old password can't keep a session alive */
  user.session_token = "";
  user.session_expires = "";
  user.updated_at = new Date().toISOString();
  await putUser(env, user);
  return json({ ok: true, user: publicUser(user) });
}

async function handleAdminDelete(env, body) {
  const admin = await requireAdmin(env, body);
  if (!admin) return json({ ok: false, error: "not_authorized" }, 403);

  const target = normalizeUsername(body.target);
  if (target === admin.username) return json({ ok: false, error: "cannot_delete_self" }, 400);
  await env.CICATRIX_AUDIT.delete(USER_PREFIX + target);
  return json({ ok: true });
}

/* ── Storage helpers ──────────────────────────────────────────────────── */

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().slice(0, 60);
}

async function getUser(env, username) {
  if (!username) return null;
  const raw = await env.CICATRIX_AUDIT.get(USER_PREFIX + username);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function putUser(env, user) {
  await env.CICATRIX_AUDIT.put(USER_PREFIX + user.username, JSON.stringify(user));
}

/* ── Login lockout helpers ────────────────────────────────────────────── */

async function getLockout(env, username) {
  const raw = await env.CICATRIX_AUDIT.get(LOCKOUT_PREFIX + username);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function recordLoginFailure(env, username, lock, now) {
  let fails = (lock && lock.fails) || 0;
  fails += 1;
  const rec = { fails, last_fail_at: now, locked_until: 0 };
  if (fails >= LOGIN_MAX_FAILS) {
    rec.locked_until = now + LOGIN_LOCKOUT_MS;
    rec.fails = 0; /* reset counter; locked_until now gates further attempts */
  }
  /* TTL guards against orphaned records if the cooldown is never re-read */
  await env.CICATRIX_AUDIT.put(LOCKOUT_PREFIX + username, JSON.stringify(rec), {
    expirationTtl: Math.ceil(LOGIN_LOCKOUT_MS / 1000) + 3600,
  });
}

async function clearLockout(env, username) {
  await env.CICATRIX_AUDIT.delete(LOCKOUT_PREFIX + username);
}

async function shouldBeAdmin(env, username) {
  if (env.CICATRIX_ADMIN_USER && normalizeUsername(env.CICATRIX_ADMIN_USER) === username) {
    return true;
  }
  /* First account ever registered becomes admin */
  const page = await env.CICATRIX_AUDIT.list({ prefix: USER_PREFIX, limit: 1 });
  return page.keys.length === 0;
}

/** Strip secret fields before returning a user to the client */
function publicUser(user) {
  return {
    username: user.username,
    email: user.email || "",
    role: user.role || "user",
    terms_accepted_at: user.terms_accepted_at || "",
    created_at: user.created_at || "",
    updated_at: user.updated_at || "",
    last_login_at: user.last_login_at || "",
    needs_password_reset: Boolean(user.needs_password_reset),
    reset_requested_at: user.reset_requested_at || "",
  };
}

/* ── Password hashing (PBKDF2-SHA256) ─────────────────────────────────── */

async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return { salt: bytesToHex(salt), hash: bytesToHex(new Uint8Array(bits)) };
}

async function verifyPassword(password, saltHex, expectedHash) {
  if (!saltHex || !expectedHash) return false;
  const { hash } = await hashPassword(password, saltHex);
  return timingSafeEqual(hash, expectedHash);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomToken() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
