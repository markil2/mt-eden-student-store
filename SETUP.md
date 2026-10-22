# Setup & deployment

This takes about 10 minutes. You only do it once.

## 1. Create the project
1. Go to <https://supabase.com>, sign in, and click **New project**.
2. Name it `mt-eden-student-store`. Save the database password somewhere safe; this app doesn't need it.
3. Pick the region closest to the school (e.g. **West US**) and click **Create**.

## 2. Create the tables
1. In the project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this folder, copy everything, paste it in, and click **Run**.
3. Do the same with each file in `supabase/migrations/`, in order (currently `002_pay_in_person_and_limits.sql`, `003_menu_update.sql`, `004_coffee_add_ins.sql`, `005_creamer_sugar_amounts.sql`, `006_tea_flavors.sql`, `007_hot_drinks_section.sql` and `008_italian_soda_flavors.sql`).
4. Make another new query with `supabase/seed.sql` (the menu, stock and store settings) and click **Run**.

> If you ever re-run `schema.sql`, run the migrations again afterwards.

> Running `seed.sql` again later **resets the menu, prices and photos** to the defaults. Orders and staff aren't touched.

## 3. Add the keys to the app
1. In Supabase, open **Project Settings → API**.
2. In this folder, copy `.env.example` to a new file named `.env.local`.
3. Paste in these three values:
   - `NEXT_PUBLIC_SUPABASE_URL`: the **Project URL**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the **anon / publishable** key
   - `SUPABASE_SERVICE_ROLE_KEY`: the **service_role / secret** key

`.env.local` is already ignored by git. **Never** share the service role key, paste it into chat, or put it in client code.

## 4. Create the first manager
In Terminal, from this folder, run:
```bash
npm run staff:create
```
Enter your name and email, choose `manager`, and set a password. After that, managers can add everyone else from **/admin → Staff**.

## 5. Restart and test
Stop the dev server (Ctrl + C) and run `npm run dev` again, then:
- Go to **/admin/login** and sign in.
- In **Settings**, turn off "Stop orders after the last-order time" if you're testing after 8 AM.
- Place an order on the customer site. It should appear on **/admin/orders** within a second or two, with a chime.

## Deploy to Vercel
The code is on GitHub. Vercel builds and publishes it automatically on every push.

1. Sign in at <https://vercel.com> with your GitHub account.
2. Click **Add New… → Project** and import the `mt-eden-student-store` repository. The default settings are correct.
3. Before clicking Deploy, open **Environment Variables** and add the same three values as in `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   Add them directly in Vercel. Never paste them into chat or commit them.
4. Click **Deploy**. In about a minute you'll get a link like `mt-eden-student-store.vercel.app`.
5. In Supabase → **Authentication → URL Configuration**, set **Site URL** to that link.
6. Optional: add the school's own domain in Vercel → Project → **Settings → Domains**.

After this, every change pushed to the `main` branch deploys on its own. If you change an environment variable, redeploy from the Vercel dashboard so it takes effect.

## Before opening to students (checklist)
- [ ] Migration `002` has been run in Supabase (pay in person + rate limits).
- [ ] Public sign-ups are turned off (below).
- [ ] At least two managers exist, so one person isn't a single point of failure.
- [ ] Test orders are deleted (Supabase → Table Editor → `orders`). Order numbers continue from the last one.
- [ ] Stock photos are replaced with real photos (Admin → Menu → edit an item → Add photo).
- [ ] Hours, pickup location and the last-order time are correct in Admin → Settings.
- [ ] Place one real order on a phone, from start to finish.

## Turn off public sign-ups (recommended)
Staff accounts are only created by managers, so in Supabase go to **Authentication → Sign In / Providers → Email** and turn off **Allow new users to sign up**. Even with sign-ups on, a new account can't do anything, because it isn't in the staff table.

## How the security works
- The **menu, stock and store settings** can be read by anyone, because the menu is public. Only staff can change stock, and only managers can change the menu, settings and staff.
- **Orders are never readable by the public.** Customers place and look up orders through the Next.js server, which:
  - re-prices everything from the database, so it never trusts totals from the browser
  - checks stock, the last-order time and the pickup/delivery times
  - saves the order in a single step, and an order submitted twice is only saved once
- **Order links** contain a long random token. The database stores only a hash of it, so order numbers can't be guessed to see other people's orders.
- **Staff** can move an order only to its next step: pickup goes received → preparing → ready → completed, and delivery goes … → out for delivery → delivered. Canceling is allowed at any step. The database enforces this.
- **Every admin page and action** checks the signed-in user's role on the server, and the database's row-level security checks it again.
