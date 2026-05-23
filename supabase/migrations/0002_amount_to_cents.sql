alter table public.budget_items
  alter column amount type bigint
  using round(amount * 100)::bigint;
