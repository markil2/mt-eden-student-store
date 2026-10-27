-- ════════════════════════════════════════════════════════════════════
-- 010 — Ingredient inventory
--
-- Run in Supabase → SQL Editor. Safe to re-run (starter counts are only
-- set the first time).
--
--   • ingredients: counted (bagels, croissants) or in-stock switches (fruit, granola)
--   • ingredient_uses: which menu items / choices need which ingredient
--   • create_order now takes counted ingredients atomically (two people can't
--     both buy the last bagel); canceling an order puts them back
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── Tables ────────────────────────────────────────────────────────────
create table if not exists public.ingredients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(name) between 1 and 60),
  kind       text not null check (kind in ('count', 'switch')),
  quantity   int check (quantity is null or quantity >= 0),
  in_stock   boolean not null default true,
  sort       int not null default 0,
  updated_at timestamptz not null default now(),
  check ((kind = 'count' and quantity is not null) or (kind = 'switch' and quantity is null))
);

create table if not exists public.ingredient_uses (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  product_id    text not null references public.products (id) on delete cascade,
  -- Both null = the whole item needs it. Both set = only that choice needs it.
  group_key     text,
  option_key    text,
  amount        int not null default 1 check (amount between 1 and 20),
  check ((group_key is null) = (option_key is null))
);
create unique index if not exists ingredient_uses_unique
  on public.ingredient_uses (ingredient_id, product_id, coalesce(group_key, ''), coalesce(option_key, ''));
create index if not exists ingredient_uses_product_idx on public.ingredient_uses (product_id);

-- What each order took, so canceling can put it back: { "<ingredient id>": amount }
alter table public.orders add column if not exists ingredient_usage jsonb;

-- ── Security ──────────────────────────────────────────────────────────
alter table public.ingredients     enable row level security;
alter table public.ingredient_uses enable row level security;

drop policy if exists "inventory readable" on public.ingredients;
drop policy if exists "staff update ingredients" on public.ingredients;
drop policy if exists "managers add ingredients" on public.ingredients;
drop policy if exists "managers delete ingredients" on public.ingredients;
drop policy if exists "inventory readable" on public.ingredient_uses;
drop policy if exists "managers write ingredient uses" on public.ingredient_uses;

-- Customers need to see what's out, so both are readable by everyone.
create policy "inventory readable" on public.ingredients for select using (true);
create policy "inventory readable" on public.ingredient_uses for select using (true);
-- Any staff can change counts / switches; only managers add, remove or link.
create policy "staff update ingredients" on public.ingredients
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "managers add ingredients" on public.ingredients
  for insert to authenticated with check (public.is_manager());
create policy "managers delete ingredients" on public.ingredients
  for delete to authenticated using (public.is_manager());
create policy "managers write ingredient uses" on public.ingredient_uses
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- ── Orders take ingredients atomically ───────────────────────────────
drop function if exists public.create_order(jsonb, jsonb);

create or replace function public.create_order(p_order jsonb, p_items jsonb, p_usage jsonb default '{}'::jsonb)
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
  v_use record;
  v_ing public.ingredients%rowtype;
  v_taken jsonb := '{}'::jsonb;
