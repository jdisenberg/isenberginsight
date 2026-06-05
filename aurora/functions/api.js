/**
 * Aurora Sanctuary — Cloudflare Pages Function (single API endpoint)
 * Endpoint: /api
 *
 * Handles authentication (register / login / verify / admin user management)
 * and CRUD for every data collection used by the app: jobs, animals,
 * supplies, shifts, and org settings (kennel list, job/animal categories).
 *
 * All records live in ONE Cloudflare KV namespace, keyed by prefix:
 *   user::<username>      account record (includes password hash + session)
 *   lockout::<username>   brute-force lockout counter (TTL'd)
 *   job::<id>             a job / task
 *   animal::<id>          an animal record
 *   supply::<id>          a supply / inventory item
 *   shift::<id>           a scheduled shift
 *   settings::org         organization settings (single record)
 *
 * One-time setup in the Cloudflare dashboard:
 *   Pages → <your project> → Settings → Functions → KV namespace bindings
 *   Binding:  Variable name = AURORA_KV   →  (a KV namespace you create)
 *
 * Optional environment variables:
 *   AURORA_ADMIN_USER / AURORA_ADMIN_PASS
 *     A built-in admin that works even before any account is registered and
 *     even if KV is briefly unavailable. The first KV-registered account also
 *     becomes admin automatically.
 *
 * All POST bodies are JSON: { action, token, username, ... }.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const USER_PREFIX = "user::";
const LOCKOUT_PREFIX = "lockout::";
const SETTINGS_KEY = "settings::org";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 180; /* 180 days */
const PBKDF2_ITERATIONS = 100000;
const LOGIN_MAX_FAILS = 8;
const LOGIN_LOCKOUT_MS = 1000 * 60 * 15;

/* Collections that support generic list/save/delete actions */
const COLLECTIONS = {
  job: "job::",
  animal: "animal::",
  supply: "supply::",
  shift: "shift::",
  timelog: "timelog::",
  doc: "doc::", /* document attachments — large; kept out of the snapshot */
};

const ACT_PREFIX = "act::";
const ACT_TTL_SEC = 60 * 60 * 24 * 120; /* keep ~120 days of activity */

/* Fields safe to expose on the public adoptable page (no auth). */
const PUBLIC_ANIMAL_FIELDS = ["id", "name", "species", "breed", "sex", "age", "color", "photo", "status", "publicBio"];

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

  /* login / verify / config can answer without KV (built-in admin + probe) */
  const noKvOk = ["login", "verify", "config"];
  if (!noKvOk.includes(action) && !env.AURORA_KV) {
    return json({ ok: false, error: "kv_not_configured" }, 503);
  }

  try {
    switch (action) {
      /* ── connectivity probe ── */
      case "config":
        return json({ ok: true, backend: true, kv: Boolean(env.AURORA_KV) });

      /* ── public, no-auth (adoptable page) ── */
      case "public_list":   return await handlePublicList(env);
      case "public_animal": return await handlePublicAnimal(env, body);

      /* ── auth ── */
      case "register":     return await handleRegister(env, body);
      case "login":        return await handleLogin(env, body);
      case "verify":       return await handleVerify(env, body);
      case "forgot":       return await handleForgot(env, body);

      /* ── staff directory (any signed-in user) ── */
      case "staff_list":   return await guard(env, body, "user", () => handleStaffList(env));

      /* ── activity log (admin) ── */
      case "activity_list": return await guard(env, body, "admin", () => handleActivityList(env));

      /* ── admin user management ── */
      case "admin_list":   return await guard(env, body, "admin", () => handleAdminList(env, body));
      case "admin_update": return await guard(env, body, "admin", () => handleAdminUpdate(env, body));
      case "admin_reset":  return await guard(env, body, "admin", () => handleAdminReset(env, body));
      case "admin_delete": return await guard(env, body, "admin", () => handleAdminDelete(env, body));

      /* ── settings ── */
      case "settings_get":  return await guard(env, body, "user", () => handleSettingsGet(env));
      case "settings_save": return await guard(env, body, "admin", () => handleSettingsSave(env, body));

      /* ── data collections (jobs / animals / supplies / shifts) ── */
      case "list":   return await guard(env, body, "user", (u) => handleList(env, body, u));
      case "save":   return await guard(env, body, "user", (u) => handleSave(env, body, u));
      case "delete": return await guard(env, body, "user", (u) => handleDelete(env, body, u));

      /* ── full snapshot (one round-trip refresh) ── */
      case "snapshot": return await guard(env, body, "user", (u) => handleSnapshot(env, u));

      default: return json({ ok: false, error: "unknown_action" }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: "server_error", detail: String(err) }, 500);
  }
}

