-- ====================================================================
-- ROEL Home Solutions - Blogs Table Migration
-- ====================================================================

create table if not exists public.blogs (
  id text primary key,
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_image text not null,
  category text default 'General',
  author text default 'ROEL Studio Editorial',
  author_role text default 'Architectural Materials Specialist',
  read_time text default '5 min read',
  tags jsonb default '[]'::jsonb,
  is_featured boolean default false,
  status text default 'published',
  seo_title text,
  seo_description text,
  seo_keywords jsonb default '[]'::jsonb,
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blogs_slug on public.blogs (slug);
create index if not exists idx_blogs_status_published on public.blogs (status, published_at desc);
create index if not exists idx_blogs_category on public.blogs (category);

alter table public.blogs enable row level security;

-- Drop previous policies if re-running
drop policy if exists "Public read published blogs" on public.blogs;
drop policy if exists "Admin all blogs" on public.blogs;

-- Public read access
create policy "Public read published blogs" on public.blogs
  for select using (status = 'published');

-- Admin full access
create policy "Admin all blogs" on public.blogs
  for all to authenticated using (true) with check (true);
