# Deploying Aurora Sanctuary to Cloudflare Pages (with the CLI)

**Why the CLI?** The Cloudflare dashboard "Direct Upload" (drag-and-drop)
deploys static files only — it will say *"Pages Functions are not supported."*
The `functions/api.js` backend only gets compiled when you deploy with the
**Wrangler CLI** (or connect a Git repo). These steps use Wrangler.

You need [Node.js](https://nodejs.org) installed. All commands are run **inside
the `aurora` folder** (the one containing `index.html` and `wrangler.toml`).

## 1. Log in to Cloudflare (opens a browser — no token to copy)

```
npx wrangler login
```

## 2. Create the KV namespace (your database)

```
npx wrangler kv namespace create AURORA_KV
```

It prints something like:

```
🌀 Creating namespace with title "AURORA_KV"
✨ Success!
id = "abcdef0123456789abcdef0123456789"
```

Copy that **id** and paste it into `wrangler.toml`, replacing
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

## 3. Deploy

```
npx wrangler pages deploy
```

If it asks, name the project **sanctuary**. When it finishes it prints your
live URL, e.g. `https://sanctuary.pages.dev`.

## 4. First run

1. Open the URL. The header badge should say **● Synced** (not Local).
2. Register the first account — it automatically becomes the **admin**.
3. Go to **Admin → Sanctuary settings** to add your kennels, statuses, and
   staff.

## Optional: a built-in admin login

In the Cloudflare dashboard → your **sanctuary** project → **Settings →
Environment variables**, add:

- `AURORA_ADMIN_USER` = a username
- `AURORA_ADMIN_PASS` = a password

That account is always an admin (handy if you ever get locked out). Re-deploy
after adding env vars: `npx wrangler pages deploy`.

## Updating later

Make your edits, then run `npx wrangler pages deploy` again from this folder.

## Troubleshooting

- **"Functions are not supported"** → you used dashboard drag-and-drop. Deploy
  with `npx wrangler pages deploy` instead (this file's steps).
- **Badge says "Local" / login fails with `kv_not_configured`** → the KV id in
  `wrangler.toml` is missing or wrong, or you didn't redeploy after setting it.
  Fix the id and run `npx wrangler pages deploy` again.
- **403 on `/api`** → normal for a GET in a browser; the app calls it with POST.
