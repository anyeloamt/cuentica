# Issue #127: Self-Healing Sync Roadmap

## Decisions

- Keep the existing `hydrate -> push -> pull` order. For each authenticated user, wallet and budget-item pulls have independent checkpoints and reconciliation-complete markers.
- A missing entity marker triggers an unbounded authorized pull for that entity; its marker and checkpoint are written only after all returned rows, including tombstones, are applied. Incremental pulls retain the existing 24-hour overlap only after that entity has reconciled.
- Existing pending-local precedence remains authoritative: a remote row or tombstone never overwrites a matching local `pending` row.
- `Repair sync` clears only the current user's two entity markers/checkpoints and reruns normal sync. It never clears IndexedDB rows or touches cloud data.
- The origin-global Dexie tables retain guest/offline data until first authentication. Before a different authenticated user can sync, atomically clear local wallets/items and active sync metadata, then claim that user as the local owner. Signing out preserves the owner and rows, so a later different login still performs the transition.
- A sync is converged only after push and both entity pulls finish successfully. Any entity failure remains retryable and surfaces as non-converged.

## Change Sequence

1. Add the exact three-old-wallet regression and execute it against `0f2dd6cf4947f2653b7daa494dce183c7135603a`, preserving its failing output before production changes.
2. Update `src/lib/sync.ts` and `src/lib/sync.test.ts` for entity-specific reconciliation/checkpoints, repair invalidation, tombstones, pending preservation, and retry behavior.
3. Add the smallest local-owner transition at the existing auth/DB boundary, with tests proving guest preservation and A-to-B isolation before sync.
4. Update `src/hooks/useSync.ts` to wait for identity isolation, expose a deduplicated repair action, and map complete protocol success to status.
5. Add one compact authenticated `Repair sync` action in `src/components/Layout/SyncIndicator.tsx`; keep it disabled while syncing and test its state wiring.

## Required Evidence

- Focused tests cover old live rows, old tombstones, pending-local precedence, independent entity progress, failed reconcile/retry, identity switching, repair metadata invalidation, and offline/guest behavior.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`, plus a browser check of the repair action.
- Inspect sibling sync/migration/auth flows: migration remains separately guarded and is not used as a recovery boundary; no cloud schema, RLS, Supabase data, PWA install, or storage-clearing changes are in scope.
- Before delivery, one independent Sol-class reviewer evaluates `origin/master...HEAD`; record model, session/task, head, and verdict, then resolve blocking findings using that same reviewer for at most three rounds.
- After that approval, push the PR branch, require the existing pull-request CI workflow to pass, squash-merge into `master`, then wait for the repository's existing Vercel Production deployment from `master`. Perform only a read-only production smoke that confirms the merged revision and repair UI/runtime assets; do not create a deployment path, mutate Supabase, or create user data.

---

**Model**: openai/gpt-5.6-terra
**Persona**: Sisyphus
