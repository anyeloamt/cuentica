alter table public.budget_items
  alter column amount type integer
  using round(amount * 100)::integer;
