-- ════════════════════════════════════════════════════════════════════
-- 003 — Menu update (Oct 2026)
--
-- Run in Supabase → SQL Editor. Safe to re-run. Does NOT touch photos,
-- other items' prices, orders, or staff.
--
--   • Protein: turkey / chicken sausage / bacon — pick 1–3, first included, +$1 each extra
--   • Bread: plain / everything / cheese bagel or croissant
--   • Bagel with Cream Cheese: choose plain / everything / cheese
--   • Chips: Cheetos Puffs / Sour Cream & Onion / Ruffles / Doritos
--   • Italian Soda $5 (+ free whipped cream option), Smoothie $6, Hot Chocolate $3
--   • Hot chocolate added to the combo drinks; Energy Drink marked sold out
-- ════════════════════════════════════════════════════════════════════

begin;

-- "First N included, then +X each" pricing for option groups.
alter table public.option_groups add column if not exists included_count int;
alter table public.option_groups add column if not exists extra_each_cents int not null default 0;
alter table public.option_groups drop constraint if exists option_groups_included_count_check;
alter table public.option_groups add constraint option_groups_included_count_check
  check (included_count is null or included_count >= 0);
alter table public.option_groups drop constraint if exists option_groups_extra_each_cents_check;
alter table public.option_groups add constraint option_groups_extra_each_cents_check
  check (extra_each_cents between 0 and 5000);

-- Prices and descriptions
update public.products set price_cents = 500, updated_at = now() where id = 'italian-soda';
update public.products set price_cents = 600, updated_at = now() where id = 'smoothie';
update public.products set price_cents = 300, updated_at = now() where id = 'hot-chocolate';
update public.products set description = 'Egg with turkey, chicken sausage or bacon, plus OJ, coffee or a drink.', updated_at = now() where id = 'sandwich-combo';
update public.products set description = 'Egg with turkey, chicken sausage or bacon. Extra proteins $1 each.', updated_at = now() where id = 'sandwich-protein';
update public.products set description = 'Egg on a bagel or croissant, with cheese if you like.', updated_at = now() where id = 'sandwich-egg-cheese';
update public.products set description = 'Plain, everything or cheese bagel with cream cheese.', updated_at = now() where id = 'bagel';
update public.products set description = 'Cheetos Puffs, Sour Cream & Onion, Ruffles or Doritos.', updated_at = now() where id = 'chips';
update public.products set description = null, updated_at = now() where id = 'italian-soda';

-- Rebuild option groups for the changed items
delete from public.option_groups where product_id in ('sandwich-combo', 'sandwich-protein', 'sandwich-egg-cheese', 'bagel', 'chips', 'italian-soda');
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-combo', 'bread', 'Bread', null, true, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('croissant', 'Croissant', 0, null, 3)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-combo', 'protein', 'Protein', 'First protein included · +$1 each extra', true, 3, 1, 100, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('turkey', 'Turkey', 0, null, 0),
  ('chicken-sausage', 'Chicken sausage', 0, null, 1),
  ('bacon', 'Bacon', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-combo', 'cheese', 'Cheese', null, false, 1, null, 0, 2) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheddar', 'Cheddar', 0, null, 0),
  ('provolone', 'Provolone', 0, null, 1)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-combo', 'drink', 'Drink', 'Included with the combo', true, 1, null, 0, 3) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('orange-juice', 'Orange juice', 0, 'orange-juice', 0),
  ('hot-coffee', 'Hot coffee', 0, 'hot-coffee', 1),
  ('tea', 'Tea', 0, 'tea', 2),
  ('water', 'Water', 0, 'water', 3),
  ('lemonade', 'Lemonade', 0, 'lemonade', 4),
  ('energy-drink', 'Energy drink', 0, 'energy-drink', 5),
  ('gatorade', 'Gatorade', 0, 'gatorade', 6),
  ('hot-chocolate', 'Hot chocolate', 0, 'hot-chocolate', 7)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-protein', 'bread', 'Bread', null, true, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('croissant', 'Croissant', 0, null, 3)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-protein', 'protein', 'Protein', 'First protein included · +$1 each extra', true, 3, 1, 100, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('turkey', 'Turkey', 0, null, 0),
  ('chicken-sausage', 'Chicken sausage', 0, null, 1),
  ('bacon', 'Bacon', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-protein', 'cheese', 'Cheese', null, false, 1, null, 0, 2) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheddar', 'Cheddar', 0, null, 0),
  ('provolone', 'Provolone', 0, null, 1)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-egg-cheese', 'bread', 'Bread', null, true, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('croissant', 'Croissant', 0, null, 3)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-egg-cheese', 'cheese', 'Cheese', null, false, 1, null, 0, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheddar', 'Cheddar', 0, null, 0),
  ('provolone', 'Provolone', 0, null, 1)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('bagel', 'bagel', 'Bagel', null, true, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('plain', 'Plain', 0, null, 0),
  ('everything', 'Everything', 0, null, 1),
  ('cheese', 'Cheese', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('chips', 'flavor', 'Flavor', null, true, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheetos-puffs', 'Cheetos Puffs', 0, null, 0),
  ('sour-cream-onion', 'Sour Cream & Onion', 0, null, 1),
  ('ruffles', 'Ruffles', 0, null, 2),
  ('doritos', 'Doritos', 0, null, 3)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('italian-soda', 'add', 'Add', null, false, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('whipped-cream', 'Whipped cream', 0, null, 0)) as v(key, label, delta, linked, sort);

-- Stock
update public.product_availability set is_available = false, updated_at = now() where product_id = 'energy-drink';

commit;
