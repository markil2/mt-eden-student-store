-- ════════════════════════════════════════════════════════════════════
-- Mt. Eden Student Store — database schema (Phase 2)
--
-- Run this ONCE in Supabase → SQL Editor, then run seed.sql.
-- Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE
-- where possible.
--
-- Security model
--   • Menu, stock and store settings are publicly readable (the menu is public).
--   • Only staff can change stock; only managers can change menu/settings/staff.
--   • Orders are NEVER readable by the public. Customers create and look up
--     orders through the Next.js server (service role), which re-prices
--     everything and only returns a safe subset of fields.
--   • Staff read orders through RLS and change status only via
--     set_order_status(), which enforces the pickup/delivery workflow.
--   • All money is stored as integer cents.
-- ════════════════════════════════════════════════════════════════════

-- ── Staff & roles ─────────────────────────────────────────────────────
create table if not exists public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email        text not null default '',
  role         text not null default 'staff' check (role in ('staff', 'manager')),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create or replace function public.staff_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select s.role from public.staff s where s.user_id = auth.uid() and s.active
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.staff_role() is not null $$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.staff_role() = 'manager' $$;

-- ── Menu ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id    text primary key,
  name  text not null,
  blurb text not null default '',
  sort  int  not null default 0
);

create table if not exists public.products (
  id                   text primary key,
  category_id          text not null references public.categories (id),
  name                 text not null check (length(name) between 1 and 80),
  description          text check (description is null or length(description) <= 200),
  price_cents          int  not null check (price_cents between 0 and 10000),
  image_url            text,
  image_alt            text,
  image_is_placeholder boolean not null default false,
  popular              boolean not null default false,
  sort                 int not null default 0,
  archived             boolean not null default false,
  updated_at           timestamptz not null default now()
);

create table if not exists public.option_groups (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products (id) on delete cascade,
  key         text not null,
  label       text not null,
  hint        text,
  required    boolean not null default false,
  max_select  int not null default 1 check (max_select >= 1),
  -- "First N included, then +X each" (e.g. first protein free, +$1 per extra)
  included_count   int check (included_count is null or included_count >= 0),
  extra_each_cents int not null default 0 check (extra_each_cents between 0 and 5000),
  -- How the choice is shown: buttons (default), dropdown, or a −/+ stepper
  display     text check (display is null or display in ('buttons', 'dropdown', 'stepper')),
  sort        int not null default 0,
  unique (product_id, key)
);

create table if not exists public.options (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.option_groups (id) on delete cascade,
  key               text not null,
  label             text not null,
  price_delta_cents int not null default 0 check (price_delta_cents between 0 and 5000),
  linked_product_id text references public.products (id),
  sort              int not null default 0,
  unique (group_id, key)
);

-- Stock is kept apart from product info so staff can flip it any time.
create table if not exists public.product_availability (
  product_id   text primary key references public.products (id) on delete cascade,
  is_available boolean not null default true,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id)
);

-- ── Store settings (single row) & fulfillment windows ─────────────────
create table if not exists public.store_settings (
  id                 int primary key default 1 check (id = 1),
  ordering_paused    boolean not null default false,
  pause_message      text not null default 'Online ordering is paused right now. Check back soon!',
  order_cutoff       text not null default '08:00' check (order_cutoff ~ '^[0-2][0-9]:[0-5][0-9]$'),
  enforce_cutoff     boolean not null default true,
  timezone           text not null default 'America/Los_Angeles',
  pickup_enabled     boolean not null default true,
  pickup_location    text not null default 'Resting room, E Hall',
  delivery_enabled   boolean not null default true,
  delivery_fee_cents int not null default 0 check (delivery_fee_cents between 0 and 2000),
  require_room       boolean not null default true,
  hours              jsonb not null default '[]'::jsonb,
  hours_note         text not null default '',
  contact            jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now()
);

create table if not exists public.fulfillment_windows (
  id       text primary key,
  label    text not null,
  detail   text not null default '',
  pickup   boolean not null default true,
  delivery boolean not null default true,
  capacity int check (capacity is null or capacity > 0),
  sort     int not null default 0,
  active   boolean not null default true
);

