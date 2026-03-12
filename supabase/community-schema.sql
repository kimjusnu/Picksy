create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  avatar_url text,
  preferred_locale text check (preferred_locale in ('ko', 'en')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  room text not null check (room in ('Weekend', 'Work', 'Food', 'Travel', 'Dating')),
  selected_side text not null check (selected_side in ('left', 'right')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, card_id)
);

create index if not exists votes_card_id_idx on public.votes (card_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room text not null check (room in ('Weekend', 'Work', 'Food', 'Travel', 'Dating')),
  card_id text,
  body text not null check (char_length(body) between 1 and 180),
  moderation_status text not null default 'visible' check (moderation_status in ('visible', 'review', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_comments_room_idx on public.community_comments (room, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_community_comments_updated_at on public.community_comments;
create trigger set_community_comments_updated_at
before update on public.community_comments
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url, preferred_locale)
  values (
    new.id,
    left(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'member'
      ),
      24
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    'ko'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "profiles are public readable" on public.profiles;
create policy "profiles are public readable"
  on public.profiles
  for select
  using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users read their own votes" on public.votes;
create policy "users read their own votes"
  on public.votes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert their own votes" on public.votes;
create policy "users insert their own votes"
  on public.votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own votes" on public.votes;
create policy "users update their own votes"
  on public.votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "visible comments are public" on public.community_comments;
create policy "visible comments are public"
  on public.community_comments
  for select
  using (moderation_status = 'visible');

drop policy if exists "users insert their own comments" on public.community_comments;
create policy "users insert their own comments"
  on public.community_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own comments" on public.community_comments;
create policy "users update their own comments"
  on public.community_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.get_vote_totals(target_card_id text)
returns table (
  left_votes bigint,
  right_votes bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where selected_side = 'left') as left_votes,
    count(*) filter (where selected_side = 'right') as right_votes
  from public.votes
  where card_id = target_card_id;
$$;

revoke all on function public.get_vote_totals(text) from public;
grant execute on function public.get_vote_totals(text) to anon, authenticated;
