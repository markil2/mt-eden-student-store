# Mt. Eden Student Store

The website and online ordering system for Mt. Eden High School's cafe, run by Mt. Eden Entrepreneurship.

- **Customers** browse the menu, customize breakfast sandwiches, and order for **store pickup** (resting room, E Hall) or **classroom delivery**, either before or after school. They pay **cash or Zelle** when they get their order. No account is needed, and every order gets a private status page.
- **Staff** sign in at `/admin` to run incoming orders live (with a chime for new ones), mark items sold out, and record payments.
- **Managers** can also edit prices, photos, the menu, store settings and staff accounts, and view sales.

## Tech
Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Motion · Zustand · Supabase (Postgres, Auth, Realtime, Storage) · Vercel

## Running it locally
```bash
npm install
npm run dev        # http://localhost:3000
```
Without Supabase keys, the site shows the built-in menu (browse only). To connect Supabase, follow **[SETUP.md](SETUP.md)**.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with live reload |
| `npm run build` / `npm start` | Production build / serve it |
| `npm test` | Unit tests: pricing, menu rules, order workflow, cutoff, sales |
| `npm run lint` | ESLint |
| `npm run staff:create` | Create a staff or manager account from the terminal |
| `npm run db:seed` | Regenerate `supabase/seed.sql` from `lib/data/menu.ts` |

## Where things live
```
app/(site)/          customer pages: home, menu, checkout, order/[token], track, about
app/admin/           login + staff dashboard (orders, menu, settings, analytics, staff)
app/api/orders/      customer order status + lookup (server only, service role)
components/          UI, grouped by area (site, menu, cart, checkout, order, admin, ui)
lib/pricing.ts       pricing and availability rules, shared by browser and server
lib/orders/server.ts trusted order placement: re-prices, checks stock/cutoff/windows
lib/auth/staff.ts    staff session + role checks for admin pages and actions
supabase/            schema, migrations, seed, with row-level security
lib/data/open-questions.md   menu & policy decisions (confirmed and still open)
```

## Security in one paragraph
- The menu is public.
- Orders are only created and read by the server: prices are recalculated from the database, the browser's totals are never trusted, and a repeated submission doesn't create a second order.
- Order links carry a random token, and the database stores only its hash.
- Staff and manager permissions are checked on the server and again by Postgres row-level security. Order status can only move one valid step at a time.
- Public endpoints are rate-limited.
- Secrets live only in `.env.local` locally and in Vercel environment variables when deployed.
