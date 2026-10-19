-- ════════════════════════════════════════════════════════════════════
-- 002 — Pay in person (cash / Zelle) + request rate limits
--
-- Run in Supabase → SQL Editor AFTER schema.sql. Safe to re-run.
--
-- Online payment (Stripe) was skipped. Customers pay with cash or Zelle when
-- they receive their order. New orders start as "pending" (unpaid); staff
-- record the payment with mark_order_paid(), which is the only thing that
-- counts an order as a sale.
-- ════════════════════════════════════════════════════════════════════

-- How an order was paid (null until staff record it).
alter table public.orders add column if not exists payment_method text;
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('cash', 'zelle'));

-- Payment records can now be cash or Zelle.
alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check
  check (provider in ('mock', 'stripe', 'cash', 'zelle'));
alter table public.payments add column if not exists recorded_by uuid references auth.users (id);

-- Orders are created unpaid; no payment row until money is actually collected.
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
    'received', 'pending'
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
revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

-- Staff record (or undo) an in-person payment.
create or replace function public.set_order_payment(p_order_id uuid, p_method text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_staff() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_method is not null and p_method not in ('cash', 'zelle') then
    raise exception 'unknown payment method %', p_method;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found';
  end if;

  if p_method is null then
    -- Undo a mistaken "paid" tap.
    update public.orders set payment_status = 'pending', payment_method = null, updated_at = now() where id = p_order_id;
    update public.payments set status = 'refunded' where order_id = p_order_id and status = 'succeeded';
  else
    update public.orders set payment_status = 'paid', payment_method = p_method, updated_at = now() where id = p_order_id;
    insert into public.payments (order_id, provider, amount_cents, status, recorded_by)
    values (p_order_id, p_method, v_order.total_cents, 'succeeded', auth.uid());
  end if;
end;
$$;
revoke all on function public.set_order_payment(uuid, text) from public, anon;
grant execute on function public.set_order_payment(uuid, text) to authenticated;

-- ── Rate limits for public endpoints (order placement, order lookup) ──
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 0
);
alter table public.rate_limits enable row level security;
-- No policies: only the service role (server) touches this table.

-- Returns true if the request is allowed. Fixed window per key.
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;

  -- Opportunistic cleanup of old keys.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
