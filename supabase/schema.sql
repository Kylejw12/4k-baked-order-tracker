-- ============================================================
-- 4K Baked Order Tracker — Supabase Schema
-- Run this once in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  notes      text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRODUCTS (the catalog)
-- unit_small / unit_large are the DISPLAY labels for the two sizes
-- e.g. "Half" / "Full"  or  "Half Dozen" / "Dozen"
-- ------------------------------------------------------------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,        -- 'Sourdough Loaves', 'Croissant Loaf', 'Sourdough Muffins', 'Sourdough Cookies'
  name        text not null,        -- e.g. 'Cinnamon & Sugar'
  unit_small  text not null default 'Half',
  unit_large  text not null default 'Full',
  price_small numeric(10,2),
  price_large numeric(10,2),
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ORDERS
-- size: 'small' or 'large' — maps to the product's unit_small/unit_large
-- pickup_week: the Thursday date for that week's pickup (date, not timestamp)
-- status: Pending -> Ready -> Picked up
-- ------------------------------------------------------------
create table if not exists orders (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  product_id   uuid not null references products(id) on delete restrict,
  size         text not null check (size in ('small','large')),
  quantity     int  not null default 1 check (quantity > 0),
  pickup_week  date not null,
  status       text not null default 'Pending' check (status in ('Pending','Ready','Picked up')),
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_orders_pickup_week on orders(pickup_week);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_product on orders(product_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- This app has one (or a small handful of) logged-in users — you and your wife.
-- Policy: any authenticated Supabase user can read/write everything.
-- Nobody unauthenticated (i.e. the public/anon key without a login) can touch data.
-- ------------------------------------------------------------
alter table customers enable row level security;
alter table products  enable row level security;
alter table orders    enable row level security;

create policy "authenticated read customers"   on customers for select using (auth.role() = 'authenticated');
create policy "authenticated write customers"  on customers for insert with check (auth.role() = 'authenticated');
create policy "authenticated update customers" on customers for update using (auth.role() = 'authenticated');
create policy "authenticated delete customers" on customers for delete using (auth.role() = 'authenticated');

create policy "authenticated read products"    on products for select using (auth.role() = 'authenticated');
create policy "authenticated write products"   on products for insert with check (auth.role() = 'authenticated');
create policy "authenticated update products"  on products for update using (auth.role() = 'authenticated');
create policy "authenticated delete products"  on products for delete using (auth.role() = 'authenticated');

create policy "authenticated read orders"      on orders for select using (auth.role() = 'authenticated');
create policy "authenticated write orders"     on orders for insert with check (auth.role() = 'authenticated');
create policy "authenticated update orders"    on orders for update using (auth.role() = 'authenticated');
create policy "authenticated delete orders"    on orders for delete using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- SEED DATA — from the 4K Baked menu you shared
-- Items marked "TODO" are categories mentioned in your app description
-- (Croissant Loaf x3 flavors, Sourdough Cookies) that weren't on the menu
-- photo — edit name/prices directly in the Products tab of the app, or here.
-- ------------------------------------------------------------
insert into products (category, name, unit_small, unit_large, price_small, price_large, sort_order) values
-- Sourdough Loaves (Half/Full)
('Sourdough Loaves', 'Regular',                             'Half', 'Full', 6,  10, 1),
('Sourdough Loaves', 'Cinnamon & Sugar',                     'Half', 'Full', 7,  12, 2),
('Sourdough Loaves', 'Strawberry White Chocolate Chip',      'Half', 'Full', 9,  12, 3),
('Sourdough Loaves', 'Jalapeno Cheddar',                     'Half', 'Full', 9,  12, 4),
('Sourdough Loaves', 'Blueberry Lemon',                      'Half', 'Full', 9,  12, 5),
('Sourdough Loaves', 'Chocolate Chip',                       'Half', 'Full', 9,  12, 6),
('Sourdough Loaves', 'S''mores',                             'Half', 'Full', 10, 15, 7),
('Sourdough Loaves', 'Berry Blast',                          'Half', 'Full', 10, 15, 8),

-- Croissant Loaf (TODO: confirm the 3 real flavors + pricing — placeholders below)
('Croissant Loaf', 'TODO Flavor 1', 'Half', 'Full', 8, 14, 1),
('Croissant Loaf', 'TODO Flavor 2', 'Half', 'Full', 8, 14, 2),
('Croissant Loaf', 'TODO Flavor 3', 'Half', 'Full', 8, 14, 3),

-- Sourdough Muffins (Half Dozen/Dozen)
('Sourdough Muffins', 'Pumpkin Chocolate Chip',              'Half Dozen', 'Dozen', 12, 20, 1),
('Sourdough Muffins', 'Strawberry White Chocolate',          'Half Dozen', 'Dozen', 15, 24, 2),
('Sourdough Muffins', 'Blueberry White Chocolate',           'Half Dozen', 'Dozen', 15, 24, 3),
('Sourdough Muffins', 'Apple Cinnamon',                      'Half Dozen', 'Dozen', 15, 24, 4),
('Sourdough Muffins', 'Banana Nut',                          'Half Dozen', 'Dozen', 15, 24, 5),
('Sourdough Muffins', 'Pumpkin Coffee Cake (streusel & drizzle)', 'Half Dozen', 'Dozen', 15, 24, 6),

-- Sourdough Cookies (TODO: confirm real flavors + pricing — placeholders below)
('Sourdough Cookies', 'TODO Flavor 1', 'Half Dozen', 'Dozen', 8, 15, 1),
('Sourdough Cookies', 'TODO Flavor 2', 'Half Dozen', 'Dozen', 8, 15, 2);

-- Note: the "Fall Box" and "Variety Box" ($15, 6 ct.) from the menu are bundles,
-- not single products — add them as their own products in the app if you sell
-- them as a distinct line item, e.g. category 'Boxes'.
