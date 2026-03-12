create table if not exists public.app_content (
  locale text not null check (locale in ('ko', 'en')),
  content_key text not null check (content_key in ('cards', 'leaderboard', 'rewards', 'comments')),
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (locale, content_key)
);

alter table public.app_content enable row level security;

drop policy if exists "app content is public readable" on public.app_content;

create policy "app content is public readable"
  on public.app_content
  for select
  using (true);

comment on table public.app_content is
  'Stores localized app payloads for LoopPick. Seed keys: cards, leaderboard, rewards, comments.';
