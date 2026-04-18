# Breaking Changes - Issue #121

## Storage Contract Change

### Supabase Schema Migration

**Old Schema:**
```sql
amount numeric(12, 2)  -- Decimal storage (e.g., 10.99)
```

**New Schema:**
```sql
amount integer  -- Integer cents storage (e.g., 1099)
```

### Impact

- **Rounding Behavior**: Values with more than 2 decimal places are rounded to the nearest cent during sync
  - Example: `0.015` → `2` cents (via `Math.round(value * 100)`)
  - This is acceptable for standard currency handling as currencies don't use more than 2 decimals

- **Data Transformation**:
  - Local → Supabase: `toSupabaseAmountCents(value)` multiplies by 100 and rounds
  - Supabase → Local: `toLocalAmountFromCents(value)` divides by 100

### Migration Path

For existing databases with the old schema:

**Option 1: Manual Reset**
- Clear local IndexedDB and re-enter data
- Suitable for development/early adopter phase

**Option 2: ALTER TABLE**
```sql
ALTER TABLE budget_items 
  ALTER COLUMN amount TYPE integer 
  USING ROUND(amount * 100)::integer;
```
- Converts existing decimal values to cents
- Requires downtime during migration

### Functions Affected

- `toSupabaseAmountCents(value: number): number` - Converts decimal to integer cents
- `toLocalAmountFromCents(value: number): number` - Converts integer cents to decimal

### Rationale

Integer cents storage prevents floating-point precision issues and is the standard approach for currency handling in financial applications.
