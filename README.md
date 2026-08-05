# 4K Baked — Order Tracker

Private order tracking + bake sheet app for 4K Baked. Real database (Supabase),
real login, deployed on Netlify — replaces the single-session artifact version.

## What's in here

- `supabase/schema.sql` — run this once to create your tables + seed the product catalog
- `src/` — the React app (Vite)
- `netlify.toml` — tells Netlify how to build/deploy it

## 1. Supabase setup

1. In your Supabase project, go to **SQL Editor → New query**, paste in the entire
   contents of `supabase/schema.sql`, and click **Run**. This creates the
   `customers`, `products`, and `orders` tables, locks them down so only logged-in
   users can read/write, and pre-loads your product catalog from the menu.
2. **Fix the placeholders**: the schema seeds `TODO Flavor 1/2/3` for Croissant
   Loaf and Sourdough Cookies since those weren't on the menu photo — go to
   **Table Editor → products** and edit those rows with real names/prices (or
   delete them if you don't sell those yet).
3. Create your login: go to **Authentication → Users → Add user** and create
   an account for yourself (and your wife, if she wants her own login) with
   an email + password. This is a private app — there's no public sign-up page,
   accounts are only created by you in this dashboard.
4. Grab your API keys: **Project Settings → API** — you'll need the
   **Project URL** and the **anon public** key for step 3 below.

## 2. Run it locally (optional, to test before deploying)

```bash
npm install
cp .env.example .env
# edit .env and paste in your Supabase URL + anon key
npm run dev
```

Visit the local URL it prints, log in with the account you created in step 1.3.

## 3. Deploy to Netlify

1. Push this folder to a GitHub repo (Netlify deploys from Git).
2. In Netlify: **Add new site → Import an existing project** → connect the repo.
   Build settings are already set via `netlify.toml` (build command
   `npm run build`, publish directory `dist`) — you shouldn't need to change anything.
3. Before the first deploy, go to **Site configuration → Environment variables**
   and add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Deploy. Netlify gives you a URL like `4k-baked.netlify.app` — bookmark that
   on your and your wife's phones (Add to Home Screen for an app-like icon).

## How the app works

- **Week navigation** — defaults to the upcoming Thursday, arrows move week
  to week. All orders and the bake sheet are scoped to whichever week is showing.
- **Orders tab** — log a customer, item, size (Half/Full or Half Dozen/Dozen),
  and quantity. Tap the status pill to cycle Pending → Ready → Picked up.
- **Bake Sheet tab** — the core feature. For each item, "large" size orders
  (Full/Dozen) count as whole units directly; "small" size orders (Half/Half
  Dozen) are paired up two-at-a-time into whole units, with any odd leftover
  half called out in orange so you know to bake a partial. A per-customer
  breakdown sits underneath each item so you know how to split what you baked.
- **Customers tab** — simple contact list (name, phone, notes), tap a card to edit.

## Editing the menu later

Add, edit, or retire products directly in Supabase: **Table Editor → products**.
Set `active = false` on anything you stop selling instead of deleting it, so
past orders that reference it don't break. New products just need a category,
name, the two size labels (`unit_small`/`unit_large`), and two prices.

## Notes / things you may want to change

- Right now any logged-in user can see and edit everything — fine for a
  two-person household app. If you ever add more logins, the RLS policies in
  `schema.sql` would need to be tightened (e.g. per-user data).
- The "Fall Box" and "Variety Box" bundles from the menu aren't modeled as
  products yet — add them as their own rows in `products` (e.g. category `Boxes`)
  if you want to track them as line items.
