-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run

create table posts (
  id text primary key,              -- this is the URL slug, e.g. 'why-im-starting-this-blog'
  title text not null,
  date date not null default current_date,
  tags text[] default '{}',
  cover_image text,
  content text not null,            -- markdown
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Turn on Row Level Security so only the right people can read/write
alter table posts enable row level security;

-- Anyone (your site visitors) can read posts that are published
create policy "Public can read published posts"
on posts for select
using (published = true);

-- Only a signed-in user (you, via admin.html) can read/write/delete everything
create policy "Authenticated users can manage posts"
on posts for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ---------- image uploads (cover images and inline post images) ----------

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true);

create policy "Public can view post images"
on storage.objects for select
using (bucket_id = 'post-images');

create policy "Authenticated can upload post images"
on storage.objects for insert
with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
