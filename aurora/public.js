/* Aurora Sanctuary — public adoptable page (no login).
 *
 * Reads only the public-safe animal fields exposed by the /api endpoint's
 * public_list / public_animal actions. If there's no backend (e.g. the file
 * is opened directly for a demo), it falls back to reading the same-device
 * localStorage data so the owner can preview it. */
(() => {
  "use strict";
  const API_URL = "/api";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PUBLIC_FIELDS = ["id", "name", "species", "breed", "sex", "age", "color", "photo", "status", "publicBio"];

  function emoji(species) {
    const s = String(species || "").toLowerCase();
    if (s.includes("dog") || s.includes("pup")) return "🐕";
    if (s.includes("cat") || s.includes("kit")) return "🐈";
    if (s.includes("rabbit") || s.includes("bun")) return "🐇";
    if (s.includes("bird")) return "🐦";
    if (s.includes("horse")) return "🐴";
    return "🐾";
  }

  async function api(action, payload) {
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  /* Local-mode fallback: read the owner's localStorage data for preview. */
  function localData() {
    try {
      const db = JSON.parse(localStorage.getItem("aurora.local.db") || "{}");
      const animals = (db.animals || []).filter((a) => a.shareable === true)
        .map((a) => { const o = {}; PUBLIC_FIELDS.forEach((f) => o[f] = a[f] || ""); return o; });
      const orgName = (db.settings && db.settings.orgName) || "Aurora Sanctuary";
      return { animals, orgName };
    } catch { return { animals: [], orgName: "Aurora Sanctuary" }; }
  }

  function setOrg(name) {
    if (name) { $("#pubOrgName").textContent = name; document.title = "Adoptable Animals — " + name; }
  }

  function card(a) {
    const el = document.createElement("a");
    el.className = "public-card";
    el.href = "adopt.html?id=" + encodeURIComponent(a.id);
    el.innerHTML = `
      <div class="public-photo">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" />` : `<span class="public-emoji">${emoji(a.species)}</span>`}</div>
      <div class="public-card-body">
        <h3>${esc(a.name || "")}</h3>
        <p class="muted small">${esc([a.species, a.breed].filter(Boolean).join(" · "))}</p>
        ${a.status ? `<span class="chip ok">${esc(a.status)}</span>` : ""}
      </div>`;
    return el;
  }

  function renderList(data) {
    setOrg(data.orgName);
    const main = $("#publicMain");
    main.innerHTML = "";
    if (!data.animals || !data.animals.length) {
      main.innerHTML = `<p class="public-empty">No animals are listed for adoption right now. Please check back soon!</p>`;
      return;
    }
    const grid = document.createElement("div");
    grid.className = "public-grid";
    data.animals.forEach((a) => grid.appendChild(card(a)));
    main.appendChild(grid);
  }

  function renderOne(a, orgName) {
    setOrg(orgName);
    $("#pubBackLink").classList.remove("hidden");
    const main = $("#publicMain");
    main.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "public-detail";
    wrap.innerHTML = `
      <div class="public-detail-photo">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" />` : `<span class="public-emoji big">${emoji(a.species)}</span>`}</div>
      <div class="public-detail-body">
        <h2>${esc(a.name || "")}</h2>
        ${a.status ? `<span class="chip ok">${esc(a.status)}</span>` : ""}
        <dl class="public-facts">
          ${a.species ? `<div><dt>Species</dt><dd>${esc(a.species)}</dd></div>` : ""}
          ${a.breed ? `<div><dt>Breed</dt><dd>${esc(a.breed)}</dd></div>` : ""}
          ${a.sex ? `<div><dt>Sex</dt><dd>${esc(a.sex)}</dd></div>` : ""}
          ${a.age ? `<div><dt>Age</dt><dd>${esc(a.age)}</dd></div>` : ""}
          ${a.color ? `<div><dt>Color</dt><dd>${esc(a.color)}</dd></div>` : ""}
        </dl>
        ${a.publicBio ? `<p class="public-bio">${esc(a.publicBio)}</p>` : ""}
      </div>`;
    main.appendChild(wrap);
  }

  async function boot() {
    const id = new URLSearchParams(location.search).get("id");
    if (id) {
      let res = await api("public_animal", { id });
      if (res && res.ok) return renderOne(res.animal, res.orgName);
      /* fallback to local preview */
      const local = localData();
      const found = local.animals.find((a) => a.id === id);
      if (found) return renderOne(found, local.orgName);
      $("#publicMain").innerHTML = `<p class="public-empty">This animal isn't available to view.</p>`;
      $("#pubBackLink").classList.remove("hidden");
      return;
    }
    let res = await api("public_list", {});
    if (res && res.ok) return renderList({ animals: res.animals, orgName: res.orgName });
    renderList(localData());
  }

  boot();
})();