/* ── Authorization guard ──────────────────────────────────────────────── */

/**
 * Verifies the caller's session token, then runs fn(user). When minRole is
 * "admin", the caller must be an admin. Returns 401/403 otherwise.
 */
async function guard(env, body, minRole, fn) {
  const user = await resolveSession(env, body);
  if (!user) return json({ ok: false, error: "session_invalid" }, 401);
  if (minRole === "admin" && user.role !== "admin") {
    return json({ ok: false, error: "not_authorized" }, 403);
  }
  return await fn(user);
}

async function resolveSession(env, body) {
  const username = normalizeUsername(body.username);
  const token = String(body.token || "");
  if (!username || !token) return null;

  /* Built-in admin (env credentials) — no KV needed */
  if (env.AURORA_ADMIN_USER && normalizeUsername(env.AURORA_ADMIN_USER) === username) {
    const expected = await builtinAdminToken(env);
    if (expected && timingSafeEqual(token, expected)) return builtinAdminPublic(env);
  }

  if (!env.AURORA_KV) return null;
  const user = await getUser(env, username);
  if (!user || user.session_token !== token) return null;
  if (user.session_expires && Date.parse(user.session_expires) < Date.now()) return null;
  if (env.AURORA_ADMIN_USER && normalizeUsername(env.AURORA_ADMIN_USER) === username) {
    user.role = "admin";
  }
  return user;
}

/* ── Built-in admin ───────────────────────────────────────────────────── */

async function builtinAdminToken(env) {
  if (!env.AURORA_ADMIN_USER || !env.AURORA_ADMIN_PASS) return null;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.AURORA_ADMIN_PASS),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(normalizeUsername(env.AURORA_ADMIN_USER))
  );
  return "builtin-" + bytesToHex(new Uint8Array(sig));
}

function builtinAdminPublic(env) {
  return {
    username: normalizeUsername(env.AURORA_ADMIN_USER),
    name: "Administrator",
    email: "", phone: "",
    role: "admin",
    created_at: "", updated_at: "", last_login_at: new Date().toISOString(),
    needs_password_reset: false, reset_requested_at: "",
  };
}

/* ── Account actions ──────────────────────────────────────────────────── */

