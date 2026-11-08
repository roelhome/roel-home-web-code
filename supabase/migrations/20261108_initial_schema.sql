-- ====================================================================
-- ROEL Home Solutions - Database Schema Migration
-- ====================================================================

-- 1. Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  order_index integer default 0
);

-- 2. Products Table
create table if not exists public.products (
  id text primary key,
  sku text not null,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  short_desc text,
  description text,
  price text,
  image_url text not null,
  specs jsonb default '[]'::jsonb,
  applications text,
  is_featured boolean default true,
  status text default 'published',
  created_at timestamptz default now()
);

-- 3. Services Table
create table if not exists public.services (
  id text primary key,
  number text not null,
  name text not null,
  tag text,
  summary text,
  description text,
  image_url text not null,
  items jsonb default '[]'::jsonb,
  order_index integer default 0
);

-- 4. Projects Table
create table if not exists public.projects (
  id text primary key,
  name text not null,
  location text not null,
  category text not null,
  year text not null,
  image_url text not null,
  summary text,
  story text,
  is_demo boolean default false,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 5. Customer Enquiries Table
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  project_type text,
  message text not null,
  source text default 'contact_form',
  status text default 'unread',
  created_at timestamptz default now()
);

-- 6. Site Settings Table
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.enquiries enable row level security;
alter table public.site_settings enable row level security;

-- Public Read Policies
create policy "Public read published products" on public.products for select using (status = 'published');
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read services" on public.services for select using (true);
create policy "Public read projects" on public.projects for select using (true);
create policy "Public read site_settings" on public.site_settings for select using (true);

-- Enquiry Insert Policy (Public can submit enquiries)
create policy "Public insert enquiries" on public.enquiries for insert with check (true);