-- ── Orders ────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  number             bigint generated always as identity (start with 1001) unique,
  -- sha256 of the private link token; the raw token only ever lives in the customer's URL
  lookup_token_hash  text not null unique,
  idempotency_key    text not null unique,
  created_at         timestamptz not null default now(),
  service_date       date not null,
  customer_name      text not null check (length(customer_name) between 1 and 60),
  method             text not null check (method in ('pickup', 'delivery')),
  window_id          text not null,
  window_label       text not null,
  room               text check (room is null or length(room) <= 20),
  notes              text check (notes is null or length(notes) <= 200),
  subtotal_cents     int not null check (subtotal_cents >= 0),
  delivery_fee_cents int not null default 0 check (delivery_fee_cents >= 0),
  total_cents        int not null check (total_cents = subtotal_cents + delivery_fee_cents),
  status             text not null default 'received'
                     check (status in ('received','preparing','ready','out_for_delivery','completed','delivered','canceled')),
  payment_status     text not null default 'pending'
                     check (payment_status in ('mock_paid','pending','paid','failed','refunded')),
  updated_at         timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- Snapshot of what was bought, so later menu/price edits never change past orders.
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       text not null,
  name             text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity         int not null check (quantity between 1 and 20),
  sort             int not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_item_options (
  id                uuid primary key default gen_random_uuid(),
  order_item_id     uuid not null references public.order_items (id) on delete cascade,
  group_label       text not null,
  option_label      text not null,
  price_delta_cents int not null default 0,
  sort              int not null default 0
);
create index if not exists order_item_options_item_idx on public.order_item_options (order_item_id);

-- One row per payment attempt. Phase 2 records "mock" payments; Phase 3 adds Stripe.
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  provider     text not null check (provider in ('mock', 'stripe')),
  provider_ref text unique,
  amount_cents int not null check (amount_cents >= 0),
  status       text not null check (status in ('pending','succeeded','failed','refunded')),
  created_at   timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     text not null,
  changed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id);

-- ── Row-level security ────────────────────────────────────────────────
alter table public.staff                enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.option_groups        enable row level security;
alter table public.options              enable row level security;
alter table public.product_availability enable row level security;
alter table public.store_settings       enable row level security;
alter table public.fulfillment_windows  enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_item_options   enable row level security;
alter table public.payments             enable row level security;
alter table public.order_status_history enable row level security;

-- Drop-and-create keeps this file re-runnable.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Public (anon + signed-in) can read the menu and store info.
create policy "menu readable" on public.categories           for select using (true);
create policy "menu readable" on public.products             for select using (true);
create policy "menu readable" on public.option_groups        for select using (true);
create policy "menu readable" on public.options              for select using (true);
create policy "menu readable" on public.product_availability for select using (true);
create policy "menu readable" on public.store_settings       for select using (true);
create policy "menu readable" on public.fulfillment_windows  for select using (true);

-- Staff can flip stock; managers can change everything about the menu & store.
create policy "staff update stock" on public.product_availability
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "managers insert stock" on public.product_availability
  for insert to authenticated with check (public.is_manager());

create policy "managers write categories" on public.categories           for all to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers write products"   on public.products             for all to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers write groups"     on public.option_groups        for all to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers write options"    on public.options              for all to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers write settings"   on public.store_settings       for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers write windows"    on public.fulfillment_windows  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Staff table: everyone on staff can see the team; only managers change it.
create policy "staff read team"   on public.staff for select to authenticated using (public.is_staff() or user_id = auth.uid());
create policy "managers manage team" on public.staff for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Orders: staff read only. No insert/update/delete policies — writes go through functions.
create policy "staff read orders"   on public.orders               for select to authenticated using (public.is_staff());
create policy "staff read items"    on public.order_items          for select to authenticated using (public.is_staff());
create policy "staff read options"  on public.order_item_options   for select to authenticated using (public.is_staff());
create policy "staff read history"  on public.order_status_history for select to authenticated using (public.is_staff());
create policy "managers read payments" on public.payments          for select to authenticated using (public.is_manager());