async function handleRegister(env, body) {
  if (!env.AURORA_KV) return json({ ok: false, error: "kv_not_configured" }, 503);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  const email = String(body.email || "").trim().slice(0, 160);
  const name = String(body.name || "").trim().slice(0, 80);
  const phone = String(body.phone || "").trim().slice(0, 40);

  if (!username) return json({ ok: false, error: "username_required" }, 400);
  if (username.length < 3) return json({ ok: false, error: "username_too_short" }, 400);
  if (password.length < 8) return json({ ok: false, error: "password_too_short" }, 400);

  if (await getUser(env, username)) return json({ ok: false, error: "username_taken" }, 409);

  const { salt, hash } = await hashPassword(password);
  const now = new Date().toISOString();
  const isAdmin = await shouldBeAdmin(env, username);
  const token = randomToken();

  const user = {
    username, email, name, phone,
    role: isAdmin ? "admin" : "staff",
    salt, hash,
    created_at: now, updated_at: now, last_login_at: now,
    needs_password_reset: false, reset_requested_at: "",
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

  /* Built-in admin bypass */
  if (env.AURORA_ADMIN_USER && env.AURORA_ADMIN_PASS &&
      normalizeUsername(env.AURORA_ADMIN_USER) === username) {
    if (!timingSafeEqual(env.AURORA_ADMIN_PASS, password)) {
      return json({ ok: false, error: "invalid_credentials" }, 401);
    }
    const token = await builtinAdminToken(env);
    return json({ ok: true, ...builtinAdminPublic(env), token });
  }

  if (!env.AURORA_KV) return json({ ok: false, error: "kv_not_configured" }, 503);

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

  await clearLockout(env, username);
  if (env.AURORA_ADMIN_USER && normalizeUsername(env.AURORA_ADMIN_USER) === username) {
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
  const user = await resolveSession(env, body);
  if (!user) return json({ ok: false, error: "session_invalid" }, 401);
  return json({ ok: true, ...publicUser(user), token: String(body.token || "") });
}

async function handleForgot(env, body) {
  if (!env.AURORA_KV) return json({ ok: true, flagged: false });
  const username = normalizeUsername(body.username);
  if (!username) return json({ ok: true, flagged: false });
  const user = await getUser(env, username);
  if (user) {
    user.needs_password_reset = true;
    user.reset_requested_at = new Date().toISOString();
    user.updated_at = user.reset_requested_at;
    await putUser(env, user);
  }
  return json({ ok: true, flagged: true });
}

/* ── Admin user management ────────────────────────────────────────────── */

/** Minimal directory any signed-in user can read, for assignee labels. */
async function handleStaffList(env) {
  const users = [];
  let cursor;
  do {
    const page = await env.AURORA_KV.list({ prefix: USER_PREFIX, limit: 1000, cursor });
    for (const k of page.keys) {
      const raw = await env.AURORA_KV.get(k.name);
      if (!raw) continue;
      try {
        const u = JSON.parse(raw);
        users.push({ username: u.username, name: u.name || "", role: u.role || "staff" });
      } catch { /* skip */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  users.sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username));
  return json({ ok: true, users });
}

async function handleAdminList(env) {
  const users = [];
  let cursor;
  do {
    const page = await env.AURORA_KV.list({ prefix: USER_PREFIX, limit: 1000, cursor });
    for (const k of page.keys) {
      const raw = await env.AURORA_KV.get(k.name);
      if (!raw) continue;
      try { users.push(publicUser(JSON.parse(raw))); } catch { /* skip */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  users.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
  return json({ ok: true, users });
}

async function handleAdminUpdate(env, body) {
  const target = normalizeUsername(body.target);
  const user = await getUser(env, target);
  if (!user) return json({ ok: false, error: "user_not_found" }, 404);
  if (typeof body.email === "string") user.email = body.email.trim().slice(0, 160);
  if (typeof body.name === "string") user.name = body.name.trim().slice(0, 80);
  if (typeof body.phone === "string") user.phone = body.phone.trim().slice(0, 40);
  if (body.role === "admin" || body.role === "staff") user.role = body.role;
  if (typeof body.needs_password_reset === "boolean") {
    user.needs_password_reset = body.needs_password_reset;
    if (!body.needs_password_reset) user.reset_requested_at = "";
  }
  user.updated_at = new Date().toISOString();
  await putUser(env, user);
  return json({ ok: true, user: publicUser(user) });
}

async function handleAdminReset(env, body) {
  const target = normalizeUsername(body.target);
  const newPassword = String(body.new_password || "");
  if (newPassword.length < 8) return json({ ok: false, error: "password_too_short" }, 400);
  const user = await getUser(env, target);
  if (!user) return json({ ok: false, error: "user_not_found" }, 404);
  const { salt, hash } = await hashPassword(newPassword);
  user.salt = salt; user.hash = hash;
  user.needs_password_reset = false; user.reset_requested_at = "";
  user.session_token = ""; user.session_expires = "";
  user.updated_at = new Date().toISOString();
  await putUser(env, user);
  return json({ ok: true, user: publicUser(user) });
}

async function handleAdminDelete(env, body) {
  const target = normalizeUsername(body.target);
  const adminUser = await resolveSession(env, body);
  if (adminUser && target === adminUser.username) {
    return json({ ok: false, error: "cannot_delete_self" }, 400);
  }
  await env.AURORA_KV.delete(USER_PREFIX + target);
  return json({ ok: true });
}

/* ── Settings ─────────────────────────────────────────────────────────── */

async function handleSettingsGet(env) {
  const raw = await env.AURORA_KV.get(SETTINGS_KEY);
  let settings = {};
  if (raw) { try { settings = JSON.parse(raw); } catch { settings = {}; } }
  return json({ ok: true, settings: withDefaultSettings(settings) });
}

async function handleSettingsSave(env, body) {
  const incoming = body.settings && typeof body.settings === "object" ? body.settings : {};
  const settings = withDefaultSettings(incoming);
  settings.updated_at = new Date().toISOString();
  await env.AURORA_KV.put(SETTINGS_KEY, JSON.stringify(settings));
  return json({ ok: true, settings });
}

function withDefaultSettings(s) {
  return {
    orgName: typeof s.orgName === "string" && s.orgName.trim() ? s.orgName : "Aurora Sanctuary",
    kennels: Array.isArray(s.kennels) ? s.kennels : [],
    animalStatuses: Array.isArray(s.animalStatuses) && s.animalStatuses.length
      ? s.animalStatuses
      : ["Available", "Hold", "Medical", "Quarantine", "Foster", "Adopted"],
    jobCategories: Array.isArray(s.jobCategories) && s.jobCategories.length
      ? s.jobCategories
      : ["Feeding", "Cleaning", "Medical", "Enrichment", "Laundry", "Intake", "Other"],
    updated_at: s.updated_at || "",
  };
}

/* ── Generic collection CRUD ──────────────────────────────────────────── */

async function handleList(env, body, user) {
  const prefix = COLLECTIONS[String(body.collection || "")];
  if (!prefix) return json({ ok: false, error: "unknown_collection" }, 400);
  const items = await listCollection(env, prefix);
  return json({ ok: true, items });
}

async function handleSave(env, body, user) {
  const collection = String(body.collection || "");
  const prefix = COLLECTIONS[collection];
  if (!prefix) return json({ ok: false, error: "unknown_collection" }, 400);

  const item = body.item && typeof body.item === "object" ? { ...body.item } : null;
  if (!item) return json({ ok: false, error: "item_required" }, 400);

  const isNew = !item.id;
  const now = new Date().toISOString();
  if (!item.id) {
    item.id = randomId();
    item.createdAt = now;
    item.createdBy = user.username;
  }
  item.updatedAt = now;
  item.updatedBy = user.username;

  /* Stamp completion metadata for jobs when status flips to done */
  if (collection === "job") {
    if (item.status === "done" && !item.completedAt) {
      item.completedAt = now;
      item.completedBy = user.username;
    }
    if (item.status !== "done") {
      item.completedAt = "";
      item.completedBy = "";
    }
  }

  await env.AURORA_KV.put(prefix + item.id, JSON.stringify(item));
  /* Don't log time-clock punches as activity (they have their own view). */
  if (collection !== "timelog") {
    const label = item.title || item.name || item.id;
    await recordActivity(env, user.username, `${isNew ? "created" : "updated"} ${collection} “${label}”`);
  }
  return json({ ok: true, item });
}

async function handleDelete(env, body, user) {
  const collection = String(body.collection || "");
  const prefix = COLLECTIONS[collection];
  if (!prefix) return json({ ok: false, error: "unknown_collection" }, 400);
  const id = String(body.id || "");
  if (!id) return json({ ok: false, error: "id_required" }, 400);
  await env.AURORA_KV.delete(prefix + id);
  if (collection !== "timelog" && user) {
    await recordActivity(env, user.username, `deleted ${collection} ${id}`);
  }
  return json({ ok: true });
}

async function handleSnapshot(env, user) {
  const [jobs, animals, supplies, shifts, timelogs] = await Promise.all([
    listCollection(env, COLLECTIONS.job),
    listCollection(env, COLLECTIONS.animal),
    listCollection(env, COLLECTIONS.supply),
    listCollection(env, COLLECTIONS.shift),
    listCollection(env, COLLECTIONS.timelog),
  ]);
  const settingsRes = await handleSettingsGet(env);
  const settings = (await settingsRes.json()).settings;
  return json({ ok: true, jobs, animals, supplies, shifts, timelogs, settings, me: publicUser(user) });
}

/* ── Activity log ─────────────────────────────────────────────────────── */

async function recordActivity(env, username, text) {
  try {
    const ts = Date.now();
    const key = ACT_PREFIX + (1e15 - ts) + "-" + randomId(); /* reverse-ts key = newest first */
    const entry = { ts: new Date(ts).toISOString(), user: username, text };
    await env.AURORA_KV.put(key, JSON.stringify(entry), { expirationTtl: ACT_TTL_SEC });
  } catch { /* logging must never break the operation */ }
}

async function handleActivityList(env) {
  const items = [];
  let cursor;
  do {
    const page = await env.AURORA_KV.list({ prefix: ACT_PREFIX, limit: 200, cursor });
    for (const k of page.keys) {
      const raw = await env.AURORA_KV.get(k.name);
      if (!raw) continue;
      try { items.push(JSON.parse(raw)); } catch { /* skip */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
    if (items.length >= 200) break;
  } while (cursor);
  /* keys already sort newest-first via reverse-ts prefix */
  return json({ ok: true, activity: items.slice(0, 200) });
}

/* ── Public adoptable page (no auth) ──────────────────────────────────── */

function publicAnimal(a) {
  const out = {};
  for (const f of PUBLIC_ANIMAL_FIELDS) out[f] = a[f] || "";
  return out;
}

async function handlePublicList(env) {
  const animals = await listCollection(env, COLLECTIONS.animal);
  const shareable = animals.filter((a) => a.shareable === true).map(publicAnimal);
  shareable.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const settingsRes = await handleSettingsGet(env);
  const settings = (await settingsRes.json()).settings;
  return json({ ok: true, animals: shareable, orgName: settings.orgName });
}

async function handlePublicAnimal(env, body) {
  const id = String(body.id || "");
  if (!id) return json({ ok: false, error: "id_required" }, 400);
  const raw = await env.AURORA_KV.get(COLLECTIONS.animal + id);
  if (!raw) return json({ ok: false, error: "not_found" }, 404);
  let a;
  try { a = JSON.parse(raw); } catch { return json({ ok: false, error: "not_found" }, 404); }
  if (a.shareable !== true) return json({ ok: false, error: "not_public" }, 403);
  const settingsRes = await handleSettingsGet(env);
  const settings = (await settingsRes.json()).settings;
  return json({ ok: true, animal: publicAnimal(a), orgName: settings.orgName });
}

async function listCollection(env, prefix) {
  const items = [];
  let cursor;
  do {
    const page = await env.AURORA_KV.list({ prefix, limit: 1000, cursor });
    for (const k of page.keys) {
      const raw = await env.AURORA_KV.get(k.name);
      if (!raw) continue;
      try { items.push(JSON.parse(raw)); } catch { /* skip */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return items;
}

/* ── Storage + auth helpers ───────────────────────────────────────────── */

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().slice(0, 60);
}

async function getUser(env, username) {
  if (!username) return null;
  const raw = await env.AURORA_KV.get(USER_PREFIX + username);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function putUser(env, user) {
  await env.AURORA_KV.put(USER_PREFIX + user.username, JSON.stringify(user));
}

async function getLockout(env, username) {
  const raw = await env.AURORA_KV.get(LOCKOUT_PREFIX + username);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function recordLoginFailure(env, username, lock, now) {
  let fails = (lock && lock.fails) || 0;
  fails += 1;
  const rec = { fails, last_fail_at: now, locked_until: 0 };
  if (fails >= LOGIN_MAX_FAILS) {
    rec.locked_until = now + LOGIN_LOCKOUT_MS;
    rec.fails = 0;
  }
  await env.AURORA_KV.put(LOCKOUT_PREFIX + username, JSON.stringify(rec), {
    expirationTtl: Math.ceil(LOGIN_LOCKOUT_MS / 1000) + 3600,
  });
}

async function clearLockout(env, username) {
  await env.AURORA_KV.delete(LOCKOUT_PREFIX + username);
}

async function shouldBeAdmin(env, username) {
  if (env.AURORA_ADMIN_USER && normalizeUsername(env.AURORA_ADMIN_USER) === username) return true;
  const page = await env.AURORA_KV.list({ prefix: USER_PREFIX, limit: 1 });
  return page.keys.length === 0;
}

function publicUser(user) {
  return {
    username: user.username,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "staff",
    created_at: user.created_at || "",
    updated_at: user.updated_at || "",
    last_login_at: user.last_login_at || "",
    needs_password_reset: Boolean(user.needs_password_reset),
    reset_requested_at: user.reset_requested_at || "",
  };
}

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

function randomId() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
