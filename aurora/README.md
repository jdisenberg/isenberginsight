# Aurora Sanctuary — Schedule & Animal Care App

An internal staff web app for an animal rescue. It covers:

- **My Todo** — every staff member sees the jobs assigned to them when they log
  in, plus open jobs anyone can claim, and what they've completed today.
- **Jobs** — create, assign, prioritize, and schedule work. Jobs are tagged
  **Daytime**, **After hours**, or **Weekend**, can repeat (daily / weekdays /
  weekly / weekends), and can be tied to a specific animal.
- **Schedule** — a week board for assigning workers to shifts across daytime,
  after-hours, and weekend coverage.
- **Animals** — full records (species, breed, sex, age, status, microchip,
  medical, feeding, notes) with **kennel/cage assignment**, status badges, and
  one-click **printable kennel cards** (single animal or the whole filtered
  list).
- **Supplies** — inventory that scales with the number of animals currently in
  care. Set a per-animal-per-day usage rate and the app estimates daily use,
  days of stock remaining, and flags items that need reordering.
- **Admin** — manage staff accounts (roles, password resets) and sanctuary
  settings (org name, kennel/cage list, animal statuses, job types).

## Two ways it runs

The app detects whether a backend is available and shows a badge in the header:

- **● Synced (cloud)** — connected to the Cloudflare backend; accounts and data
  are shared and synced across every device. This is the real multi-user mode.
- **● Local** — no backend reachable, so everything is stored in this browser
  only. Great for trying it out immediately, but data does not leave the device.

You can build and demo entirely in Local mode first, then deploy the backend
whenever you're ready — no code changes needed.

## Files

```
aurora/
  index.html        app shell + login screen
  app.js            all front-end logic (views, forms, printing, store)
  styles.css        styling + kennel-card print layout
  functions/
    api.js          Cloudflare Pages Function — auth + data API (one endpoint)
```

## Deploying the real multi-user backend (Cloudflare Pages)

1. **Create a KV namespace**
   Cloudflare dashboard → Workers & Pages → KV → *Create namespace*
   (e.g. `aurora-data`).

2. **Deploy this folder as a Pages project**
   Point a Cloudflare Pages project at the repo with the **build output
   directory** set to `aurora` (so `aurora/functions/api.js` is served at
   `/api`). No build command is needed — it's static + a Pages Function.

3. **Bind the KV namespace**
   Pages project → Settings → Functions → **KV namespace bindings**
   - Variable name: `AURORA_KV`
   - KV namespace: the one you created in step 1

4. **(Optional) Built-in admin**
   Pages project → Settings → Environment variables:
   - `AURORA_ADMIN_USER` = a username
   - `AURORA_ADMIN_PASS` = a password
   This account is always an admin and works even before anyone registers.
   Otherwise, **the first account that registers automatically becomes the
   admin.**

5. Open the site, register the first account (it becomes admin), then go to the
   **Admin** tab to set your kennel/cage list, statuses, and add staff.

## Security notes

- Passwords are hashed with PBKDF2-SHA256 (100k iterations) and never stored or
  returned in plaintext. Sessions use random 256-bit tokens with a 180-day TTL.
- Repeated failed logins lock an account for 15 minutes (brute-force guard).
- This is an internal operations tool, not a public-facing system. Keep it
  behind staff accounts and serve it over HTTPS (Cloudflare Pages does this).

## Ideas for later

Per-animal weight/medication logs, photo uploads on animal records and kennel
cards, adoption/foster pipeline tracking, intake forms, volunteer hour
tracking, recurring-job auto-generation, and email/SMS reminders for due jobs.
