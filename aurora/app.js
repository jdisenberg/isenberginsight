/* ====================================================================
 * Aurora Sanctuary — front-end application
 *
 * Talks to the Cloudflare Pages Function at /api when a backend is
 * available (true multi-user, synced across devices). When no backend is
 * reachable — e.g. the file is opened directly, or KV isn't configured yet
 * — it transparently falls back to a single-device localStorage store so
 * the app is fully usable immediately. A badge in the header shows which
 * mode is active.
 * ==================================================================== */
(() => {
  "use strict";

  const API_URL = "/api";
  const LS = {
    session: "aurora.session",
    local: "aurora.local.db",
    localUsers: "aurora.local.users",
  };

  /* ── small helpers ─────────────────────────────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    }
    return node;
  };
  const uid = () => {
    const a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);

  /* Read an image file and return a downscaled JPEG data URL (keeps KV small
     and uploads fast from phones). */
  function readImageResized(file, maxDim, cb) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        try { cb(canvas.toDataURL("image/jpeg", 0.82)); }
        catch { cb(e.target.result); }
      };
      img.onerror = () => cb("");
      img.src = e.target.result;
    };
    reader.onerror = () => cb("");
    reader.readAsDataURL(file);
  }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };
  const fmtTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = ((h + 11) % 12) + 1;
    return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`;
  };

  async function pbkdf2(password, saltHex) {
    const enc = new TextEncoder();
    const salt = saltHex
      ? Uint8Array.from(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)))
      : crypto.getRandomValues(new Uint8Array(16));
    const km = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, km, 256
    );
    const hex = (arr) => Array.from(new Uint8Array(arr)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return { salt: hex(salt), hash: hex(bits) };
  }

  /* ── toast ─────────────────────────────────────────────────────── */
  let toastTimer;
  function toast(msg, kind = "ok") {
    const t = $("#toast");
    t.textContent = msg;
    t.className = `toast ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  /* ================================================================
   * STORE — network-backed with a localStorage fallback.
   * Both implementations expose the same async interface.
   * ================================================================ */

  const NetworkStore = {
    mode: "cloud",
    async call(action, payload = {}) {
      const session = State.session || {};
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username: session.username, token: session.token, ...payload }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "bad_response" }));
      if (!res.ok && !data.error) data.error = "http_" + res.status;
      return data;
    },
    register(p) { return this.call("register", p); },
    login(p) { return this.call("login", p); },
    verify(p) { return this.call("verify", p); },
    forgot(p) { return this.call("forgot", p); },
    snapshot() { return this.call("snapshot"); },
    save(collection, item) { return this.call("save", { collection, item }); },
    remove(collection, id) { return this.call("delete", { collection, id }); },
    settingsSave(settings) { return this.call("settings_save", { settings }); },
    staffList() { return this.call("staff_list"); },
    activityList() { return this.call("activity_list"); },
    adminList() { return this.call("admin_list"); },
    adminUpdate(p) { return this.call("admin_update", p); },
    adminReset(p) { return this.call("admin_reset", p); },
    adminDelete(target) { return this.call("admin_delete", { target }); },
  };

  const LocalStore = {
    mode: "local",
    _db() {
      try { return JSON.parse(localStorage.getItem(LS.local)) || {}; } catch { return {}; }
    },
    _saveDb(db) { localStorage.setItem(LS.local, JSON.stringify(db)); },
    _users() {
      try { return JSON.parse(localStorage.getItem(LS.localUsers)) || {}; } catch { return {}; }
    },
    _saveUsers(u) { localStorage.setItem(LS.localUsers, JSON.stringify(u)); },
    _defaults() {
      return {
        jobs: [], animals: [], supplies: [], shifts: [], timelogs: [],
        settings: {
          orgName: "Aurora Sanctuary",
          kennels: [],
          animalStatuses: ["Available", "Hold", "Medical", "Quarantine", "Foster", "Adopted"],
          jobCategories: ["Feeding", "Cleaning", "Medical", "Enrichment", "Laundry", "Intake", "Other"],
        },
      };
    },
    _logActivity(text) {
      try {
        const arr = JSON.parse(localStorage.getItem("aurora.local.activity") || "[]");
        arr.unshift({ ts: new Date().toISOString(), user: State.session ? State.session.username : "", text });
        localStorage.setItem("aurora.local.activity", JSON.stringify(arr.slice(0, 300)));
      } catch { /* ignore */ }
    },
    async activityList() {
      try { return { ok: true, activity: JSON.parse(localStorage.getItem("aurora.local.activity") || "[]") }; }
      catch { return { ok: true, activity: [] }; }
    },

    async register(p) {
      const users = this._users();
      const username = String(p.username || "").trim().toLowerCase();
      if (username.length < 3) return { ok: false, error: "username_too_short" };
      if (String(p.password || "").length < 8) return { ok: false, error: "password_too_short" };
      if (users[username]) return { ok: false, error: "username_taken" };
      const { salt, hash } = await pbkdf2(p.password);
      const isAdmin = Object.keys(users).length === 0;
      const token = uid() + uid();
      users[username] = {
        username, name: p.name || "", email: p.email || "", phone: p.phone || "",
        role: isAdmin ? "admin" : "staff", salt, hash, token,
        created_at: new Date().toISOString(), last_login_at: new Date().toISOString(),
        needs_password_reset: false,
      };
      this._saveUsers(users);
      return { ok: true, ...this._public(users[username]), token };
    },
    async login(p) {
      const users = this._users();
      const username = String(p.username || "").trim().toLowerCase();
      const u = users[username];
      if (!u) return { ok: false, error: "invalid_credentials" };
      const { hash } = await pbkdf2(p.password, u.salt);
      if (hash !== u.hash) return { ok: false, error: "invalid_credentials" };
      u.token = uid() + uid();
      u.last_login_at = new Date().toISOString();
      this._saveUsers(users);
      return { ok: true, ...this._public(u), token: u.token };
    },
    async verify(p) {
      const users = this._users();
      const u = users[String(p.username || "").toLowerCase()];
      if (!u || u.token !== p.token) return { ok: false, error: "session_invalid" };
      return { ok: true, ...this._public(u), token: u.token };
    },
    async forgot(p) {
      const users = this._users();
      const u = users[String(p.username || "").toLowerCase()];
      if (u) { u.needs_password_reset = true; this._saveUsers(users); }
      return { ok: true, flagged: true };
    },
    async snapshot() {
      let db = this._db();
      if (!db.settings) { db = this._defaults(); this._saveDb(db); }
      return {
        ok: true,
        jobs: db.jobs || [], animals: db.animals || [],
        supplies: db.supplies || [], shifts: db.shifts || [], timelogs: db.timelogs || [],
        settings: db.settings, me: this._public(this._currentUser()),
      };
    },
    async save(collection, item) {
      const db = this._db();
      const isNew = !item.id;
      const list = db[collection + "s"] || [];
      const now = new Date().toISOString();
      const me = State.session ? State.session.username : "";
      if (!item.id) {
        item.id = uid();
        item.createdAt = now;
        item.createdBy = me;
        list.push(item);
      } else {
        const i = list.findIndex((x) => x.id === item.id);
        if (i >= 0) list[i] = { ...list[i], ...item }; else list.push(item);
      }
      item.updatedAt = now;
      item.updatedBy = me;
      if (collection === "job") {
        if (item.status === "done" && !item.completedAt) { item.completedAt = now; item.completedBy = me; }
        if (item.status !== "done") { item.completedAt = ""; item.completedBy = ""; }
      }
      const idx = list.findIndex((x) => x.id === item.id);
      if (idx >= 0) list[idx] = item;
      db[collection + "s"] = list;
      this._saveDb(db);
      if (collection !== "timelog") this._logActivity(`${isNew ? "created" : "updated"} ${collection} “${item.title || item.name || item.id}”`);
      return { ok: true, item };
    },
    async remove(collection, id) {
      const db = this._db();
      db[collection + "s"] = (db[collection + "s"] || []).filter((x) => x.id !== id);
      this._saveDb(db);
      if (collection !== "timelog") this._logActivity(`deleted ${collection} ${id}`);
      return { ok: true };
    },
    async settingsSave(settings) {
      const db = this._db();
      db.settings = { ...db.settings, ...settings, updated_at: new Date().toISOString() };
      this._saveDb(db);
      return { ok: true, settings: db.settings };
    },
    async staffList() {
      const users = this._users();
      return { ok: true, users: Object.values(users).map((u) => ({ username: u.username, name: u.name || "", role: u.role || "staff" })) };
    },
    async adminList() {
      const users = this._users();
      return { ok: true, users: Object.values(users).map((u) => this._public(u)) };
    },
    async adminUpdate(p) {
      const users = this._users();
      const u = users[String(p.target || "").toLowerCase()];
      if (!u) return { ok: false, error: "user_not_found" };
      if (typeof p.name === "string") u.name = p.name;
      if (typeof p.email === "string") u.email = p.email;
      if (typeof p.phone === "string") u.phone = p.phone;
      if (p.role === "admin" || p.role === "staff") u.role = p.role;
      this._saveUsers(users);
      return { ok: true, user: this._public(u) };
    },
    async adminReset(p) {
      const users = this._users();
      const u = users[String(p.target || "").toLowerCase()];
      if (!u) return { ok: false, error: "user_not_found" };
      const { salt, hash } = await pbkdf2(p.new_password);
      u.salt = salt; u.hash = hash; u.token = ""; u.needs_password_reset = false;
      this._saveUsers(users);
      return { ok: true };
    },
    async adminDelete(target) {
      const users = this._users();
      delete users[String(target || "").toLowerCase()];
      this._saveUsers(users);
      return { ok: true };
    },
    _currentUser() {
      const users = this._users();
      return (State.session && users[State.session.username]) || { username: State.session && State.session.username, role: "staff" };
    },
    _public(u) {
      if (!u) return {};
      return {
        username: u.username, name: u.name || "", email: u.email || "", phone: u.phone || "",
        role: u.role || "staff", created_at: u.created_at || "", last_login_at: u.last_login_at || "",
        needs_password_reset: Boolean(u.needs_password_reset),
      };
    },
  };

  let Store = LocalStore; /* swapped to NetworkStore after probe */

  async function probeBackend() {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "config" }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data && data.ok && data.backend);
    } catch {
      return false;
    }
  }

  /* ================================================================
   * STATE
   * ================================================================ */
  const State = {
    session: null,            /* { username, token } */
    me: null,                 /* public user record */
    jobs: [], animals: [], supplies: [], shifts: [], timelogs: [],
    settings: null,
    activeTab: "dashboard",
  };

  function loadSession() {
    try { return JSON.parse(localStorage.getItem(LS.session)); } catch { return null; }
  }
  function saveSession(s) {
    State.session = s;
    if (s) localStorage.setItem(LS.session, JSON.stringify(s));
    else localStorage.removeItem(LS.session);
  }

  async function refresh() {
    const res = await Store.snapshot();
    if (!res.ok) {
      if (res.error === "session_invalid") return signOut();
      toast("Could not load data", "err");
      return;
    }
    State.jobs = res.jobs || [];
    State.animals = res.animals || [];
    State.supplies = res.supplies || [];
    State.shifts = res.shifts || [];
    State.timelogs = res.timelogs || [];
    State.settings = res.settings || State.settings;
    if (res.me && res.me.username) State.me = res.me;
    await generateRecurringJobs();
    renderActive();
    $("#orgNameHeading").textContent = (State.settings && State.settings.orgName) || "Aurora Sanctuary";
  }

  /* ── Recurring jobs ────────────────────────────────────────────────
   * A job with recurrence !== "none" is treated as a TEMPLATE: it is not
   * itself a todo, it spawns a dated instance each day its rule matches.
   * Instances use a deterministic id (templateId + date) so two devices
   * generating at once overwrite the same record instead of duplicating. */
  function isTemplate(j) { return j && j.recurrence && j.recurrence !== "none" && !j.templateId; }

  function recurrenceMatches(template, date) {
    const dow = date.getDay(); /* 0=Sun … 6=Sat */
    switch (template.recurrence) {
      case "daily": return true;
      case "weekdays": return dow >= 1 && dow <= 5;
      case "weekends": return dow === 0 || dow === 6;
      case "weekly": {
        const anchor = template.dueDate || (template.createdAt || "").slice(0, 10);
        if (!anchor) return dow === date.getDay();
        return new Date(anchor + "T00:00:00").getDay() === dow;
      }
      default: return false;
    }
  }

  async function generateRecurringJobs() {
    const today = new Date(todayISO() + "T00:00:00");
    const iso = todayISO();
    const existing = new Set(State.jobs.map((j) => j.id));
    const toCreate = [];
    for (const t of State.jobs) {
      if (!isTemplate(t)) continue;
      if (!recurrenceMatches(t, today)) continue;
      const instanceId = t.id + "_" + iso;
      if (existing.has(instanceId)) continue;
      toCreate.push({
        id: instanceId,
        templateId: t.id,
        title: t.title, description: t.description || "",
        type: t.type || "", category: t.category || "daily",
        assignedTo: t.assignedTo || "", priority: t.priority || "normal",
        animalId: t.animalId || "",
        recurrence: "none", status: t.assignedTo ? "in_progress" : "open",
        dueDate: iso, dueTime: t.dueTime || "",
        createdAt: new Date().toISOString(), createdBy: t.createdBy || State.me.username,
      });
    }
    if (!toCreate.length) return;
    for (const inst of toCreate) {
      const res = await Store.save("job", inst);
      if (res.ok) State.jobs.push(res.item || inst);
    }
  }

  /* A job is overdue if it's actionable, has a due date, and that date/time
     has passed. Templates are never "overdue". */
  function isOverdue(j) {
    if (!j || isTemplate(j) || j.status === "done" || !j.dueDate) return false;
    const now = new Date();
    if (j.dueDate < todayISO()) return true;
    if (j.dueDate === todayISO() && j.dueTime) {
      const [h, m] = j.dueTime.split(":").map(Number);
      const due = new Date(); due.setHours(h || 0, m || 0, 0, 0);
      return now > due;
    }
    return false;
  }

  /* ================================================================
   * AUTH UI
   * ================================================================ */
  const AUTH_ERRORS = {
    username_too_short: "Username must be at least 3 characters.",
    password_too_short: "Password must be at least 8 characters.",
    username_taken: "That username is already taken.",
    invalid_credentials: "Incorrect username or password.",
    credentials_required: "Enter your username and password.",
    too_many_attempts: "Too many attempts. Try again shortly.",
    kv_not_configured: "Backend storage isn't configured yet.",
    session_invalid: "Your session expired. Please sign in again.",
  };
  const authMsg = (e) => AUTH_ERRORS[e] || "Something went wrong. Please try again.";

  function showAuthView(view) {
    $$(".auth-view").forEach((f) => f.classList.toggle("hidden", f.dataset.authView !== view));
    $("#authTitle").textContent = view === "register" ? "Create Account" : view === "forgot" ? "Reset Password" : "Sign In";
  }

  function wireAuth() {
    $$("[data-auth-nav]").forEach((a) =>
      a.addEventListener("click", (e) => { e.preventDefault(); showAuthView(a.dataset.authNav); })
    );

    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#loginError"); err.textContent = "";
      const username = $("#loginUsername").value.trim().toLowerCase();
      const password = $("#loginPassword").value;
      const res = await Store.login({ username, password });
      if (!res.ok) { err.textContent = authMsg(res.error); return; }
      saveSession({ username: res.username, token: res.token });
      State.me = res;
      await enterApp();
    });

    $("#registerForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#registerError"); err.textContent = "";
      const payload = {
        name: $("#registerName").value.trim(),
        username: $("#registerUsername").value.trim().toLowerCase(),
        email: $("#registerEmail").value.trim(),
        phone: $("#registerPhone").value.trim(),
        password: $("#registerPassword").value,
      };
      const res = await Store.register(payload);
      if (!res.ok) { err.textContent = authMsg(res.error); return; }
      saveSession({ username: res.username, token: res.token });
      State.me = res;
      await enterApp();
    });

    $("#forgotForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      $("#forgotError").textContent = "";
      const username = $("#forgotUsername").value.trim().toLowerCase();
      await Store.forgot({ username });
      $("#forgotSuccess").textContent = "If that account exists, an administrator has been notified to reset it.";
    });
  }

  async function enterApp() {
    $("#authOverlay").classList.add("hidden");
    $("#app").classList.remove("hidden");
    $("#userChipName").textContent = State.me.name || State.me.username;
    document.body.classList.toggle("is-admin", State.me.role === "admin");
    setSyncBadge();
    await refresh();
    /* Login reminder: nudge about anything assigned to me that's overdue. */
    const overdue = State.jobs.filter((j) => j.assignedTo === State.me.username && isOverdue(j)).length;
    if (overdue) setTimeout(() => toast(`⏰ You have ${overdue} overdue job${overdue > 1 ? "s" : ""}`, "err"), 400);
  }

  function signOut() {
    saveSession(null);
    State.me = null;
    $("#app").classList.add("hidden");
    $("#authOverlay").classList.remove("hidden");
    showAuthView("login");
  }

  function setSyncBadge() {
    const badge = $("#syncBadge");
    const cloud = Store.mode === "cloud";
    badge.textContent = cloud ? "● Synced" : "● Local";
    badge.className = "sync-badge " + (cloud ? "cloud" : "local");
    badge.title = cloud
      ? "Connected to the shared backend — data syncs across devices."
      : "Local mode — data is stored only on this device/browser.";
    $("#footerMode").textContent = cloud
      ? "Connected to shared backend."
      : "Local demo mode — deploy with Cloudflare KV for multi-user sync.";
    const banner = $("#modeBanner");
    banner.textContent = cloud ? "" : "Demo mode: accounts and data are saved on this device only.";
  }

  /* ================================================================
   * MODAL
   * ================================================================ */
  function openModal(title, bodyNode) {
    $("#modalTitle").textContent = title;
    const body = $("#modalBody");
    body.innerHTML = "";
    body.appendChild(bodyNode);
    $("#modalRoot").classList.remove("hidden");
  }
  function closeModal() { $("#modalRoot").classList.add("hidden"); }

  /* form field builders */
  function field(label, control) {
    return el("label", { class: "f-field" }, el("span", { text: label }), control);
  }
  function input(name, value = "", attrs = {}) {
    return el("input", { name, value: value ?? "", ...attrs });
  }
  function textarea(name, value = "", attrs = {}) {
    const t = el("textarea", { name, ...attrs });
    t.value = value ?? "";
    return t;
  }
  function select(name, options, value = "") {
    const s = el("select", { name });
    for (const o of options) {
      const opt = typeof o === "string" ? { value: o, label: o } : o;
      const node = el("option", { value: opt.value }, opt.label);
      if (String(opt.value) === String(value)) node.selected = true;
      s.appendChild(node);
    }
    return s;
  }
  function formValues(form) {
    const out = {};
    for (const elx of form.elements) {
      if (!elx.name) continue;
      if (elx.type === "checkbox") out[elx.name] = elx.checked;
      else out[elx.name] = elx.value;
    }
    return out;
  }

  function staffOptions(includeUnassigned = true) {
    const opts = includeUnassigned ? [{ value: "", label: "— Unassigned —" }] : [];
    for (const u of State._users || []) opts.push({ value: u.username, label: u.name || u.username });
    return opts;
  }
  function userLabel(username) {
    if (!username) return "Unassigned";
    const u = (State._users || []).find((x) => x.username === username);
    return u ? (u.name || u.username) : username;
  }

  async function loadUsers() {
    const res = await Store.adminList();
    if (res.ok) State._users = res.users;
    return State._users || [];
  }

  /* ================================================================
   * TABS / ROUTER
   * ================================================================ */
  function selectTab(tab) {
    State.activeTab = tab;
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + tab));
    window.scrollTo(0, 0);
    renderActive();
  }

  function wireTabs() {
    $("#tabBar").addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      selectTab(btn.dataset.tab);
    });
    $("#logoutBtn").addEventListener("click", signOut);
    $("#modalClose").addEventListener("click", closeModal);
    $("#modalRoot").addEventListener("click", (e) => { if (e.target.id === "modalRoot") closeModal(); });
  }

  function renderActive() {
    switch (State.activeTab) {
      case "dashboard": return renderDashboard();
      case "todo": return renderTodo();
      case "jobs": return renderJobs();
      case "schedule": return renderSchedule();
      case "animals": return renderAnimals();
      case "supplies": return renderSupplies();
      case "admin": return renderAdmin();
    }
  }

  /* Stamp each <td> with its column header text so the stylesheet can
     reflow the table into labeled stacked cards on small screens. */
  function makeResponsive(table) {
    const heads = $$("thead th", table).map((th) => th.textContent || "");
    $$("tbody tr", table).forEach((tr) => {
      $$("td", tr).forEach((td, i) => { if (heads[i]) td.setAttribute("data-label", heads[i]); });
    });
    return table;
  }

  /* shared section header with an action button */
  function sectionHeader(title, subtitle, actionLabel, onAction) {
    return el("div", { class: "view-head" },
      el("div", {}, el("h2", { text: title }), subtitle ? el("p", { class: "muted", text: subtitle }) : null),
      onAction ? el("button", { class: "primary", onclick: onAction }, actionLabel) : null
    );
  }

  const CATEGORY_LABELS = { daily: "Daytime", after_hours: "After hours", weekend: "Weekend" };
  const PRIORITY_LABELS = { high: "High", normal: "Normal", low: "Low" };

  const inCare = (a) => !/adopt/i.test(a.status || "");

  /* ================================================================
   * VIEW: DASHBOARD (home)
   * ================================================================ */
  function renderDashboard() {
    const view = $("#view-dashboard");
    view.innerHTML = "";

    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    view.appendChild(el("div", { class: "view-head" },
      el("div", {},
        el("h2", { text: `${greet}, ${esc(State.me.name || State.me.username)}` }),
        el("p", { class: "muted", text: new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) }))));

    const animalsInCare = State.animals.filter(inCare);
    const actionable = State.jobs.filter((j) => !isTemplate(j));
    const myOpen = actionable.filter((j) => j.assignedTo === State.me.username && j.status !== "done");
    const myOverdue = myOpen.filter(isOverdue);
    const openUnassigned = actionable.filter((j) => !j.assignedTo && j.status !== "done");
    const todaysShifts = State.shifts.filter((s) => s.date === todayISO())
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
    const animalCount = animalsInCare.length;
    const lowSupplies = State.supplies.filter((s) => {
      const d = daysRemaining(s, animalCount);
      return d != null && d <= (Number(s.reorderDays) || 7);
    });
    const inFoster = State.animals.filter((a) => a.placementType === "Foster" && !a.returnDate).length;
    const thirty = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const adopted30 = State.animals.filter((a) => a.placementType === "Adopted" && (a.placementDate || "") >= thirty).length;

    /* stat tiles */
    const stats = el("div", { class: "stat-grid" },
      statTile("🐾", animalCount, "Animals in care", "animals"),
      statTile("📋", myOpen.length, "My open jobs", "todo", myOverdue.length ? "warn" : ""),
      statTile("⏰", myOverdue.length, "My overdue", "todo", myOverdue.length ? "danger" : ""),
      statTile("📅", todaysShifts.length, "Shifts today", "schedule"),
      statTile("📦", lowSupplies.length, "Low supplies", "supplies", lowSupplies.length ? "danger" : ""),
      statTile("🏡", inFoster, "In foster", "animals"),
      statTile("💚", adopted30, "Adopted (30d)", "animals"),
      statTile("🙋", openUnassigned.length, "Open to claim", "todo"),
    );
    view.appendChild(stats);

    /* time clock + quick actions */
    const open = openTimelog();
    const clock = el("div", { class: "clock-bar" });
    if (open) {
      clock.appendChild(el("div", { class: "clock-status on" },
        el("span", { class: "clock-dot" }),
        el("span", { html: `Clocked in since <strong>${fmtTime((open.clockIn || "").slice(11, 16))}</strong> · ${hoursStr(hoursBetween(open.clockIn, new Date().toISOString()))}` })));
      clock.appendChild(el("button", { class: "primary sm", onclick: clockOut }, "Clock out"));
    } else {
      clock.appendChild(el("div", { class: "clock-status", text: "Not clocked in" }));
      clock.appendChild(el("button", { class: "primary sm", onclick: clockIn }, "Clock in"));
    }
    clock.appendChild(el("span", { class: "clock-week", text: `This week: ${hoursStr(myHoursSince(startOfWeek(new Date()).toISOString()))}` }));
    clock.appendChild(el("button", { class: "ghost sm", onclick: () => printRunSheet() }, "🖨 Daily run sheet"));
    view.appendChild(clock);

    const cols = el("div", { class: "dash-cols" });

    /* my next jobs */
    const jobsCard = el("div", { class: "panel-card" });
    jobsCard.appendChild(el("div", { class: "row-between" },
      el("h3", { text: "My next jobs" }),
      el("button", { class: "link-btn brand", onclick: () => selectTab("todo") }, "View all →")));
    const next = sortJobs([...myOverdue, ...myOpen.filter((j) => !isOverdue(j))]).slice(0, 6);
    if (!next.length) jobsCard.appendChild(el("p", { class: "muted", text: "Nothing assigned right now. 🎉" }));
    next.forEach((j) => jobsCard.appendChild(el("div", { class: "dash-line" + (isOverdue(j) ? " overdue" : ""), onclick: () => selectTab("todo") },
      el("span", { class: "dash-dot pr-" + (j.priority || "normal") }),
      el("span", { class: "dash-line-main", text: j.title || "(untitled)" }),
      el("span", { class: "dash-line-meta", text: isOverdue(j) ? "Overdue" : (j.dueTime ? fmtTime(j.dueTime) : CATEGORY_LABELS[j.category] || "") }))));
    cols.appendChild(jobsCard);

    /* today's schedule */
    const schedCard = el("div", { class: "panel-card" });
    schedCard.appendChild(el("div", { class: "row-between" },
      el("h3", { text: "Today's schedule" }),
      el("button", { class: "link-btn brand", onclick: () => selectTab("schedule") }, "Open →")));
    if (!todaysShifts.length) schedCard.appendChild(el("p", { class: "muted", text: "No shifts scheduled today." }));
    todaysShifts.forEach((s) => schedCard.appendChild(el("div", { class: "dash-line" },
      el("span", { class: "dash-line-meta strong", text: (fmtTime(s.startTime) || "") + (s.endTime ? "–" + fmtTime(s.endTime) : "") }),
      el("span", { class: "dash-line-main", text: userLabel(s.assignedTo) + (s.role ? " · " + s.role : "") }),
      el("span", { class: "chip period-" + (s.period || "day") + "-chip", text: s.period === "after_hours" ? "After hrs" : s.period === "weekend" ? "Weekend" : "Day" }))));
    cols.appendChild(schedCard);

    /* low supplies */
    if (lowSupplies.length) {
      const supCard = el("div", { class: "panel-card" });
      supCard.appendChild(el("div", { class: "row-between" },
        el("h3", { text: "⚠ Reorder soon" }),
        el("button", { class: "link-btn brand", onclick: () => selectTab("supplies") }, "Open →")));
      lowSupplies.forEach((s) => {
        const d = daysRemaining(s, animalCount);
        supCard.appendChild(el("div", { class: "dash-line" },
          el("span", { class: "dash-line-main", text: s.name }),
          el("span", { class: "dash-line-meta", text: `${num(s.quantity)} ${s.unit || ""} · ~${round(d)}d left` })));
      });
      cols.appendChild(supCard);
    }

    view.appendChild(cols);

    /* data export */
    const exportCard = el("div", { class: "panel-card" },
      el("h3", { text: "Export & sharing" }),
      el("p", { class: "muted small", text: "Download a spreadsheet-ready CSV, or open the public adoptable-animals page." }),
      el("div", { class: "export-row" },
        el("button", { class: "ghost", onclick: () => exportCSV("animals") }, "⬇ Animals"),
        el("button", { class: "ghost", onclick: () => exportCSV("jobs") }, "⬇ Jobs"),
        el("button", { class: "ghost", onclick: () => exportCSV("supplies") }, "⬇ Supplies"),
        el("button", { class: "ghost", onclick: () => exportCSV("shifts") }, "⬇ Shifts"),
        el("a", { class: "ghost btn-link", href: "adopt.html", target: "_blank" }, "🌐 Adoptable page")));
    view.appendChild(exportCard);
  }

  function statTile(icon, value, label, tab, tone = "") {
    return el("button", { class: "stat-tile" + (tone ? " tone-" + tone : ""), onclick: () => selectTab(tab) },
      el("span", { class: "stat-icon", text: icon }),
      el("span", { class: "stat-value", text: String(value) }),
      el("span", { class: "stat-label", text: label }));
  }

  /* ── CSV export ────────────────────────────────────────────────── */
  const CSV_COLUMNS = {
    animals: ["name", "species", "breed", "sex", "age", "color", "weight", "status", "kennel", "microchip", "intakeDate", "placementType", "placementPerson", "placementContact", "placementDate", "returnDate", "medical", "feeding", "notes"],
    jobs: ["title", "type", "category", "assignedTo", "priority", "status", "dueDate", "dueTime", "recurrence", "completedAt", "completedBy"],
    supplies: ["name", "category", "unit", "quantity", "perAnimalPerDay", "reorderDays", "notes"],
    shifts: ["date", "period", "startTime", "endTime", "assignedTo", "role", "notes"],
  };
  function csvCell(v) {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportCSV(kind) {
    const cols = CSV_COLUMNS[kind];
    let rows = State[kind] || [];
    if (kind === "jobs") rows = rows.filter((j) => !isTemplate(j)); /* export real jobs, not rules */
    const header = cols.join(",");
    const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\n");
    const csv = header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `aurora-${kind}-${todayISO()}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${rows.length} ${kind}`);
  }

  /* ── Volunteer / staff time clock ──────────────────────────────── */
  function openTimelog() {
    return State.timelogs.find((t) => t.user === State.me.username && !t.clockOut) || null;
  }
  function hoursBetween(a, b) {
    if (!a || !b) return 0;
    return Math.max(0, (Date.parse(b) - Date.parse(a)) / 3600000);
  }
  function hoursStr(h) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}h ${String(mm).padStart(2, "0")}m`;
  }
  function myHoursSince(iso) {
    return State.timelogs
      .filter((t) => t.user === State.me.username && (t.clockIn || "") >= iso)
      .reduce((sum, t) => sum + hoursBetween(t.clockIn, t.clockOut || new Date().toISOString()), 0);
  }
  async function clockIn() {
    if (openTimelog()) return;
    const res = await Store.save("timelog", { user: State.me.username, clockIn: new Date().toISOString(), clockOut: "" });
    if (res.ok) { toast("Clocked in"); await refresh(); }
  }
  async function clockOut() {
    const open = openTimelog();
    if (!open) return;
    const res = await Store.save("timelog", { ...open, clockOut: new Date().toISOString() });
    if (res.ok) { toast("Clocked out"); await refresh(); }
  }

  /* ── Daily run sheet (printable) ───────────────────────────────── */
  function printRunSheet() {
    const surface = $("#printSurface");
    surface.innerHTML = "";
    const orgName = (State.settings && State.settings.orgName) || "Aurora Sanctuary";
    const todays = State.jobs.filter((j) => !isTemplate(j) && j.status !== "done" &&
      (!j.dueDate || j.dueDate <= todayISO()));
    const byCat = { daily: [], after_hours: [], weekend: [] };
    todays.forEach((j) => (byCat[j.category] || byCat.daily).push(j));

    const sheet = el("div", { class: "run-sheet" },
      el("div", { class: "rs-head" },
        el("h1", { text: orgName + " — Daily Run Sheet" }),
        el("div", { text: new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) })));

    ["daily", "after_hours", "weekend"].forEach((cat) => {
      const list = byCat[cat];
      if (!list.length) return;
      sheet.appendChild(el("h2", { class: "rs-cat", text: CATEGORY_LABELS[cat] + " tasks" }));
      const ul = el("div", { class: "rs-tasks" });
      sortJobs(list).forEach((j) => {
        const an = j.animalId && State.animals.find((a) => a.id === j.animalId);
        ul.appendChild(el("div", { class: "rs-task" },
          el("span", { class: "rs-box" }),
          el("span", { class: "rs-task-main" },
            el("strong", { text: j.title || "(task)" }),
            document.createTextNode(
              (j.dueTime ? " · " + fmtTime(j.dueTime) : "") +
              (j.assignedTo ? " · " + userLabel(j.assignedTo) : " · ____________") +
              (an ? " · 🐾 " + an.name : ""))),
        ));
      });
      sheet.appendChild(ul);
    });
    if (!todays.length) sheet.appendChild(el("p", { text: "No open tasks for today." }));

    /* feeding / kennel chart */
    const inCareAnimals = State.animals.filter(inCare).sort((a, b) =>
      String(a.kennel || "~").localeCompare(String(b.kennel || "~"), undefined, { numeric: true }));
    if (inCareAnimals.length) {
      sheet.appendChild(el("h2", { class: "rs-cat", text: "Feeding & kennel chart" }));
      const table = el("table", { class: "rs-table" });
      table.appendChild(el("thead", {}, el("tr", {}, ...["Kennel", "Animal", "Feeding", "AM", "PM", "Notes"].map((h) => el("th", { text: h })))));
      const tb = el("tbody");
      inCareAnimals.forEach((a) => tb.appendChild(el("tr", {},
        el("td", { text: a.kennel || "—" }),
        el("td", {}, el("strong", { text: a.name || "" }), el("div", { class: "rs-sp", text: [a.species, a.status].filter(Boolean).join(" · ") })),
        el("td", { text: a.feeding || "" }),
        el("td", { class: "rs-check" }), el("td", { class: "rs-check" }),
        el("td", {}))));
      table.appendChild(tb);
      sheet.appendChild(table);
    }
    surface.appendChild(sheet);
    document.body.classList.add("printing-cards");
    const cleanup = () => { document.body.classList.remove("printing-cards"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 60);
  }

  /* ================================================================
   * VIEW: MY TODO
   * ================================================================ */
  function renderTodo() {
    const view = $("#view-todo");
    view.innerHTML = "";
    view.appendChild(sectionHeader(
      "My Todo",
      "Jobs assigned to you, plus open jobs anyone can pick up.",
    ));

    const actionable = State.jobs.filter((j) => !isTemplate(j));
    const mineAll = actionable.filter((j) => j.assignedTo === State.me.username && j.status !== "done");
    const overdue = mineAll.filter(isOverdue);
    const mine = mineAll.filter((j) => !isOverdue(j));
    const unassigned = actionable.filter((j) => !j.assignedTo && j.status !== "done");
    const doneToday = actionable.filter((j) =>
      j.assignedTo === State.me.username && j.status === "done" &&
      (j.completedAt || "").slice(0, 10) === todayISO()
    );

    if (!mineAll.length && !unassigned.length) {
      view.appendChild(el("div", { class: "empty" }, "🎉 Nothing on your list right now."));
    }

    if (overdue.length) {
      view.appendChild(el("h3", { class: "group-title overdue", text: `⏰ Overdue (${overdue.length})` }));
      const grid = el("div", { class: "card-grid" });
      sortJobs(overdue).forEach((j) => grid.appendChild(todoCard(j)));
      view.appendChild(grid);
    }
    if (mine.length) {
      view.appendChild(el("h3", { class: "group-title", text: `Assigned to me (${mine.length})` }));
      const grid = el("div", { class: "card-grid" });
      sortJobs(mine).forEach((j) => grid.appendChild(todoCard(j)));
      view.appendChild(grid);
    }
    if (unassigned.length) {
      view.appendChild(el("h3", { class: "group-title", text: `Open — pick up a job (${unassigned.length})` }));
      const grid = el("div", { class: "card-grid" });
      sortJobs(unassigned).forEach((j) => grid.appendChild(todoCard(j, true)));
      view.appendChild(grid);
    }
    if (doneToday.length) {
      view.appendChild(el("h3", { class: "group-title done", text: `Completed today (${doneToday.length})` }));
      const grid = el("div", { class: "card-grid" });
      doneToday.forEach((j) => grid.appendChild(todoCard(j)));
      view.appendChild(grid);
    }
  }

  function sortJobs(list) {
    const pr = { high: 0, normal: 1, low: 2 };
    return [...list].sort((a, b) =>
      (a.dueDate || "9999").localeCompare(b.dueDate || "9999") ||
      (pr[a.priority] ?? 1) - (pr[b.priority] ?? 1) ||
      (a.dueTime || "").localeCompare(b.dueTime || "")
    );
  }

  function todoCard(j, claimable = false) {
    const animal = j.animalId && State.animals.find((a) => a.id === j.animalId);
    const done = j.status === "done";
    const overdue = isOverdue(j);
    const card = el("div", { class: "job-card pr-" + (j.priority || "normal") + (done ? " is-done" : "") + (overdue ? " is-overdue" : "") });
    card.appendChild(el("div", { class: "job-card-top" },
      el("span", { class: "chip cat-" + (j.category || "daily"), text: CATEGORY_LABELS[j.category] || "Daytime" }),
      j.priority === "high" ? el("span", { class: "chip danger", text: "High" }) : null,
      overdue ? el("span", { class: "chip danger", text: "Overdue" }) : null,
      j.dueDate ? el("span", { class: "chip " + (overdue ? "danger" : "ghost"), text: fmtDate(j.dueDate) + (j.dueTime ? " · " + fmtTime(j.dueTime) : "") }) : null,
    ));
    card.appendChild(el("h4", { text: j.title || "(untitled)" }));
    if (j.description) card.appendChild(el("p", { class: "muted small", text: j.description }));
    if (animal) card.appendChild(el("p", { class: "small", html: `🐾 <strong>${esc(animal.name)}</strong>${animal.kennel ? " · " + esc(animal.kennel) : ""}` }));

    const actions = el("div", { class: "job-actions" });
    if (done) {
      actions.appendChild(el("span", { class: "done-label", text: "✓ Done" }));
      actions.appendChild(el("button", { class: "link-btn", onclick: () => setJobStatus(j, "open") }, "Reopen"));
    } else if (claimable) {
      actions.appendChild(el("button", { class: "primary sm", onclick: () => claimJob(j) }, "Claim"));
      actions.appendChild(el("button", { class: "sm", onclick: () => setJobStatus(j, "done") }, "Mark done"));
    } else {
      actions.appendChild(el("button", { class: "primary sm", onclick: () => setJobStatus(j, "done") }, "Mark done"));
      if (canManage()) actions.appendChild(el("button", { class: "link-btn", onclick: () => openJobForm(j) }, "Edit"));
    }
    card.appendChild(actions);
    return card;
  }

  async function claimJob(j) {
    const res = await Store.save("job", { ...j, assignedTo: State.me.username, status: "in_progress" });
    if (res.ok) { toast("Job claimed"); await refresh(); }
  }
  async function setJobStatus(j, status) {
    const res = await Store.save("job", { ...j, status });
    if (res.ok) { toast(status === "done" ? "Marked done" : "Reopened"); await refresh(); }
  }

  /* ================================================================
   * VIEW: JOBS (manage / assign)
   * ================================================================ */
  function renderJobs() {
    const view = $("#view-jobs");
    view.innerHTML = "";
    view.appendChild(sectionHeader(
      "Jobs", "Create, assign, and schedule work across the sanctuary.",
      "+ New job", () => openJobForm()
    ));

    /* filter bar */
    State._jobFilter = State._jobFilter || { category: "", status: "open", assignee: "" };
    const f = State._jobFilter;
    const bar = el("div", { class: "filter-bar" },
      labeledSelect("Category", ["", "daily", "after_hours", "weekend"].map((v) => ({
        value: v, label: v ? CATEGORY_LABELS[v] : "All categories",
      })), f.category, (v) => { f.category = v; renderJobs(); }),
      labeledSelect("Status", [
        { value: "open", label: "Open / active" },
        { value: "done", label: "Completed" },
        { value: "templates", label: "Recurring rules" },
        { value: "", label: "All (no templates)" },
      ], f.status, (v) => { f.status = v; renderJobs(); }),
      labeledSelect("Assignee", [{ value: "", label: "Everyone" }, { value: "__none", label: "Unassigned" }, ...staffOptions(false)], f.assignee, (v) => { f.assignee = v; renderJobs(); }),
    );
    view.appendChild(bar);

    const showTemplates = f.status === "templates";
    let list = State.jobs.filter((j) => showTemplates ? isTemplate(j) : !isTemplate(j));
    if (f.category) list = list.filter((j) => j.category === f.category);
    if (f.status === "open") list = list.filter((j) => j.status !== "done");
    else if (f.status === "done") list = list.filter((j) => j.status === "done");
    if (f.assignee === "__none") list = list.filter((j) => !j.assignedTo);
    else if (f.assignee) list = list.filter((j) => j.assignedTo === f.assignee);

    if (showTemplates) {
      view.appendChild(el("p", { class: "muted small", text: "Recurring rules generate a fresh job each day they apply. Edit or delete a rule here; existing generated jobs are unaffected." }));
    }
    if (!list.length) { view.appendChild(el("div", { class: "empty" }, showTemplates ? "No recurring rules yet. Create a job and set it to repeat." : "No jobs match these filters.")); return; }

    const table = el("table", { class: "data-table" });
    table.appendChild(el("thead", {}, el("tr", {},
      ...["Job", "Category", "Assigned to", "Due", "Priority", "Status", ""].map((h) => el("th", { text: h }))
    )));
    const tbody = el("tbody");
    sortJobs(list).forEach((j) => {
      const animal = j.animalId && State.animals.find((a) => a.id === j.animalId);
      const overdue = isOverdue(j);
      tbody.appendChild(el("tr", { class: j.status === "done" ? "row-done" : (overdue ? "row-overdue" : "") },
        el("td", {}, el("strong", { text: j.title || "(untitled)" }),
          animal ? el("div", { class: "muted small", text: "🐾 " + animal.name }) : null,
          isTemplate(j) ? el("div", { class: "muted small", text: "↻ " + (j.recurrence || "") }) : null),
        el("td", {}, el("span", { class: "chip cat-" + (j.category || "daily"), text: CATEGORY_LABELS[j.category] || "Daytime" })),
        el("td", { text: userLabel(j.assignedTo) }),
        el("td", { text: isTemplate(j) ? "↻ " + (j.recurrence || "") : (j.dueDate ? fmtDate(j.dueDate) + (j.dueTime ? " " + fmtTime(j.dueTime) : "") : "—") }),
        el("td", {}, el("span", { class: "chip " + (j.priority === "high" ? "danger" : "ghost"), text: PRIORITY_LABELS[j.priority] || "Normal" })),
        el("td", {}, isTemplate(j) ? el("span", { class: "chip info", text: "Recurring" }) : (overdue ? el("span", { class: "chip danger", text: "Overdue" }) : statusChip(j))),
        el("td", { class: "row-actions" },
          el("button", { class: "link-btn", onclick: () => openJobForm(j) }, "Edit"),
          el("button", { class: "link-btn danger", onclick: () => removeItem("job", j.id, "Delete this job?") }, "Delete"))
      ));
    });
    table.appendChild(tbody);
    view.appendChild(el("div", { class: "table-wrap" }, makeResponsive(table)));
  }

  function statusChip(j) {
    const map = { open: ["ghost", "Open"], in_progress: ["warn", "In progress"], done: ["ok", "Done"] };
    const [cls, label] = map[j.status] || map.open;
    return el("span", { class: "chip " + cls, text: label });
  }

  function labeledSelect(label, options, value, onChange) {
    const s = select("_", options, value);
    s.addEventListener("change", () => onChange(s.value));
    return el("label", { class: "filter-field" }, el("span", { text: label }), s);
  }

  function openJobForm(job) {
    const j = job || { category: "daily", priority: "normal", status: "open", recurrence: "none", dueDate: todayISO() };
    const cats = (State.settings.jobCategories || []);
    const form = el("form", { class: "modal-form" },
      field("Title", input("title", j.title, { required: true, placeholder: "e.g. Morning kennel cleaning" })),
      field("Details", textarea("description", j.description, { rows: 3, placeholder: "Instructions, location, anything staff should know" })),
      el("div", { class: "form-row" },
        field("Type of job", select("type", cats.length ? cats : ["Other"], j.type || "")),
        field("When", select("category", [
          { value: "daily", label: "Daytime" },
          { value: "after_hours", label: "After hours" },
          { value: "weekend", label: "Weekend" },
        ], j.category)),
      ),
      el("div", { class: "form-row" },
        field("Assign to", select("assignedTo", staffOptions(), j.assignedTo || "")),
        field("Priority", select("priority", [
          { value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" },
        ], j.priority)),
      ),
      el("div", { class: "form-row" },
        field("Due date", input("dueDate", j.dueDate, { type: "date" })),
        field("Due time", input("dueTime", j.dueTime, { type: "time" })),
      ),
      el("div", { class: "form-row" },
        field("Repeats", select("recurrence", [
          { value: "none", label: "Does not repeat" },
          { value: "daily", label: "Every day" },
          { value: "weekdays", label: "Weekdays (Mon–Fri)" },
          { value: "weekly", label: "Weekly" },
          { value: "weekends", label: "Weekends (Sat/Sun)" },
        ], j.recurrence || "none")),
        field("Related animal", select("animalId", [{ value: "", label: "— None —" },
          ...State.animals.map((a) => ({ value: a.id, label: a.name + (a.kennel ? " (" + a.kennel + ")" : "") }))], j.animalId || "")),
      ),
      el("div", { class: "modal-actions" },
        job ? el("button", { type: "button", class: "link-btn danger", onclick: () => { closeModal(); removeItem("job", job.id, "Delete this job?"); } }, "Delete") : el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: closeModal }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, job ? "Save changes" : "Create job"))
      ),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      if (!v.title.trim()) { toast("Title is required", "err"); return; }
      const next = { ...j, ...v };
      if (next.assignedTo && next.status === "open") next.status = "in_progress";
      const res = await Store.save("job", next);
      if (res.ok) { closeModal(); toast(job ? "Job updated" : "Job created"); await refresh(); }
      else toast("Could not save job", "err");
    });
    openModal(job ? "Edit job" : "New job", form);
  }

  /* ================================================================
   * VIEW: SCHEDULE (shifts)
   * ================================================================ */
  function renderSchedule() {
    const view = $("#view-schedule");
    view.innerHTML = "";
    view.appendChild(sectionHeader(
      "Schedule", "Assign coverage across daytime, after-hours, and weekends.",
      "+ Add shift", () => openShiftForm()
    ));

    /* week navigation */
    State._weekStart = State._weekStart || startOfWeek(new Date());
    const ws = State._weekStart;
    const nav = el("div", { class: "week-nav" },
      el("button", { class: "ghost sm", onclick: () => { State._weekStart = addDays(ws, -7); renderSchedule(); } }, "← Prev"),
      el("strong", { text: weekLabel(ws) }),
      el("button", { class: "ghost sm", onclick: () => { State._weekStart = addDays(ws, 7); renderSchedule(); } }, "Next →"),
      el("button", { class: "link-btn", onclick: () => { State._weekStart = startOfWeek(new Date()); renderSchedule(); } }, "This week"),
    );
    view.appendChild(nav);

    const days = [...Array(7)].map((_, i) => addDays(ws, i));
    const board = el("div", { class: "week-board" });
    days.forEach((day) => {
      const iso = day.toISOString().slice(0, 10);
      const isToday = iso === todayISO();
      const col = el("div", { class: "day-col" + (isToday ? " today" : "") });
      col.appendChild(el("div", { class: "day-head" },
        el("span", { text: day.toLocaleDateString(undefined, { weekday: "short" }) }),
        el("span", { class: "day-num", text: String(day.getDate()) })));
      const dayShifts = State.shifts.filter((s) => s.date === iso)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
      if (!dayShifts.length) col.appendChild(el("div", { class: "day-empty", text: "—" }));
      dayShifts.forEach((s) => {
        col.appendChild(el("div", { class: "shift-pill period-" + (s.period || "day"), onclick: () => openShiftForm(s) },
          el("div", { class: "shift-time", text: (fmtTime(s.startTime) || "") + (s.endTime ? "–" + fmtTime(s.endTime) : "") }),
          el("div", { class: "shift-who", text: userLabel(s.assignedTo) }),
          s.role ? el("div", { class: "shift-role", text: s.role }) : null,
        ));
      });
      col.appendChild(el("button", { class: "day-add", onclick: () => openShiftForm({ date: iso }) }, "+"));
      board.appendChild(col);
    });
    view.appendChild(board);
  }

  function openShiftForm(shift) {
    const s = shift || { date: todayISO(), period: "day", startTime: "08:00", endTime: "16:00" };
    const form = el("form", { class: "modal-form" },
      el("div", { class: "form-row" },
        field("Date", input("date", s.date, { type: "date", required: true })),
        field("Coverage", select("period", [
          { value: "day", label: "Daytime" },
          { value: "after_hours", label: "After hours" },
          { value: "weekend", label: "Weekend" },
        ], s.period)),
      ),
      el("div", { class: "form-row" },
        field("Start", input("startTime", s.startTime, { type: "time" })),
        field("End", input("endTime", s.endTime, { type: "time" })),
      ),
      field("Worker", select("assignedTo", staffOptions(), s.assignedTo || "")),
      field("Role / area", input("role", s.role, { placeholder: "e.g. Kennels, Front desk, On-call" })),
      field("Notes", textarea("notes", s.notes, { rows: 2 })),
      el("div", { class: "modal-actions" },
        shift ? el("button", { type: "button", class: "link-btn danger", onclick: () => { closeModal(); removeItem("shift", shift.id, "Delete this shift?"); } }, "Delete") : el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: closeModal }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, shift ? "Save" : "Add shift"))
      ),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      const res = await Store.save("shift", { ...s, ...v });
      if (res.ok) { closeModal(); toast(shift ? "Shift saved" : "Shift added"); await refresh(); }
    });
    openModal(shift ? "Edit shift" : "New shift", form);
  }

  function startOfWeek(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay()); /* Sunday start */
    return x;
  }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function weekLabel(ws) {
    const we = addDays(ws, 6);
    const opt = { month: "short", day: "numeric" };
    return ws.toLocaleDateString(undefined, opt) + " – " + we.toLocaleDateString(undefined, opt);
  }

  /* ================================================================
   * VIEW: ANIMALS
   * ================================================================ */
  function renderAnimals() {
    const view = $("#view-animals");
    view.innerHTML = "";
    State._animalView = State._animalView || "list";
    view.appendChild(sectionHeader(
      "Animals", `${State.animals.filter(inCare).length} in care`,
      "+ Add animal", () => openAnimalForm()
    ));

    /* List / Kennel-map toggle */
    const seg = el("div", { class: "segmented" },
      el("button", { class: "seg" + (State._animalView === "list" ? " active" : ""), onclick: () => { State._animalView = "list"; renderAnimals(); } }, "List"),
      el("button", { class: "seg" + (State._animalView === "map" ? " active" : ""), onclick: () => { State._animalView = "map"; renderAnimals(); } }, "🗺 Kennel map"));
    view.appendChild(seg);

    if (State._animalView === "map") { renderKennelMap(view); return; }

    State._animalFilter = State._animalFilter || { q: "", status: "" };
    const f = State._animalFilter;
    const search = input("_", f.q, { placeholder: "Search name, species, kennel…", type: "search" });
    search.addEventListener("input", () => { f.q = search.value; renderAnimalGrid(); });
    const statusSel = select("_", [{ value: "", label: "All statuses" }, ...(State.settings.animalStatuses || [])], f.status);
    statusSel.addEventListener("change", () => { f.status = statusSel.value; renderAnimalGrid(); });
    view.appendChild(el("div", { class: "filter-bar" },
      el("label", { class: "filter-field grow" }, el("span", { text: "Search" }), search),
      el("label", { class: "filter-field" }, el("span", { text: "Status" }), statusSel),
      el("button", { class: "ghost", onclick: () => printKennelCards(filteredAnimals()) }, "🖨 Print all cards"),
    ));

    const host = el("div", { id: "animalGridHost" });
    view.appendChild(host);
    renderAnimalGrid();
  }

  /* Visual grid of kennels/cages showing occupancy. */
  function renderKennelMap(view) {
    const kennels = (State.settings.kennels || []).slice();
    const byKennel = new Map();
    let unassigned = [];
    for (const a of State.animals.filter(inCare)) {
      if (!a.kennel) { unassigned.push(a); continue; }
      if (!byKennel.has(a.kennel)) byKennel.set(a.kennel, []);
      byKennel.get(a.kennel).push(a);
    }
    /* include custom kennels (used but not in settings list) */
    for (const k of byKennel.keys()) if (!kennels.includes(k)) kennels.push(k);

    const occupied = kennels.filter((k) => (byKennel.get(k) || []).length).length;
    view.appendChild(el("p", { class: "muted small", text: `${occupied} of ${kennels.length} kennels occupied · ${unassigned.length} animal${unassigned.length === 1 ? "" : "s"} unassigned` }));

    if (!kennels.length) {
      view.appendChild(el("div", { class: "empty" }, "No kennels yet. Add your kennel/cage list in Admin → Sanctuary settings."));
    }
    const grid = el("div", { class: "kennel-map" });
    kennels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach((k) => {
      const occ = byKennel.get(k) || [];
      const tile = el("div", { class: "kennel-tile " + (occ.length ? "occupied" : "open") });
      tile.appendChild(el("div", { class: "kennel-tile-name", text: k }));
      if (!occ.length) {
        tile.appendChild(el("div", { class: "kennel-open-label", text: "Open" }));
      } else {
        occ.forEach((a) => tile.appendChild(el("div", { class: "kennel-occupant", onclick: () => openAnimalDetail(a) },
          a.photo
            ? el("span", { class: "kennel-av photo", style: `background-image:url(${a.photo})` })
            : el("span", { class: "kennel-av", text: speciesEmoji(a.species) }),
          el("span", { class: "kennel-occ-name", text: a.name || "(unnamed)" }),
          el("span", { class: "dot " + statusClass(a.status), title: a.status || "" }))));
      }
      grid.appendChild(tile);
    });
    view.appendChild(grid);

    if (unassigned.length) {
      view.appendChild(el("h3", { class: "group-title", text: `Unassigned (${unassigned.length})` }));
      const ug = el("div", { class: "kennel-unassigned" });
      unassigned.sort((a, b) => (a.name || "").localeCompare(b.name || "")).forEach((a) =>
        ug.appendChild(el("button", { class: "chip-btn", onclick: () => openAnimalDetail(a) }, speciesEmoji(a.species) + " " + (a.name || "(unnamed)"))));
      view.appendChild(ug);
    }
  }

  function filteredAnimals() {
    const f = State._animalFilter || { q: "", status: "" };
    const q = f.q.trim().toLowerCase();
    return State.animals.filter((a) => {
      if (f.status && a.status !== f.status) return false;
      if (!q) return true;
      return [a.name, a.species, a.breed, a.kennel, a.color].some((x) => String(x || "").toLowerCase().includes(q));
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  function renderAnimalGrid() {
    const host = $("#animalGridHost");
    if (!host) return;
    host.innerHTML = "";
    const list = filteredAnimals();
    if (!list.length) { host.appendChild(el("div", { class: "empty" }, "No animals match.")); return; }
    const grid = el("div", { class: "animal-grid" });
    list.forEach((a) => {
      const openJobs = State.jobs.filter((j) => j.animalId === a.id && j.status !== "done").length;
      grid.appendChild(el("div", { class: "animal-card", onclick: () => openAnimalDetail(a) },
        el("div", { class: "animal-card-head" },
          a.photo
            ? el("span", { class: "animal-avatar photo", style: `background-image:url(${a.photo})` })
            : el("span", { class: "animal-avatar", text: speciesEmoji(a.species) }),
          el("div", {}, el("h4", { text: a.name || "(unnamed)" }),
            el("p", { class: "muted small", text: [a.species, a.breed].filter(Boolean).join(" · ") || "—" })),
        ),
        el("div", { class: "animal-meta" },
          el("span", { class: "chip " + statusClass(a.status), text: a.status || "—" }),
          a.kennel ? el("span", { class: "chip ghost", text: "📍 " + a.kennel }) : null,
          openJobs ? el("span", { class: "chip warn", text: openJobs + " job" + (openJobs > 1 ? "s" : "") }) : null,
        ),
      ));
    });
    host.appendChild(grid);
  }

  function speciesEmoji(species) {
    const s = String(species || "").toLowerCase();
    if (s.includes("dog") || s.includes("pup")) return "🐕";
    if (s.includes("cat") || s.includes("kit")) return "🐈";
    if (s.includes("rabbit") || s.includes("bun")) return "🐇";
    if (s.includes("bird")) return "🐦";
    if (s.includes("horse")) return "🐴";
    if (s.includes("pig")) return "🐖";
    if (s.includes("goat")) return "🐐";
    if (s.includes("reptile") || s.includes("snake") || s.includes("liz")) return "🦎";
    return "🐾";
  }
  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s.includes("avail")) return "ok";
    if (s.includes("medical") || s.includes("quaran")) return "danger";
    if (s.includes("hold") || s.includes("foster")) return "warn";
    if (s.includes("adopt")) return "info";
    return "ghost";
  }

  function openAnimalDetail(a) {
    const jobs = State.jobs.filter((j) => j.animalId === a.id);
    const openJobs = jobs.filter((j) => j.status !== "done");
    const rows = (label, val) => val ? el("div", { class: "kv" }, el("span", { class: "k", text: label }), el("span", { class: "v", text: val })) : null;
    const body = el("div", { class: "animal-detail" },
      a.photo ? el("img", { class: "detail-photo", src: a.photo, alt: a.name || "" }) : null,
      el("div", { class: "detail-grid" },
        rows("Species", a.species), rows("Breed", a.breed), rows("Sex", a.sex),
        rows("Age", a.age), rows("Color", a.color), rows("Weight", a.weight),
        rows("Status", a.status), rows("Kennel / cage", a.kennel),
        rows("Microchip", a.microchip), rows("Intake date", a.intakeDate ? fmtDate(a.intakeDate) : ""),
      ),
      a.medical ? el("div", { class: "detail-block" }, el("h4", { text: "Medical" }), el("p", { text: a.medical })) : null,
      a.feeding ? el("div", { class: "detail-block" }, el("h4", { text: "Feeding" }), el("p", { text: a.feeding })) : null,
      a.notes ? el("div", { class: "detail-block" }, el("h4", { text: "Notes" }), el("p", { text: a.notes })) : null,
      placementSection(a),
      medicalLogSection(a),
      el("div", { class: "detail-block" },
        el("h4", { text: `Jobs (${openJobs.length} open)` }),
        openJobs.length
          ? el("ul", { class: "mini-list" }, ...openJobs.map((j) => el("li", { text: `${j.title} — ${userLabel(j.assignedTo)}` })))
          : el("p", { class: "muted", text: "No open jobs." }),
        el("button", { class: "link-btn", onclick: () => { closeModal(); openJobForm({ animalId: a.id, category: "daily", priority: "normal", status: "open", dueDate: todayISO() }); } }, "+ Add job for this animal"),
      ),
      el("div", { class: "modal-actions" },
        el("button", { type: "button", class: "link-btn danger", onclick: () => { closeModal(); removeItem("animal", a.id, `Remove ${a.name}? This cannot be undone.`); } }, "Delete"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: () => openShareModal(a) }, "🔗 Share / QR"),
          el("button", { type: "button", class: "ghost", onclick: () => printKennelCards([a]) }, "🖨 Kennel card"),
          el("button", { type: "button", class: "primary", onclick: () => openAnimalForm(a) }, "Edit"))
      ),
    );
    openModal(a.name || "Animal", body);
  }

  /* ── Share / QR for a public adoptable profile ─────────────────── */
  function publicUrlFor(a) {
    return new URL("adopt.html?id=" + encodeURIComponent(a.id), location.href).href;
  }
  function qrSvg(text, cell = 5) {
    if (typeof qrcode === "undefined") return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      const svg = qr.createSvgTag({ cellSize: cell, margin: cell * 2, scalable: true });
      const wrap = el("div", { class: "qr-wrap" });
      wrap.innerHTML = svg;
      return wrap;
    } catch { return null; }
  }
  function openShareModal(a) {
    const url = publicUrlFor(a);
    const body = el("div", { class: "share-modal" });

    if (!a.shareable) {
      body.appendChild(el("div", { class: "alert" },
        document.createTextNode("This animal isn't public yet. Turn on sharing to let the QR link show their profile. "),
        el("button", { class: "link-btn brand", onclick: async () => { await patchAnimal(a, { shareable: true }, false); a.shareable = true; openShareModal(a); } }, "Make public →")));
    }
    const qr = qrSvg(url, 6);
    if (qr) body.appendChild(qr);
    else body.appendChild(el("p", { class: "muted", text: "QR code unavailable." }));

    body.appendChild(el("p", { class: "muted small", text: a.shareable ? "Anyone with this link or QR code can view a public profile (name, photo, basic info) for this animal." : "Preview — the link won't work for the public until you make the animal public and deploy the site." }));
    const link = input("_", url, { readonly: true, class: "share-link" });
    body.appendChild(el("div", { class: "share-link-row" }, link,
      el("button", { class: "ghost sm", onclick: () => { link.select && link.select(); navigator.clipboard && navigator.clipboard.writeText(url); toast("Link copied"); } }, "Copy")));

    body.appendChild(el("div", { class: "modal-actions" },
      el("label", { class: "share-toggle" },
        (() => { const cb = el("input", { type: "checkbox" }); if (a.shareable) cb.checked = true; cb.addEventListener("change", async () => { await patchAnimal(a, { shareable: cb.checked }, false); a.shareable = cb.checked; toast(cb.checked ? "Now public" : "No longer public"); }); return cb; })(),
        el("span", { text: " Visible on public adoptable page" })),
      el("div", {},
        el("button", { class: "ghost", onclick: () => printQR(a, url) }, "🖨 Print QR"),
        el("button", { class: "primary", onclick: () => openAnimalDetail(a) }, "Done"))));
    openModal("Share " + (a.name || "animal"), body);
  }
  function printQR(a, url) {
    const surface = $("#printSurface");
    surface.innerHTML = "";
    const orgName = (State.settings && State.settings.orgName) || "Aurora Sanctuary";
    const card = el("div", { class: "qr-print" },
      el("div", { class: "qr-print-org", text: orgName }),
      el("h1", { class: "qr-print-name", text: (a.name || "") + (a.species ? " · " + a.species : "") }),
      el("p", { class: "qr-print-sub", text: "Scan to meet me and learn more!" }));
    const qr = qrSvg(url, 8);
    if (qr) card.appendChild(qr);
    card.appendChild(el("p", { class: "qr-print-url", text: url }));
    surface.appendChild(card);
    document.body.classList.add("printing-cards");
    const cleanup = () => { document.body.classList.remove("printing-cards"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 60);
  }

  /* Save a patch to an animal, refresh, then re-open its detail so inline
     sub-entries (log, placement, applications) update live. */
  async function patchAnimal(a, patch, reopen = true) {
    const res = await Store.save("animal", { ...a, ...patch });
    if (!res.ok) { toast("Could not save", "err"); return null; }
    await refresh();
    if (reopen) {
      const fresh = State.animals.find((x) => x.id === (res.item ? res.item.id : a.id));
      if (fresh) openAnimalDetail(fresh);
    }
    return res.item || { ...a, ...patch };
  }

  /* ── Adoption / foster placement + applications ────────────────── */
  const APP_STATUS = ["applied", "approved", "declined", "adopted"];
  function placementSection(a) {
    const apps = Array.isArray(a.applications) ? a.applications : [];
    const block = el("div", { class: "detail-block" }, el("h4", { text: "Adoption / Foster" }));

    if (a.placementType) {
      block.appendChild(el("div", { class: "placement-card" },
        el("div", {}, el("span", { class: "chip " + (a.placementType === "Adopted" ? "info" : "warn"), text: a.placementType }),
          a.placementPerson ? el("strong", { class: "placement-person", text: " " + a.placementPerson }) : null),
        el("div", { class: "muted small" },
          (a.placementDate ? "Since " + fmtDate(a.placementDate) : "") +
          (a.placementContact ? " · " + a.placementContact : "") +
          (a.returnDate ? " · returned " + fmtDate(a.returnDate) : "")),
        a.placementNote ? el("div", { class: "small", text: a.placementNote }) : null,
      ));
    } else {
      block.appendChild(el("p", { class: "muted small", text: "No active foster or adoption recorded." }));
    }
    block.appendChild(el("button", { class: "link-btn brand", onclick: () => openPlacementForm(a) }, a.placementType ? "Update placement" : "+ Record foster / adoption"));

    /* applications */
    block.appendChild(el("div", { class: "sub-head", text: `Applications (${apps.length})` }));
    if (apps.length) {
      const list = el("div", { class: "app-list" });
      apps.slice().sort((x, y) => (y.date || "").localeCompare(x.date || "")).forEach((ap) => {
        list.appendChild(el("div", { class: "app-row" },
          el("div", {}, el("strong", { text: ap.applicant || "—" }),
            ap.contact ? el("span", { class: "muted small", text: " · " + ap.contact }) : null,
            ap.note ? el("div", { class: "muted small", text: ap.note }) : null),
          el("div", { class: "app-row-right" },
            el("span", { class: "chip " + (ap.status === "approved" || ap.status === "adopted" ? "ok" : ap.status === "declined" ? "danger" : "ghost"), text: ap.status || "applied" }),
            el("span", { class: "muted small", text: ap.date ? fmtDate(ap.date) : "" }),
            el("button", { class: "link-btn danger", onclick: () => removeApplication(a, ap.id) }, "✕"))));
      });
      block.appendChild(list);
    }
    block.appendChild(el("button", { class: "link-btn brand", onclick: () => openApplicationForm(a) }, "+ Add application"));
    return block;
  }

  function openPlacementForm(a) {
    const statuses = State.settings.animalStatuses || [];
    const form = el("form", { class: "modal-form" },
      el("div", { class: "form-row" },
        field("Placement", select("placementType", ["", "Foster", "Adopted"], a.placementType || "")),
        field("Date", input("placementDate", a.placementDate || todayISO(), { type: "date" })),
      ),
      field("Person / family", input("placementPerson", a.placementPerson, { placeholder: "Foster or adopter name" })),
      field("Contact", input("placementContact", a.placementContact, { placeholder: "Phone or email" })),
      el("div", { class: "form-row" },
        field("Return date (if returned)", input("returnDate", a.returnDate, { type: "date" })),
        statuses.length ? field("Also set animal status to", select("syncStatus", ["", ...statuses], "")) : null,
      ),
      field("Note", textarea("placementNote", a.placementNote, { rows: 2 })),
      el("div", { class: "modal-actions" }, el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: () => openAnimalDetail(a) }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, "Save"))),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      const patch = {
        placementType: v.placementType, placementDate: v.placementDate,
        placementPerson: v.placementPerson, placementContact: v.placementContact,
        returnDate: v.returnDate, placementNote: v.placementNote,
      };
      if (v.syncStatus) patch.status = v.syncStatus;
      await patchAnimal(a, patch);
    });
    openModal("Foster / adoption", form);
  }

  function openApplicationForm(a) {
    const form = el("form", { class: "modal-form" },
      field("Applicant name", input("applicant", "", { required: true })),
      field("Contact", input("contact", "", { placeholder: "Phone or email" })),
      el("div", { class: "form-row" },
        field("Date", input("date", todayISO(), { type: "date" })),
        field("Status", select("status", APP_STATUS, "applied")),
      ),
      field("Note", textarea("note", "", { rows: 2 })),
      el("div", { class: "modal-actions" }, el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: () => openAnimalDetail(a) }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, "Add"))),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      if (!v.applicant.trim()) { toast("Applicant name required", "err"); return; }
      const apps = Array.isArray(a.applications) ? a.applications.slice() : [];
      apps.push({ id: uid(), applicant: v.applicant, contact: v.contact, date: v.date, status: v.status, note: v.note });
      await patchAnimal(a, { applications: apps });
    });
    openModal("New application", form);
  }
  async function removeApplication(a, id) {
    const apps = (a.applications || []).filter((x) => x.id !== id);
    await patchAnimal(a, { applications: apps });
  }

  /* ── Medical & weight log ──────────────────────────────────────── */
  const LOG_TYPES = ["Weight", "Vaccine", "Medication", "Exam", "Note"];
  function medicalLogSection(a) {
    const log = Array.isArray(a.history) ? a.history.slice() : [];
    log.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
    const block = el("div", { class: "detail-block" }, el("h4", { text: "Medical & weight log" }));

    const weights = log.filter((e) => e.type === "Weight" && e.value).map((e) => ({ date: e.date, n: parseFloat(e.value), unit: e.unit || "" }))
      .filter((w) => !isNaN(w.n));
    if (weights.length) {
      const latest = weights[0];
      const prev = weights[1];
      const delta = prev ? latest.n - prev.n : 0;
      block.appendChild(el("div", { class: "weight-trend" },
        el("span", { class: "weight-now", text: `${latest.n} ${latest.unit}` }),
        prev ? el("span", { class: "weight-delta " + (delta > 0 ? "up" : delta < 0 ? "down" : ""), text: (delta > 0 ? "▲ +" : delta < 0 ? "▼ " : "± ") + round(Math.abs(delta)) + " " + latest.unit + " since " + fmtDate(prev.date) }) : el("span", { class: "muted small", text: "latest weight" })));
    }

    if (log.length) {
      const list = el("div", { class: "log-list" });
      log.forEach((e) => {
        list.appendChild(el("div", { class: "log-row" },
          el("span", { class: "log-date", text: e.date ? fmtDate(e.date) : "" }),
          el("span", { class: "chip ghost log-type", text: e.type || "Note" }),
          el("span", { class: "log-main" },
            e.value ? el("strong", { text: e.value + (e.unit ? " " + e.unit : "") + (e.note ? " — " : "") }) : null,
            e.note ? document.createTextNode(e.note) : null),
          el("button", { class: "link-btn danger", onclick: () => removeLogEntry(a, e.id) }, "✕")));
      });
      block.appendChild(list);
    } else {
      block.appendChild(el("p", { class: "muted small", text: "No log entries yet." }));
    }
    block.appendChild(el("button", { class: "link-btn brand", onclick: () => openLogForm(a) }, "+ Add log entry"));
    return block;
  }

  function openLogForm(a) {
    const typeSel = select("type", LOG_TYPES, "Weight");
    const unit = input("unit", "lb", { placeholder: "unit", class: "log-unit" });
    const valField = field("Value", el("div", { class: "log-value-row" }, input("value", "", { placeholder: "e.g. 14.2" }), unit));
    const syncWeight = () => { unit.style.display = typeSel.value === "Weight" ? "" : "none"; };
    typeSel.addEventListener("change", syncWeight);
    const form = el("form", { class: "modal-form" },
      el("div", { class: "form-row" },
        field("Type", typeSel),
        field("Date", input("date", todayISO(), { type: "date" })),
      ),
      valField,
      field("Note", textarea("note", "", { rows: 2, placeholder: "Details (vaccine name, dose, findings…)" })),
      el("div", { class: "modal-actions" }, el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: () => openAnimalDetail(a) }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, "Add entry"))),
    );
    syncWeight();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      if (!v.value && !v.note) { toast("Add a value or note", "err"); return; }
      const log = Array.isArray(a.history) ? a.history.slice() : [];
      log.push({ id: uid(), date: v.date, type: v.type, value: v.value, unit: v.type === "Weight" ? v.unit : "", note: v.note, by: State.me.username });
      const patch = { history: log };
      if (v.type === "Weight" && v.value) patch.weight = v.value + (v.unit ? " " + v.unit : ""); /* keep summary weight current */
      await patchAnimal(a, patch);
    });
    openModal("Log entry", form);
  }
  async function removeLogEntry(a, id) {
    const log = (a.history || []).filter((x) => x.id !== id);
    await patchAnimal(a, { history: log });
  }

  function openAnimalForm(animal) {
    const a = animal || { status: (State.settings.animalStatuses || ["Available"])[0], intakeDate: todayISO() };
    const kennelOpts = [{ value: "", label: "— Not assigned —" }, ...(State.settings.kennels || []).map((k) => ({ value: k, label: k })), { value: "__custom", label: "Other (type below)" }];
    const photoState = { url: a.photo || "" };
    const form = el("form", { class: "modal-form" },
      photoField(photoState),
      el("div", { class: "form-row" },
        field("Name", input("name", a.name, { required: true })),
        field("Species", input("species", a.species, { placeholder: "Dog, Cat, Rabbit…", list: "speciesList" })),
      ),
      el("datalist", { id: "speciesList" }, ...["Dog", "Cat", "Rabbit", "Bird", "Horse", "Goat", "Pig", "Reptile"].map((s) => el("option", { value: s }))),
      el("div", { class: "form-row" },
        field("Breed", input("breed", a.breed)),
        field("Sex", select("sex", ["", "Male", "Female", "Male (neutered)", "Female (spayed)", "Unknown"], a.sex || "")),
      ),
      el("div", { class: "form-row" },
        field("Age", input("age", a.age, { placeholder: "e.g. 2 yrs" })),
        field("Color / markings", input("color", a.color)),
        field("Weight", input("weight", a.weight, { placeholder: "e.g. 14 lb" })),
      ),
      el("div", { class: "form-row" },
        field("Status", select("status", State.settings.animalStatuses || ["Available"], a.status)),
        kennelField(a, kennelOpts),
        field("Intake date", input("intakeDate", a.intakeDate, { type: "date" })),
      ),
      field("Microchip #", input("microchip", a.microchip)),
      field("Medical notes", textarea("medical", a.medical, { rows: 2, placeholder: "Vaccinations, meds, conditions" })),
      field("Feeding instructions", textarea("feeding", a.feeding, { rows: 2 })),
      field("General notes", textarea("notes", a.notes, { rows: 2 })),
      el("div", { class: "f-field" }, el("span", { text: "Public profile (adoptable page)" }),
        el("label", { class: "check-row" },
          (() => { const cb = el("input", { type: "checkbox", name: "shareable" }); if (a.shareable) cb.checked = true; return cb; })(),
          el("span", { text: " Show this animal on the public adoptable page / QR" }))),
      field("Public bio", textarea("publicBio", a.publicBio, { rows: 2, placeholder: "Friendly description shown to the public (no medical/private info)" })),
      el("div", { class: "modal-actions" },
        animal ? el("button", { type: "button", class: "link-btn danger", onclick: () => { closeModal(); removeItem("animal", animal.id, `Remove ${animal.name}?`); } }, "Delete") : el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: closeModal }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, animal ? "Save changes" : "Add animal"))
      ),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      if (v.kennel === "__custom") v.kennel = (v.kennelCustom || "").trim();
      delete v.kennelCustom;
      if (!v.name.trim()) { toast("Name is required", "err"); return; }
      const res = await Store.save("animal", { ...a, ...v, photo: photoState.url });
      if (res.ok) { closeModal(); toast(animal ? "Animal updated" : "Animal added"); await refresh(); }
    });
    openModal(animal ? "Edit animal" : "Add animal", form);
  }

  function photoField(photoState) {
    const preview = el("img", { class: "photo-preview" + (photoState.url ? "" : " hidden"), src: photoState.url, alt: "" });
    const fileInput = el("input", { type: "file", accept: "image/*", capture: "environment" });
    const removeBtn = el("button", { type: "button", class: "link-btn danger" + (photoState.url ? "" : " hidden") },
      "Remove photo");
    removeBtn.addEventListener("click", () => { photoState.url = ""; preview.src = ""; preview.classList.add("hidden"); removeBtn.classList.add("hidden"); });
    fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      readImageResized(f, 900, (url) => {
        if (!url) { toast("Could not read image", "err"); return; }
        photoState.url = url; preview.src = url;
        preview.classList.remove("hidden"); removeBtn.classList.remove("hidden");
      });
    });
    return el("div", { class: "f-field photo-field" },
      el("span", { text: "Photo" }),
      preview,
      el("div", { class: "photo-controls" },
        el("label", { class: "photo-pick" }, fileInput, el("span", { class: "photo-pick-btn", text: "📷 Take / choose photo" })),
        removeBtn));
  }

  function kennelField(a, kennelOpts) {
    const known = (State.settings.kennels || []).includes(a.kennel);
    const sel = select("kennel", kennelOpts, a.kennel && known ? a.kennel : (a.kennel ? "__custom" : ""));
    const custom = input("kennelCustom", known ? "" : (a.kennel || ""), { placeholder: "Custom kennel/cage", class: a.kennel && !known ? "" : "hidden" });
    sel.addEventListener("change", () => custom.classList.toggle("hidden", sel.value !== "__custom"));
    return el("label", { class: "f-field" }, el("span", { text: "Kennel / cage" }), sel, custom);
  }

  /* ── kennel card printing ──────────────────────────────────────── */
  function printKennelCards(animals) {
    if (!animals.length) { toast("No animals to print", "err"); return; }
    const surface = $("#printSurface");
    surface.innerHTML = "";
    const orgName = (State.settings && State.settings.orgName) || "Aurora Sanctuary";
    animals.forEach((a) => {
      const kv = (label, val) => el("div", { class: "kc-kv" },
        el("span", { class: "kc-k", text: label }), el("span", { class: "kc-v", text: val || "—" }));
      surface.appendChild(el("div", { class: "kennel-card" },
        el("div", { class: "kc-head" },
          el("div", { class: "kc-org", text: orgName }),
          el("div", { class: "kc-kennel", text: a.kennel || "Unassigned" })),
        el("div", { class: "kc-name-row" },
          a.photo
            ? el("img", { class: "kc-photo", src: a.photo, alt: "" })
            : el("span", { class: "kc-emoji", text: speciesEmoji(a.species) }),
          el("h2", { class: "kc-name", text: a.name || "(unnamed)" }),
          el("span", { class: "kc-status", text: a.status || "" })),
        el("div", { class: "kc-grid" },
          kv("Species", a.species), kv("Breed", a.breed), kv("Sex", a.sex),
          kv("Age", a.age), kv("Color", a.color), kv("Weight", a.weight),
          kv("Microchip", a.microchip), kv("Intake", a.intakeDate ? fmtDate(a.intakeDate) : "")),
        a.feeding ? el("div", { class: "kc-block" }, el("strong", { text: "Feeding: " }), document.createTextNode(a.feeding)) : null,
        a.medical ? el("div", { class: "kc-block" }, el("strong", { text: "Medical: " }), document.createTextNode(a.medical)) : null,
        a.notes ? el("div", { class: "kc-block" }, el("strong", { text: "Notes: " }), document.createTextNode(a.notes)) : null,
        el("div", { class: "kc-foot", text: `${orgName} · printed ${new Date().toLocaleDateString()}` }),
      ));
    });
    document.body.classList.add("printing-cards");
    const cleanup = () => { document.body.classList.remove("printing-cards"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 60);
  }

  /* ================================================================
   * VIEW: SUPPLIES
   * ================================================================ */
  function renderSupplies() {
    const view = $("#view-supplies");
    view.innerHTML = "";
    const animalCount = State.animals.filter(inCare).length;
    const head = sectionHeader(
      "Supplies", `Inventory needs scale with current animals in care (${animalCount}).`,
      "+ Add supply", () => openSupplyForm()
    );
    view.appendChild(head);

    const lows = State.supplies.filter((s) => daysRemaining(s, animalCount) != null && daysRemaining(s, animalCount) <= (Number(s.reorderDays) || 7));
    if (lows.length) {
      view.appendChild(el("div", { class: "alert" },
        el("strong", { text: "⚠ Low stock: " }),
        document.createTextNode(lows.map((s) => s.name).join(", ") + ". "),
        el("button", { class: "link-btn brand", onclick: () => openShoppingList(animalCount) }, "Open shopping list →")));
    }

    if (!State.supplies.length) {
      view.appendChild(el("div", { class: "empty" }, "No supplies tracked yet. Add food, litter, cleaning items, and more."));
      return;
    }

    const table = el("table", { class: "data-table" });
    table.appendChild(el("thead", {}, el("tr", {},
      ...["Supply", "On hand", "Use / animal / day", "Est. daily use", "Days left", "Status", ""].map((h) => el("th", { text: h }))
    )));
    const tbody = el("tbody");
    [...State.supplies].sort((a, b) => (a.name || "").localeCompare(b.name || "")).forEach((s) => {
      const daily = dailyUse(s, animalCount);
      const days = daysRemaining(s, animalCount);
      const reorder = Number(s.reorderDays) || 7;
      const low = days != null && days <= reorder;
      tbody.appendChild(el("tr", { class: low ? "row-low" : "" },
        el("td", {}, el("strong", { text: s.name }), s.category ? el("div", { class: "muted small", text: s.category }) : null),
        el("td", {},
          el("span", { class: "qty", text: `${num(s.quantity)} ${s.unit || ""}` }),
          el("span", { class: "stepper" },
            el("button", { class: "step", onclick: () => adjustSupply(s, -stepSize(s)) }, "–"),
            el("button", { class: "step", onclick: () => adjustSupply(s, stepSize(s)) }, "+"))),
        el("td", { text: s.perAnimalPerDay ? `${num(s.perAnimalPerDay)} ${s.unit || ""}` : "—" }),
        el("td", { text: daily ? `${round(daily)} ${s.unit || ""}/day` : "—" }),
        el("td", { text: days == null ? "—" : (days >= 999 ? "—" : round(days) + " d") }),
        el("td", {}, el("span", { class: "chip " + (low ? "danger" : "ok"), text: low ? "Reorder" : "OK" })),
        el("td", { class: "row-actions" },
          el("button", { class: "link-btn", onclick: () => restockSupply(s) }, "Restock"),
          el("button", { class: "link-btn", onclick: () => openSupplyForm(s) }, "Edit"),
          el("button", { class: "link-btn danger", onclick: () => removeItem("supply", s.id, "Delete this supply?") }, "Delete"))
      ));
    });
    table.appendChild(tbody);
    view.appendChild(el("div", { class: "table-wrap" }, makeResponsive(table)));
  }

  const num = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
  const round = (v) => Math.round(v * 10) / 10;
  function stepSize(s) { const u = String(s.unit || "").toLowerCase(); return /lb|kg|gal|l\b|liter/.test(u) ? 1 : 1; }
  function dailyUse(s, animalCount) {
    const per = num(s.perAnimalPerDay);
    if (!per) return null;
    return per * animalCount;
  }
  function daysRemaining(s, animalCount) {
    const daily = dailyUse(s, animalCount);
    if (!daily) return null;
    if (daily <= 0) return 999;
    return num(s.quantity) / daily;
  }
  async function adjustSupply(s, delta) {
    const next = Math.max(0, round(num(s.quantity) + delta));
    const res = await Store.save("supply", { ...s, quantity: next });
    if (res.ok) await refresh();
  }
  async function restockSupply(s) {
    const amount = prompt(`How much ${s.unit || "units"} of "${s.name}" did you add?`, "");
    if (amount == null) return;
    const add = parseFloat(amount);
    if (isNaN(add)) { toast("Enter a number", "err"); return; }
    const next = Math.max(0, round(num(s.quantity) + add));
    const res = await Store.save("supply", { ...s, quantity: next, lastRestocked: todayISO() });
    if (res.ok) { toast(`Restocked ${s.name}`); await refresh(); }
  }

  /* Suggested order quantity: enough to reach a target days-of-stock buffer
     (default 30 days) given current per-animal usage. */
  function suggestedOrder(s, animalCount, targetDays = 30) {
    const daily = dailyUse(s, animalCount);
    if (!daily) return null;
    const need = daily * targetDays - num(s.quantity);
    return need > 0 ? Math.ceil(need) : 0;
  }

  function openShoppingList(animalCount) {
    const lows = State.supplies
      .filter((s) => { const d = daysRemaining(s, animalCount); return d != null && d <= (Number(s.reorderDays) || 7); })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const body = el("div", {});
    if (!lows.length) { body.appendChild(el("p", { class: "muted", text: "Nothing needs reordering right now. 🎉" })); openModal("Shopping list", body); return; }

    let text = "Aurora Sanctuary — reorder list (" + todayISO() + ")\n";
    const table = el("table", { class: "data-table shopping" });
    table.appendChild(el("thead", {}, el("tr", {}, ...["Supply", "On hand", "Suggested order"].map((h) => el("th", { text: h })))));
    const tbody = el("tbody");
    lows.forEach((s) => {
      const order = suggestedOrder(s, animalCount, 30);
      const orderStr = order ? `${order} ${s.unit || ""}` : "—";
      text += `• ${s.name}: have ${num(s.quantity)} ${s.unit || ""}, order ~${orderStr}\n`;
      tbody.appendChild(el("tr", {},
        el("td", { "data-label": "Supply" }, el("strong", { text: s.name }), s.category ? el("div", { class: "muted small", text: s.category }) : null),
        el("td", { "data-label": "On hand", text: `${num(s.quantity)} ${s.unit || ""}` }),
        el("td", { "data-label": "Suggested order", text: orderStr })));
    });
    table.appendChild(tbody);
    body.appendChild(el("p", { class: "muted small", text: "Suggested amounts aim for ~30 days of stock at current animal counts." }));
    body.appendChild(el("div", { class: "table-wrap" }, table));
    body.appendChild(el("div", { class: "modal-actions" }, el("span"),
      el("div", {},
        el("button", { class: "ghost", onclick: () => { navigator.clipboard && navigator.clipboard.writeText(text); toast("Copied to clipboard"); } }, "Copy list"),
        el("button", { class: "primary", onclick: () => printText("Reorder list", text) }, "🖨 Print"))));
    openModal("Shopping list", body);
  }

  function printText(title, text) {
    const surface = $("#printSurface");
    surface.innerHTML = "";
    surface.appendChild(el("div", { class: "print-text" }, el("h2", { text: title }), el("pre", { text })));
    document.body.classList.add("printing-cards");
    const cleanup = () => { document.body.classList.remove("printing-cards"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 60);
  }

  function openSupplyForm(supply) {
    const s = supply || { unit: "", quantity: 0, perAnimalPerDay: "", reorderDays: 7 };
    const form = el("form", { class: "modal-form" },
      field("Supply name", input("name", s.name, { required: true, placeholder: "e.g. Adult dog food" })),
      el("div", { class: "form-row" },
        field("Category", input("category", s.category, { placeholder: "Food, Litter, Cleaning, Medical…", list: "supCatList" })),
        field("Unit", input("unit", s.unit, { placeholder: "lb, cans, rolls, bottles" })),
      ),
      el("datalist", { id: "supCatList" }, ...["Food", "Litter", "Bedding", "Cleaning", "Medical", "Enrichment", "Office"].map((c) => el("option", { value: c }))),
      el("div", { class: "form-row" },
        field("Quantity on hand", input("quantity", s.quantity, { type: "number", step: "any", min: "0" })),
        field("Used per animal / day", input("perAnimalPerDay", s.perAnimalPerDay, { type: "number", step: "any", min: "0", placeholder: "Leave blank if not per-animal" })),
        field("Reorder when days left ≤", input("reorderDays", s.reorderDays, { type: "number", step: "1", min: "0" })),
      ),
      el("p", { class: "muted small", text: "Daily use and “days left” are estimated from the number of animals currently in care. Leave “per animal” blank for fixed-stock items." }),
      field("Notes", textarea("notes", s.notes, { rows: 2 })),
      el("div", { class: "modal-actions" },
        supply ? el("button", { type: "button", class: "link-btn danger", onclick: () => { closeModal(); removeItem("supply", supply.id, "Delete this supply?"); } }, "Delete") : el("span"),
        el("div", {},
          el("button", { type: "button", class: "ghost", onclick: closeModal }, "Cancel"),
          el("button", { type: "submit", class: "primary" }, supply ? "Save" : "Add supply"))
      ),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = formValues(form);
      if (!v.name.trim()) { toast("Name is required", "err"); return; }
      const res = await Store.save("supply", { ...s, ...v });
      if (res.ok) { closeModal(); toast(supply ? "Supply saved" : "Supply added"); await refresh(); }
    });
    openModal(supply ? "Edit supply" : "Add supply", form);
  }

  /* ================================================================
   * VIEW: ADMIN
   * ================================================================ */
  async function renderAdmin() {
    const view = $("#view-admin");
    view.innerHTML = "";
    if (State.me.role !== "admin") {
      view.appendChild(el("div", { class: "empty" }, "Admin tools are available to administrators only."));
      return;
    }
    view.appendChild(sectionHeader("Admin", "Reports, staff accounts, and sanctuary settings."));

    view.appendChild(reportsCard());
    view.appendChild(hoursCard());

    /* org settings */
    const s = State.settings || {};
    const settingsCard = el("div", { class: "panel-card" },
      el("h3", { text: "Sanctuary settings" }),
      field("Organization name", input("orgName", s.orgName, { id: "setOrgName" })),
      field("Kennels / cages (one per line)", textarea("kennels", (s.kennels || []).join("\n"), { id: "setKennels", rows: 4, placeholder: "Kennel 1\nKennel 2\nCat room A-1" })),
      field("Animal statuses (one per line)", textarea("statuses", (s.animalStatuses || []).join("\n"), { id: "setStatuses", rows: 3 })),
      field("Job types (one per line)", textarea("jobCats", (s.jobCategories || []).join("\n"), { id: "setJobCats", rows: 3 })),
      el("button", { class: "primary", onclick: saveSettings }, "Save settings"),
    );
    view.appendChild(settingsCard);

    /* users */
    const usersCard = el("div", { class: "panel-card" }, el("h3", { text: "Staff accounts" }), el("div", { id: "usersHost", class: "table-wrap" }, "Loading…"));
    view.appendChild(usersCard);

    /* data import */
    view.appendChild(importCard());

    /* activity log */
    const actCard = el("div", { class: "panel-card" },
      el("div", { class: "row-between" }, el("h3", { text: "Activity log" }),
        el("button", { class: "link-btn brand", onclick: () => loadActivity() }, "Refresh")),
      el("p", { class: "muted small", text: "Recent changes across the sanctuary." }),
      el("div", { id: "activityHost" }, "Loading…"));
    view.appendChild(actCard);

    await loadUsers();
    renderUsersTable();
    loadActivity();
  }

  /* ── Reports ───────────────────────────────────────────────────── */
  function reportsCard() {
    const animals = State.animals;
    const inCareList = animals.filter(inCare);
    const today = todayISO();
    const days30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const days90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

    /* status breakdown */
    const byStatus = {};
    inCareList.forEach((a) => { const k = a.status || "—"; byStatus[k] = (byStatus[k] || 0) + 1; });

    /* length of stay */
    const stays = inCareList.filter((a) => a.intakeDate).map((a) => ({ a, days: Math.max(0, Math.round((Date.parse(today) - Date.parse(a.intakeDate)) / 86400000)) }));
    const avgStay = stays.length ? Math.round(stays.reduce((s, x) => s + x.days, 0) / stays.length) : 0;
    const longest = stays.sort((x, y) => y.days - x.days).slice(0, 5);

    const intakes30 = animals.filter((a) => (a.intakeDate || "") >= days30).length;
    const adoptions30 = animals.filter((a) => a.placementType === "Adopted" && (a.placementDate || "") >= days30).length;
    const adoptions90 = animals.filter((a) => a.placementType === "Adopted" && (a.placementDate || "") >= days90).length;
    const jobsDone7 = State.jobs.filter((j) => j.status === "done" && (j.completedAt || "") >= new Date(Date.now() - 7 * 86400000).toISOString()).length;

    const maxStatus = Math.max(1, ...Object.values(byStatus));
    const card = el("div", { class: "panel-card" }, el("h3", { text: "Reports" }),
      el("div", { class: "report-stats" },
        miniStat(inCareList.length, "In care"),
        miniStat(avgStay + "d", "Avg length of stay"),
        miniStat(intakes30, "Intakes (30d)"),
        miniStat(adoptions30, "Adoptions (30d)"),
        miniStat(adoptions90, "Adoptions (90d)"),
        miniStat(jobsDone7, "Jobs done (7d)")));

    card.appendChild(el("h4", { class: "report-sub", text: "Animals by status" }));
    const bars = el("div", { class: "bar-list" });
    Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      bars.appendChild(el("div", { class: "bar-row" },
        el("span", { class: "bar-label", text: k }),
        el("span", { class: "bar-track" }, el("span", { class: "bar-fill", style: `width:${Math.round(v / maxStatus * 100)}%` })),
        el("span", { class: "bar-num", text: String(v) })));
    });
    card.appendChild(bars);

    if (longest.length) {
      card.appendChild(el("h4", { class: "report-sub", text: "Longest residents" }));
      const ul = el("div", { class: "bar-list" });
      longest.forEach(({ a, days }) => ul.appendChild(el("div", { class: "bar-row simple" },
        el("span", { class: "bar-label", text: a.name + (a.kennel ? " · " + a.kennel : "") }),
        el("span", { class: "bar-num", text: days + " days" }))));
      card.appendChild(ul);
    }
    return card;
  }
  function miniStat(value, label) {
    return el("div", { class: "mini-stat" }, el("span", { class: "mini-stat-v", text: String(value) }), el("span", { class: "mini-stat-l", text: label }));
  }

  /* ── Volunteer hours summary (admin) ───────────────────────────── */
  function hoursCard() {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const totals = {};
    State.timelogs.forEach((t) => {
      if ((t.clockIn || "") < since) return;
      const h = hoursBetween(t.clockIn, t.clockOut || new Date().toISOString());
      totals[t.user] = (totals[t.user] || 0) + h;
    });
    const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const card = el("div", { class: "panel-card" },
      el("h3", { text: "Volunteer / staff hours (last 30 days)" }));
    if (!rows.length) { card.appendChild(el("p", { class: "muted", text: "No clock-in time recorded yet." })); return card; }
    const list = el("div", { class: "bar-list" });
    const max = Math.max(1, ...rows.map((r) => r[1]));
    rows.forEach(([user, h]) => list.appendChild(el("div", { class: "bar-row" },
      el("span", { class: "bar-label", text: userLabel(user) }),
      el("span", { class: "bar-track" }, el("span", { class: "bar-fill alt", style: `width:${Math.round(h / max * 100)}%` })),
      el("span", { class: "bar-num", text: hoursStr(h) }))));
    card.appendChild(list);
    return card;
  }

  async function loadActivity() {
    const host = $("#activityHost");
    if (!host) return;
    const res = await Store.activityList();
    host.innerHTML = "";
    const items = (res && res.activity) || [];
    if (!items.length) { host.appendChild(el("p", { class: "muted", text: "No activity yet." })); return; }
    const list = el("div", { class: "activity-list" });
    items.slice(0, 100).forEach((a) => list.appendChild(el("div", { class: "activity-row" },
      el("span", { class: "activity-when", text: activityWhen(a.ts) }),
      el("span", { class: "activity-text", html: `<strong>${esc(userLabel(a.user))}</strong> ${esc(a.text)}` }))));
    host.appendChild(list);
  }
  function activityWhen(ts) {
    if (!ts) return "";
    const d = new Date(ts), now = new Date();
    const mins = Math.round((now - d) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    if (mins < 1440) return Math.round(mins / 60) + "h ago";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  /* ── CSV import (animals) ──────────────────────────────────────── */
  function importCard() {
    const fileInput = el("input", { type: "file", accept: ".csv,text/csv" });
    fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (e) => importAnimalsCSV(String(e.target.result || ""));
      reader.readAsText(f);
    });
    return el("div", { class: "panel-card" },
      el("h3", { text: "Import animals (CSV)" }),
      el("p", { class: "muted small", text: "Upload a CSV with a header row. Recognized columns: name, species, breed, sex, age, color, weight, status, kennel, microchip, intakeDate, medical, feeding, notes. Each row becomes a new animal." }),
      el("label", { class: "photo-pick" }, fileInput, el("span", { class: "photo-pick-btn", text: "⬆ Choose CSV file" })));
  }
  function parseCSV(text) {
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += c;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
  }
  async function importAnimalsCSV(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) { toast("CSV needs a header row and at least one row", "err"); return; }
    const allowed = ["name", "species", "breed", "sex", "age", "color", "weight", "status", "kennel", "microchip", "intakeDate", "medical", "feeding", "notes", "publicBio"];
    const headers = rows[0].map((h) => h.trim());
    let count = 0, skipped = 0;
    for (let i = 1; i < rows.length; i++) {
      const obj = {};
      headers.forEach((h, idx) => { if (allowed.includes(h)) obj[h] = (rows[i][idx] || "").trim(); });
      if (!obj.name) { skipped++; continue; }
      const res = await Store.save("animal", obj);
      if (res.ok) count++;
    }
    toast(`Imported ${count} animal${count === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}`);
    await refresh();
    if (State.activeTab === "admin") renderAdmin();
  }

  function renderUsersTable() {
    const host = $("#usersHost");
    if (!host) return;
    host.innerHTML = "";
    const table = el("table", { class: "data-table" });
    table.appendChild(el("thead", {}, el("tr", {},
      ...["Name", "Username", "Role", "Contact", "Flags", ""].map((h) => el("th", { text: h })))));
    const tbody = el("tbody");
    (State._users || []).forEach((u) => {
      const roleSel = select("_", [{ value: "staff", label: "Staff" }, { value: "admin", label: "Admin" }], u.role);
      roleSel.addEventListener("change", async () => {
        const res = await Store.adminUpdate({ target: u.username, role: roleSel.value });
        if (res.ok) { toast("Role updated"); await loadUsers(); }
      });
      tbody.appendChild(el("tr", {},
        el("td", { text: u.name || "—" }),
        el("td", { text: u.username }),
        el("td", {}, roleSel),
        el("td", { class: "muted small", text: [u.email, u.phone].filter(Boolean).join(" · ") || "—" }),
        el("td", {}, u.needs_password_reset ? el("span", { class: "chip danger", text: "Reset requested" }) : el("span", { class: "muted", text: "—" })),
        el("td", { class: "row-actions" },
          el("button", { class: "link-btn", onclick: () => resetUserPassword(u) }, "Reset password"),
          u.username !== State.me.username ? el("button", { class: "link-btn danger", onclick: () => deleteUser(u) }, "Remove") : null)
      ));
    });
    table.appendChild(tbody);
    host.appendChild(makeResponsive(table));
  }

  async function saveSettings() {
    const next = {
      orgName: $("#setOrgName").value.trim() || "Aurora Sanctuary",
      kennels: lines($("#setKennels").value),
      animalStatuses: lines($("#setStatuses").value),
      jobCategories: lines($("#setJobCats").value),
    };
    const res = await Store.settingsSave(next);
    if (res.ok) { State.settings = res.settings; toast("Settings saved"); $("#orgNameHeading").textContent = res.settings.orgName; }
    else toast("Could not save settings", "err");
  }
  const lines = (v) => String(v || "").split("\n").map((x) => x.trim()).filter(Boolean);

  async function resetUserPassword(u) {
    const pw = prompt(`Set a new password for ${u.name || u.username} (min 8 characters):`);
    if (pw == null) return;
    if (pw.length < 8) { toast("Password too short", "err"); return; }
    const res = await Store.adminReset({ target: u.username, new_password: pw });
    if (res.ok) toast("Password reset"); else toast("Could not reset", "err");
    await loadUsers(); renderUsersTable();
  }
  async function deleteUser(u) {
    if (!confirm(`Remove account ${u.username}? Their jobs stay but become unassigned-looking.`)) return;
    const res = await Store.adminDelete(u.username);
    if (res.ok) { toast("User removed"); await loadUsers(); renderUsersTable(); }
  }

  /* ── shared delete ─────────────────────────────────────────────── */
  async function removeItem(collection, id, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    const res = await Store.remove(collection, id);
    if (res.ok) { toast("Deleted"); closeModal(); await refresh(); }
  }

  function canManage() { return State.me && (State.me.role === "admin" || true); /* all staff can manage jobs */ }

  /* ================================================================
   * BOOT
   * ================================================================ */
  async function boot() {
    wireAuth();
    wireTabs();
    showAuthView("login");

    const hasBackend = await probeBackend();
    Store = hasBackend ? NetworkStore : LocalStore;

    const session = loadSession();
    if (session && session.username && session.token) {
      State.session = session;
      const res = await Store.verify({ username: session.username, token: session.token });
      if (res.ok) {
        State.me = res;
        /* preload users so assignee labels resolve everywhere */
        if (res.role === "admin") await loadUsers(); else State._users = await usersForLabels();
        await enterApp();
        return;
      }
      saveSession(null);
    }
    /* not signed in */
    setSyncBadge();
    $("#authOverlay").classList.remove("hidden");
  }

  /* Non-admins still need a name map for assignee labels. Admin list is
     admin-only, so fall back to just the current user when unavailable. */
  async function usersForLabels() {
    const res = await Store.staffList();
    if (res.ok) return res.users;
    return State.me ? [{ username: State.me.username, name: State.me.name }] : [];
  }

  /* ensure assignee dropdowns have data after entering the app */
  const _enter = enterApp;
  enterApp = async function () {
    if (!State._users || !State._users.length) {
      State._users = State.me.role === "admin" ? await loadUsers() : await usersForLabels();
    }
    return _enter();
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
