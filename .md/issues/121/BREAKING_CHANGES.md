# Breaking Changes - Issue #121

## Production Deployment Plan

This change must be deployed in a way that preserves all existing production data.

### Production-Safe Sequence

1. **Deploy the new application code first**
   - The app can read both legacy `numeric(12,2)` amounts and new integer-cent amounts during the transition window.
   - Existing users continue using the app without data loss.

2. **Run `supabase/migrations/0002_amount_to_cents.sql`**
   ```sql
   alter table public.budget_items
     alter column amount type integer
     using round(amount * 100)::integer;
   ```
   - Existing `numeric(12,2)` production values are converted in place.
   - No rows are deleted.
   - Historical user data is preserved.

3. **Continue normal operation**
   - After the SQL migration completes, all remote amounts are stored as integer cents.
   - The deployed code remains compatible throughout the rollout.

## Compatibility Window

- **Before SQL migration:** production rows may still be `numeric(12,2)`.
- **After SQL migration:** rows are stored as integer cents.
- The deployed app handles both formats so users do not experience downtime while the database migration is applied.

## Data Safety Guarantees

- No table drops
- No row deletes
- No client-side data reset
- No IndexedDB clearing requirement
- Existing production data is transformed in place

## Amount Conversion Rules

- Local → Supabase: `toSupabaseAmountCents(value)` multiplies by `100` and rounds to the nearest cent.
- Supabase (cents) → Local: divide by `100`.
- Supabase (legacy decimal rows during rollout) → Local: preserve the decimal value as-is.

## Zero-Downtime Rollout Summary

1. Deploy code that supports both formats.
2. Run the forward migration SQL.
3. Users keep their data throughout the rollout.