begin
  select * into v_existing from public.orders where idempotency_key = p_order->>'idempotency_key';
  if found then
    return query select v_existing.id, v_existing.number, false;
    return;
  end if;

  -- Lock and take ingredients first (in a stable order to avoid deadlocks).
  for v_use in
    select key::uuid as ingredient_id, value::int as amount
    from jsonb_each_text(coalesce(p_usage, '{}'::jsonb))
    order by key
  loop
    select * into v_ing from public.ingredients where id = v_use.ingredient_id for update;
    if not found then
      continue;
    end if;
    if v_ing.kind = 'switch' then
      if not v_ing.in_stock then
        raise exception 'out_of_stock:%', v_ing.name;
      end if;
    else
      if v_ing.quantity < v_use.amount then
        raise exception 'out_of_stock:%:%', v_ing.name, v_ing.quantity;
      end if;
      update public.ingredients set quantity = quantity - v_use.amount, updated_at = now() where id = v_ing.id;
      v_taken := v_taken || jsonb_build_object(v_ing.id::text, v_use.amount);
    end if;
  end loop;

  insert into public.orders (
    lookup_token_hash, idempotency_key, service_date, customer_name, method, window_id, window_label,
    room, notes, subtotal_cents, delivery_fee_cents, total_cents, status, payment_status, ingredient_usage
  ) values (
    p_order->>'lookup_token_hash', p_order->>'idempotency_key', (p_order->>'service_date')::date,
    p_order->>'customer_name', p_order->>'method', p_order->>'window_id', p_order->>'window_label',
    nullif(p_order->>'room', ''), nullif(p_order->>'notes', ''),
    (p_order->>'subtotal_cents')::int, (p_order->>'delivery_fee_cents')::int, (p_order->>'total_cents')::int,
    'received', 'pending', nullif(v_taken, '{}'::jsonb)
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

  insert into public.order_status_history (order_id, status) values (v_order.id, 'received');

  return query select v_order.id, v_order.number, true;
end;
$$;
revoke all on function public.create_order(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, jsonb) to service_role;

-- Canceling an order puts its counted ingredients back.
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
  v_use record;
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
  else
    for v_use in select key::uuid as ingredient_id, value::int as amount
                 from jsonb_each_text(coalesce(v_order.ingredient_usage, '{}'::jsonb)) loop
      update public.ingredients set quantity = quantity + v_use.amount, updated_at = now()
      where id = v_use.ingredient_id and kind = 'count';
    end loop;
  end if;

  update public.orders
     set status = p_status,
         updated_at = now(),
         ingredient_usage = case when p_status = 'canceled' then null else ingredient_usage end
   where id = p_order_id;
  insert into public.order_status_history (order_id, status, changed_by) values (p_order_id, p_status, auth.uid());
end;
$$;
revoke all on function public.set_order_status(uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, text) to authenticated;

-- ── Live updates ──────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['ingredients', 'ingredient_uses'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ── Starter inventory (only added the first time) ────────────────────
insert into public.ingredients (name, kind, quantity, in_stock, sort) values
  ('Plain bagel', 'count', 2, true, 0),
  ('Everything bagel', 'count', 3, true, 1),
  ('Cheese bagel', 'count', 2, true, 2),
  ('Lox bagel', 'count', 0, true, 3),
  ('Croissant', 'count', 12, true, 4),
  ('Berries', 'switch', null, true, 10),
  ('Granola', 'switch', null, true, 11),
  ('Yogurt', 'switch', null, true, 12)
on conflict (name) do nothing;

-- Bread / bagel choices on the sandwiches and bagels
insert into public.ingredient_uses (ingredient_id, product_id, group_key, option_key)
select i.id, u.product_id, u.group_key, u.option_key
from (values
  ('Plain bagel', 'sandwich-combo', 'bread', 'bagel-plain'),
  ('Plain bagel', 'sandwich-protein', 'bread', 'bagel-plain'),
  ('Plain bagel', 'sandwich-egg-cheese', 'bread', 'bagel-plain'),
  ('Plain bagel', 'smoked-salmon-bagel', 'bagel', 'bagel-plain'),
  ('Plain bagel', 'bagel', 'bagel', 'plain'),
  ('Everything bagel', 'sandwich-combo', 'bread', 'bagel-everything'),
  ('Everything bagel', 'sandwich-protein', 'bread', 'bagel-everything'),
  ('Everything bagel', 'sandwich-egg-cheese', 'bread', 'bagel-everything'),
  ('Everything bagel', 'smoked-salmon-bagel', 'bagel', 'bagel-everything'),
  ('Everything bagel', 'bagel', 'bagel', 'everything'),
  ('Cheese bagel', 'sandwich-combo', 'bread', 'bagel-cheese'),
  ('Cheese bagel', 'sandwich-protein', 'bread', 'bagel-cheese'),
  ('Cheese bagel', 'sandwich-egg-cheese', 'bread', 'bagel-cheese'),
  ('Cheese bagel', 'smoked-salmon-bagel', 'bagel', 'bagel-cheese'),
  ('Cheese bagel', 'bagel', 'bagel', 'cheese'),
  ('Lox bagel', 'sandwich-combo', 'bread', 'bagel-lox'),
  ('Lox bagel', 'sandwich-protein', 'bread', 'bagel-lox'),
  ('Lox bagel', 'sandwich-egg-cheese', 'bread', 'bagel-lox'),
  ('Lox bagel', 'smoked-salmon-bagel', 'bagel', 'bagel-lox'),
  ('Croissant', 'sandwich-combo', 'bread', 'croissant'),
  ('Croissant', 'sandwich-protein', 'bread', 'croissant'),
  ('Croissant', 'sandwich-egg-cheese', 'bread', 'croissant')
) as u(ingredient, product_id, group_key, option_key)
join public.ingredients i on i.name = u.ingredient
join public.products p on p.id = u.product_id
on conflict do nothing;

-- The whole parfait needs berries, granola and yogurt
insert into public.ingredient_uses (ingredient_id, product_id)
select i.id, 'yogurt-parfait'
from public.ingredients i
join public.products p on p.id = 'yogurt-parfait'
where i.name in ('Berries', 'Granola', 'Yogurt')
on conflict do nothing;

commit;
