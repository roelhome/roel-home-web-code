-- Add gallery column to projects table
alter table public.projects add column if not exists gallery jsonb default '[]'::jsonb;
