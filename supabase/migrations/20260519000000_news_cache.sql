-- News cache table: shared across all users, refreshed every 5 days
create table if not exists public.news_cache (
  id        text primary key default 'singleton',
  data      jsonb        not null,
  fetched_at timestamptz not null default now()
);

alter table public.news_cache enable row level security;

-- Anyone can read (public news data)
create policy "Public read news_cache"
  on public.news_cache for select using (true);

-- Anyone can insert / upsert (needed for first write)
create policy "Public insert news_cache"
  on public.news_cache for insert with check (true);

-- Anyone can update (refresh cache)
create policy "Public update news_cache"
  on public.news_cache for update using (true);
