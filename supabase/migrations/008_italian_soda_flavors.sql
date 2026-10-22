-- ════════════════════════════════════════════════════════════════════
-- 008 — Italian soda flavors (dropdown)
--
-- Run in Supabase → SQL Editor if setting up from scratch. Safe to re-run.
-- (Already applied to the live database.) Only changes the Italian Soda.
--
--   • Required flavor dropdown: Raspberry, Vanilla, Peach, Strawberry
--   • Whipped cream stays optional and free
-- ════════════════════════════════════════════════════════════════════

begin;

update public.products set description = 'Raspberry, Vanilla, Peach or Strawberry. Whipped cream on request.', updated_at = now() where id = 'italian-soda';

delete from public.option_groups where product_id in ('italian-soda');
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('italian-soda', 'flavor', 'Flavor', null, true, 1, null, 0, 'dropdown', 0) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('raspberry', 'Raspberry', 0, null, 0),
  ('vanilla', 'Vanilla', 0, null, 1),
  ('peach', 'Peach', 0, null, 2),
  ('strawberry', 'Strawberry', 0, null, 3)) as v(key, label, delta, linked, sort);
with g as (insert into public.option_groups (product_id, key, label, hint, required, max_select, included_count, extra_each_cents, display, sort)
  values ('italian-soda', 'add', 'Add', null, false, 1, null, 0, null, 1) returning id)
insert into public.options (group_id, key, label, price_delta_cents, linked_product_id, sort) select g.id, v.key, v.label, v.delta, v.linked, v.sort from g, (values
  ('whipped-cream', 'Whipped cream', 0, null, 0)) as v(key, label, delta, linked, sort);

commit;