-- ── Order functions ───────────────────────────────────────────────────

-- Creates an order atomically. Called ONLY by the Next.js server with the
-- service role after it has re-priced the cart and checked stock/cutoff.
-- Idempotent: the same idempotency_key returns the existing order.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns table (out_id uuid, out_number bigint, out_created boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_opt jsonb;
  v_item_id uuid;
  v_i int := 0;
  v_j int;
begin
  select * into v_existing from public.orders where idempotency_key = p_order->>'idempotency_key';
  if found then
    return query select v_existing.id, v_existing.number, false;
    return;
  end if;

  insert into public.orders (
    lookup_token_hash, idempotency_key, service_date, customer_name, method, window_id, window_label,
    room, notes, subtotal_cents, delivery_fee_cents, total_cents, status, payment_status
  ) values (
    p_order->>'lookup_token_hash', p_order->>'idempotency_key', (p_order->>'service_date')::date,
    p_order->>'customer_name', p_order->>'method', p_order->>'window_id', p_order->>'window_label',
    nullif(p_order->>'room', ''), nullif(p_order->>'notes', ''),
    (p_order->>'subtotal_cents')::int, (p_order->>'delivery_fee_cents')::int, (p_order->>'total_cents')::int,
    'received', p_order->>'payment_status'
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (order_id, product_id, name, unit_price_cents, quantity, sort)
    values (v_order.id, v_item->>'product_id', v_item->>'name', (v_item->>'unit_price_cents')::int,
            (v_item->>'quantity')::int, v_i)
    returning id into v_item_id;
    v_j := 0;
    for v_opt in select * from jsonb_array_elements(coalesce(v_item->'options', '[]'::jsonb)) loop
      insert into public.order_item_options (order_item_id, group_label, option_label, price_delta_cents, sort)
      values (v_item_id, v_opt->>'group_label', v_opt->>'option_label', (v_opt->>'price_delta_cents')::int, v_j);
      v_j := v_j + 1;
    end loop;
    v_i := v_i + 1;
  end loop;

  insert into public.payments (order_id, provider, amount_cents, status)
  values (v_order.id, 'mock', v_order.total_cents,
          case when v_order.payment_status = 'mock_paid' then 'succeeded' else 'pending' end);

  insert into public.order_status_history (order_id, status) values (v_order.id, 'received');

  return query select v_order.id, v_order.number, true;
end;
$$;
revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

-- Moves an order through its workflow. Staff only; rejects invalid jumps.
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_flow text[];
  v_from int;
  v_to int;
begin
  if not public.is_staff() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found';
  end if;

  if v_order.status in ('completed', 'delivered', 'canceled') then
    raise exception 'order is already closed';
  end if;

  if p_status <> 'canceled' then
    v_flow := case v_order.method
      when 'pickup' then array['received','preparing','ready','completed']
      else array['received','preparing','ready','out_for_delivery','delivered'] end;
    v_from := array_position(v_flow, v_order.status);
    v_to := array_position(v_flow, p_status);
    if v_to is null or v_to <> v_from + 1 then
      raise exception 'invalid status change from % to %', v_order.status, p_status;
    end if;
  end if;

  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
  insert into public.order_status_history (order_id, status, changed_by) values (p_order_id, p_status, auth.uid());
end;
$$;
revoke all on function public.set_order_status(uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, text) to authenticated;

-- ── Realtime ──────────────────────────────────────────────────────────
-- Staff dashboards get live order updates; customer menus get live stock.
do $$
declare t text;
begin
  foreach t in array array['orders','product_availability','products','store_settings','fulfillment_windows'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ── Storage: menu photos ──────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "menu images public read" on storage.objects;
drop policy if exists "managers upload menu images" on storage.objects;
drop policy if exists "managers update menu images" on storage.objects;
drop policy if exists "managers delete menu images" on storage.objects;
create policy "menu images public read" on storage.objects for select using (bucket_id = 'menu-images');
create policy "managers upload menu images" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_manager());
create policy "managers update menu images" on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and public.is_manager());
create policy "managers delete menu images" on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_manager());
