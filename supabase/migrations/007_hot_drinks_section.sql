-- ════════════════════════════════════════════════════════════════════
-- 007 — "Coffee, Tea & Hot Chocolate" section
--
-- Renames the coffee section and moves Hot Chocolate and Chai Latte into it
-- (from Beverages). Data only; safe to re-run. Prices, photos, orders and
-- staff are not touched.
-- ════════════════════════════════════════════════════════════════════

begin;

update public.categories set name = 'Coffee, Tea & Hot Chocolate' where id = 'coffee';
update public.products set category_id = 'coffee', sort = (select sort from public.products where id = 'tea') + 1, updated_at = now() where id = 'hot-chocolate';
update public.products set category_id = 'coffee', sort = (select sort from public.products where id = 'tea') + 2, updated_at = now() where id = 'chai-latte';

commit;
