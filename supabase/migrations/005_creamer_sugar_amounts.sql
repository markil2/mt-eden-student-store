-- ════════════════════════════════════════════════════════════════════
-- 005 — Creamer & sugar amounts
--
-- Run in Supabase → SQL Editor. Safe to re-run. Only rebuilds the options
-- for Hot Coffee, Cold Brew and the Breakfast Sandwich Combo. Photos,
-- prices, orders and staff are not touched.
--
--   • Hot Coffee & Cold Brew: Creamer (none/1/2/3) and Sugar packets (none/1/2/3), free
--   • Combo: the same two choices for its hot coffee
-- ════════════════════════════════════════════════════════════════════

begin;

delete from public.option_groups where product_id in ('hot-coffee', 'cold-brew', 'sandwich-combo');
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('hot-coffee', 'creamer', 'Creamer', 'Free · tap again to remove', false, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('hot-coffee', 'sugar', 'Sugar packets', 'Free · tap again to remove', false, 1, null, 0, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('cold-brew', 'creamer', 'Creamer', 'Free · tap again to remove', false, 1, null, 0, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('cold-brew', 'sugar', 'Sugar packets', 'Free · tap again to remove', false, 1, null, 0, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);
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
  values ('sandwich-combo', 'coffee-creamer', 'Coffee creamer', 'Free · only if you chose hot coffee', false, 1, null, 0, 4) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, sort)
  values ('sandwich-combo', 'coffee-sugar', 'Coffee sugar packets', 'Free · only if you chose hot coffee', false, 1, null, 0, 5) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);

commit;
