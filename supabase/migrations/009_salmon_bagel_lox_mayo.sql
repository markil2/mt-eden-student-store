-- ════════════════════════════════════════════════════════════════════
-- 009 — Smoked Salmon Bagel, lox bagel, mayo
--
-- Safe to re-run. (Already applied to the live database.)
--   • New item: Smoked Salmon Bagel, $8 — choose plain/everything/cheese/lox bagel, optional mayo
--   • Lox bagel added to every breakfast sandwich's bread choices (free)
--   • Mayonnaise added as a free option on every breakfast sandwich
-- ════════════════════════════════════════════════════════════════════

begin;

insert into public.products (id, category_id, name, description, price_cents, image_url, image_alt, image_is_placeholder, popular, sort)
values ('smoked-salmon-bagel', 'breakfast', 'Smoked Salmon Bagel', 'Smoked salmon and cream cheese on your choice of bagel.', 800, null, null, false, false,
        (select sort from public.products where id = 'sandwich-egg-cheese'))
on conflict (id) do update set name = excluded.name, description = excluded.description, price_cents = excluded.price_cents, archived = false;
insert into public.product_availability (product_id, is_available) values ('smoked-salmon-bagel', true) on conflict (product_id) do nothing;

delete from public.option_groups where product_id in ('sandwich-combo', 'sandwich-protein', 'sandwich-egg-cheese', 'smoked-salmon-bagel');
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'bread', 'Bread', null, true, 1, null, 0, null, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('bagel-lox', 'Lox bagel', 0, null, 3),
  ('croissant', 'Croissant', 0, null, 4)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'protein', 'Protein', 'First protein included · +$1 each extra', true, 3, 1, 100, null, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('turkey', 'Turkey', 0, null, 0),
  ('chicken-sausage', 'Chicken sausage', 0, null, 1),
  ('bacon', 'Bacon', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'cheese', 'Cheese', null, false, 1, null, 0, null, 2) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheddar', 'Cheddar', 0, null, 0),
  ('provolone', 'Provolone', 0, null, 1)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'mayo', 'Add', 'Free', false, 1, null, 0, null, 3) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('mayonnaise', 'Mayonnaise', 0, null, 0)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'drink', 'Drink', 'Included with the combo', true, 1, null, 0, null, 4) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('orange-juice', 'Orange juice', 0, 'orange-juice', 0),
  ('hot-coffee', 'Hot coffee', 0, 'hot-coffee', 1),
  ('tea', 'Tea', 0, 'tea', 2),
  ('water', 'Water', 0, 'water', 3),
  ('lemonade', 'Lemonade', 0, 'lemonade', 4),
  ('energy-drink', 'Energy drink', 0, 'energy-drink', 5),
  ('gatorade', 'Gatorade', 0, 'gatorade', 6),
  ('hot-chocolate', 'Hot chocolate', 0, 'hot-chocolate', 7)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'tea-flavor', 'Tea flavor', 'Only if you chose tea', false, 1, null, 0, 'dropdown', 5) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('chamomile', 'Chamomile', 0, null, 0),
  ('chai-spice', 'Chai Spice', 0, null, 1),
  ('peppermint', 'Peppermint', 0, null, 2),
  ('double-bergamot-earl-grey', 'Double Bergamot Earl Grey', 0, null, 3),
  ('moroccan-mint', 'Moroccan Mint', 0, null, 4),
  ('lemon-ginger', 'Lemon Ginger', 0, null, 5)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'coffee-creamer', 'Coffee creamer', 'Free · only if you chose hot coffee', false, 1, null, 0, 'stepper', 6) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'coffee-sugar', 'Coffee sugar packets', 'Free · only if you chose hot coffee', false, 1, null, 0, 'stepper', 7) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-protein', 'bread', 'Bread', null, true, 1, null, 0, null, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('bagel-lox', 'Lox bagel', 0, null, 3),
  ('croissant', 'Croissant', 0, null, 4)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-protein', 'protein', 'Protein', 'First protein included · +$1 each extra', true, 3, 1, 100, null, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('turkey', 'Turkey', 0, null, 0),
  ('chicken-sausage', 'Chicken sausage', 0, null, 1),
  ('bacon', 'Bacon', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-protein', 'cheese', 'Cheese', null, false, 1, null, 0, null, 2) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheddar', 'Cheddar', 0, null, 0),
  ('provolone', 'Provolone', 0, null, 1)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-protein', 'mayo', 'Add', 'Free', false, 1, null, 0, null, 3) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('mayonnaise', 'Mayonnaise', 0, null, 0)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-egg-cheese', 'bread', 'Bread', null, true, 1, null, 0, null, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('bagel-lox', 'Lox bagel', 0, null, 3),
  ('croissant', 'Croissant', 0, null, 4)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-egg-cheese', 'cheese', 'Cheese', null, false, 1, null, 0, null, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('cheddar', 'Cheddar', 0, null, 0),
  ('provolone', 'Provolone', 0, null, 1)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-egg-cheese', 'mayo', 'Add', 'Free', false, 1, null, 0, null, 2) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('mayonnaise', 'Mayonnaise', 0, null, 0)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('smoked-salmon-bagel', 'bagel', 'Bagel', null, true, 1, null, 0, null, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('bagel-lox', 'Lox bagel', 0, null, 3)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('smoked-salmon-bagel', 'mayo', 'Add', 'Free', false, 1, null, 0, null, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('mayonnaise', 'Mayonnaise', 0, null, 0)) as v(key, label, delta, linked, sort);

commit;
