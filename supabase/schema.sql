create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text unique not null,
  password_hash text not null,   -- bcryptjs hash, saltRounds=10
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users enable row level security;
-- Users table is ONLY accessed via service role (server-side API routes)
-- Never expose user data via anon key
create policy "Service role full access users" on users for all using (auth.role() = 'service_role');

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  category text not null default 'Other',
  brand text,
  amazon_url text,
  original_price numeric(10,2) not null,   -- Amazon MRP / online price
  our_price numeric(10,2) not null,         -- 10% below original_price, rounded to nearest rupee
  prepaid_price numeric(10,2) not null,     -- our_price minus ₹1,000 flat (Full Prepaid savings)
  images text[] not null default '{}',     -- Supabase Storage public URLs (re-uploaded from Amazon)
  specs jsonb default '{}',               -- Key-value pairs from Amazon spec table
  in_stock boolean default true,
  rating numeric(3,1) default 0,
  review_count int default 0,
  last_price_refresh timestamptz,          -- When was the Amazon price last fetched
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products enable row level security;
create policy "Public read all products" on products for select using (true);
create policy "Service role full access products" on products for all using (auth.role() = 'service_role');

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,     -- e.g. #NXT-A9B2C3D4 (prefix + 8 random uppercase hex)
  user_id uuid references users(id) on delete set null,  -- nullable (guest orders allowed)
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_address text not null,        -- Full street address
  customer_city text not null,
  customer_state text not null,
  customer_pincode text not null,
  items jsonb not null,  -- Array: [{product_id, slug, name, quantity, our_price, prepaid_price, image}]
  subtotal numeric(10,2) not null,       -- Sum of (our_price * qty) for all items
  payment_method text not null,          -- 'prepaid' | 'half_cod'
  final_amount numeric(10,2) not null,   -- If prepaid: sum of prepaid_price. If half_cod: subtotal.
  advance_amount numeric(10,2),          -- Half COD: 50% of final_amount
  remaining_amount numeric(10,2),        -- Half COD: 50% of final_amount
  savings_amount numeric(10,2),          -- Total savings vs Amazon MRP
  status text default 'pending',         -- 'pending'|'confirmed'|'shipped'|'delivered'|'cancelled'
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;
-- Orders are only inserted via API route (server-side), read only via service role
create policy "Service role full access orders" on orders for all using (auth.role() = 'service_role');
-- Allow insert from anon (guest checkout via API route validation)
create policy "Anon can insert order" on orders for insert with check (true);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean default false,
  created_at timestamptz default now()
);

alter table reviews enable row level security;
create policy "Public read approved reviews" on reviews for select using (is_approved = true);
create policy "Public insert review" on reviews for insert with check (true);
create policy "Service role full access reviews" on reviews for all using (auth.role() = 'service_role');

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  lucide_icon text not null,   -- Lucide icon component name as string (e.g. 'Smartphone')
  sort_order int default 0
);

alter table categories enable row level security;
create policy "Public read categories" on categories for select using (true);
create policy "Service role full access categories" on categories for all using (auth.role() = 'service_role');

insert into categories (name, slug, lucide_icon, sort_order) values
  ('All',          'all',          'LayoutGrid',    0),
  ('Smartphones',  'smartphones',  'Smartphone',    1),
  ('Tablets',      'tablets',      'Tablet',        2),
  ('Accessories',  'accessories',  'Headphones',    3),
  ('Smartwatches', 'smartwatches', 'Watch',         4),
  ('Audio',        'audio',        'Volume2',       5),
  ('Laptops',      'laptops',      'Laptop',        6),
  ('Other',        'other',        'Package',       7);
