-- ════════════════════════════════════════════════════════════════════
-- 006 — Tea flavors (dropdown)
--
-- Run in Supabase → SQL Editor. Safe to re-run. Only changes Tea, the
-- Breakfast Sandwich Combo, Hot Coffee and Cold Brew options. Photos,
-- prices, orders and staff are not touched.
--
--   • Tea: required flavor dropdown — Chamomile, Chai Spice, Peppermint,
--     Double Bergamot Earl Grey, Moroccan Mint, Lemon Ginger
--   • Combo: optional "Tea flavor" dropdown (if tea is the drink)
--   • New option_groups.display column (buttons / dropdown / stepper)
-- ════════════════════════════════════════════════════════════════════

begin;

alter table public.option_groups add column if not exists display text;
alter table public.option_groups drop constraint if exists option_groups_display_check;
alter table public.option_groups add constraint option_groups_display_check
  check (display is null or display in ('buttons', 'dropdown', 'stepper'));

update public.products set description = 'Chamomile, Chai Spice, Peppermint, Earl Grey, Moroccan Mint or Lemon Ginger.', updated_at = now() where id = 'tea';

delete from public.option_groups where product_id in ('tea', 'sandwich-combo', 'hot-coffee', 'cold-brew');
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('tea', 'flavor', 'Flavor', null, true, 1, null, 0, 'dropdown', 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('chamomile', 'Chamomile', 0, null, 0),
  ('chai-spice', 'Chai Spice', 0, null, 1),
  ('peppermint', 'Peppermint', 0, null, 2),
  ('double-bergamot-earl-grey', 'Double Bergamot Earl Grey', 0, null, 3),
  ('moroccan-mint', 'Moroccan Mint', 0, null, 4),
  ('lemon-ginger', 'Lemon Ginger', 0, null, 5)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'bread', 'Bread', null, true, 1, null, 0, null, 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('bagel-plain', 'Plain bagel', 0, null, 0),
  ('bagel-everything', 'Everything bagel', 0, null, 1),
  ('bagel-cheese', 'Cheese bagel', 0, null, 2),
  ('croissant', 'Croissant', 0, null, 3)) as v(key, label, delta, linked, sort);
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
  values ('sandwich-combo', 'drink', 'Drink', 'Included with the combo', true, 1, null, 0, null, 3) returning id)
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
  values ('sandwich-combo', 'tea-flavor', 'Tea flavor', 'Only if you chose tea', false, 1, null, 0, 'dropdown', 4) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('chamomile', 'Chamomile', 0, null, 0),
  ('chai-spice', 'Chai Spice', 0, null, 1),
  ('peppermint', 'Peppermint', 0, null, 2),
  ('double-bergamot-earl-grey', 'Double Bergamot Earl Grey', 0, null, 3),
  ('moroccan-mint', 'Moroccan Mint', 0, null, 4),
  ('lemon-ginger', 'Lemon Ginger', 0, null, 5)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'coffee-creamer', 'Coffee creamer', 'Free · only if you chose hot coffee', false, 1, null, 0, 'stepper', 5) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('sandwich-combo', 'coffee-sugar', 'Coffee sugar packets', 'Free · only if you chose hot coffee', false, 1, null, 0, 'stepper', 6) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('hot-coffee', 'creamer', 'Creamer', 'Free', false, 1, null, 0, 'stepper', 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('hot-coffee', 'sugar', 'Sugar packets', 'Free', false, 1, null, 0, 'stepper', 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('cold-brew', 'creamer', 'Creamer', 'Free', false, 1, null, 0, 'stepper', 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 creamer', 0, null, 0),
  ('2', '2 creamers', 0, null, 1),
  ('3', '3 creamers', 0, null, 2)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('cold-brew', 'sugar', 'Sugar packets', 'Free', false, 1, null, 0, 'stepper', 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('1', '1 sugar packet', 0, null, 0),
  ('2', '2 sugar packets', 0, null, 1),
  ('3', '3 sugar packets', 0, null, 2)) as v(key, label, delta, linked, sort);

commit;
