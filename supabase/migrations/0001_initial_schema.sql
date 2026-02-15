create extension if not exists pgcrypto;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  "order" integer not null,
  color text,
  category_id text,
  created_at bigint not null,
  updated_at bigint not null,
  sync_status text default 'pending',
  deleted boolean default false
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  "order" integer not null,
  name text not null,
  type text not null check (type in ('+', '-')),
  amount numeric(12, 2) not null,
  date text,
  category_tag text,
  created_at bigint not null,
  updated_at bigint not null,
  sync_status text default 'pending',
  deleted boolean default false
);

create index if not exists wallets_user_id_idx on public.wallets (user_id);
create index if not exists wallets_updated_at_idx on public.wallets (updated_at);
create index if not exists wallets_deleted_idx on public.wallets (deleted);

create index if not exists budget_items_user_id_idx on public.budget_items (user_id);
create index if not exists budget_items_wallet_id_idx on public.budget_items (wallet_id);
create index if not exists budget_items_updated_at_idx on public.budget_items (updated_at);
create index if not exists budget_items_deleted_idx on public.budget_items (deleted);

alter table public.wallets enable row level security;
alter table public.budget_items enable row level security;

create policy "wallets_select_own"
  on public.wallets
  for select
  using (auth.uid() = user_id);

create policy "wallets_insert_own"
  on public.wallets
  for insert
  with check (auth.uid() = user_id);

create policy "wallets_update_own"
  on public.wallets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wallets_delete_own"
  on public.wallets
  for delete
  using (auth.uid() = user_id);

create policy "budget_items_select_own"
  on public.budget_items
  for select
  using (auth.uid() = user_id);

create policy "budget_items_insert_own"
  on public.budget_items
  for insert
  with check (auth.uid() = user_id);

create policy "budget_items_update_own"
  on public.budget_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "budget_items_delete_own"
  on public.budget_items
  for delete
  using (auth.uid() = user_id);
