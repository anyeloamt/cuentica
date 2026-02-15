# Roadmap: Cuentica — Simple Budgets App

> **Status**: v2.0 (updated 2026-02-15)
> **Reference**: See `PRD.md` for full details

---

## Phase Summary

```
Phase 1 ████████████████████  Local MVP        ✅ COMPLETE
Phase 2 ░░░░░░░░░░░░░░░░░░░░  Sync & Auth      (2-3 weeks)
Phase 3 ░░░░░░░░░░░░░░░░░░░░  Social & Power   (3-4 weeks)
Phase 4 ░░░░░░░░░░░░░░░░░░░░  Agenda           (TBD)
```

**Current status**: Phase 1 complete. MVP deployed on Vercel. In user testing with primary user.

---

## Phase 1 — Local MVP ✅ COMPLETE

> **Goal**: Functional app that replaces Quick Budget 100%. Offline-first. PDF export.

### Sprint 1.1 — Foundation ✅ COMPLETE

| #     | Task                                                                                                   | Status |
| ----- | ------------------------------------------------------------------------------------------------------ | ------ |
| 1.1.1 | **Project Setup**: Vite + React + TypeScript + ESLint + Prettier + Tailwind CSS v4                     | ✅     |
| 1.1.2 | **PWA Configuration**: vite-plugin-pwa, manifest.json, SW with precache, install prompt, reload prompt | ✅     |
| 1.1.3 | **Dexie.js Configuration**: Schema v1 (wallets + budgetItems), CuenticaDB instance                     | ✅     |
| 1.1.4 | **Theme System**: ThemeContext + localStorage persistence + theme-aware meta color                     | ✅     |
| 1.1.5 | **Routing**: React Router v6 (Home / Wallet Detail / 404)                                              | ✅     |
| 1.1.6 | **Base Layout**: AppLayout with Header, scrollable Outlet                                              | ✅     |

> **Note**: Tailwind CSS v4 is used for styling (CSS-first config with `@theme` directive). GitHub Actions CI pipeline was also set up during this sprint.

### Sprint 1.2 — Core: Wallets ✅ COMPLETE

| #     | Task                                                                                     | Status |
| ----- | ---------------------------------------------------------------------------------------- | ------ |
| 1.2.1 | **WalletList**: List wallets from IndexedDB with Dexie `liveQuery` via `useWallets` hook | ✅     |
| 1.2.2 | **Create Wallet**: FAB + CreateWalletModal → name → save to DB                           | ✅     |
| 1.2.3 | **Delete Wallet**: Button with ConfirmDeleteModal + cascade delete of budget items       | ✅     |
| 1.2.4 | **Rename Wallet**: Inline edit via `useWalletName` hook                                  | ✅     |
| 1.2.5 | **Reorder Wallets**: Up/down buttons with order swap in transaction                      | ✅     |
| 1.2.6 | **Empty state**: Handled in WalletList component                                         | ✅     |

> **Note**: All wallet operations return discriminated union results (`{ ok: true } | { ok: false; error: '...' }`) for explicit error handling. Tests co-located with each component.

### Sprint 1.3 — Core: Budget Table ✅ COMPLETE

| #      | Task                                                                            | Status |
| ------ | ------------------------------------------------------------------------------- | ------ |
| 1.3.1  | **BudgetTable**: Render items of a wallet in a 3-column table                   | ✅     |
| 1.3.2  | **BudgetRow**: Name input + toggle +/- + amount input (inline editing)          | ✅     |
| 1.3.3  | **Auto-save**: Save changes to Dexie on blur/change (no save button)            | ✅     |
| 1.3.4  | **Add Rows**: "+ Add Rows" button (adds 5 empty rows)                           | ✅     |
| 1.3.5  | **Trim Rows**: "- Trim Rows" button (removes empty rows from the end)           | ✅     |
| 1.3.6  | **Delete Row**: Delete button on individual row with undo toast (5s)            | ✅     |
| 1.3.7  | **Total Footer**: Fixed footer with colored total (+green / -red)               | ✅     |
| 1.3.8  | **Numbering**: Row numbers on the left (1, 2, 3...)                             | ✅     |
| 1.3.9  | **Scroll with fixed footer**: Table scrolls, total always visible at the bottom | ✅     |
| 1.3.10 | **Numeric Keypad**: Amount input opens numeric keypad on mobile                 | ✅     |

### Sprint 1.4 — PDF Export + Polish ✅ COMPLETE

| #     | Task                                                                              | Status |
| ----- | --------------------------------------------------------------------------------- | ------ |
| 1.4.1 | **Generate PDF**: jsPDF + autotable with wallet name + budget table + total       | ✅     |
| 1.4.2 | **Web Share API**: Share PDF on mobile (WhatsApp, email, etc.)                    | ✅     |
| 1.4.3 | **Fallback download**: On desktop or browsers without Share API → direct download | ✅     |
| 1.4.4 | **PDF button in header**: Share/export icon in the detail bar                     | ✅     |
| 1.4.5 | **Offline Testing**: Verified everything works in airplane mode                   | ✅     |
| 1.4.6 | **Performance**: Lighthouse audit passed (PWA > 95)                               | ✅     |
| 1.4.7 | **Responsive**: Verified on mobile (360px), tablet (768px), desktop (1280px)      | ✅     |
| 1.4.8 | **Deploy Vercel**: Connected GitHub repo with auto-deploy                         | ✅     |
| 1.4.9 | **Provisional Domain**: Set up `cuentica.vercel.app`                              | ✅     |

### Post-MVP Polish ✅ COMPLETE

| #   | Task                                                                               | Status |
| --- | ---------------------------------------------------------------------------------- | ------ |
| 54  | **Round compact buttons**: Consistent `rounded-full` icon buttons across the app   | ✅     |
| 55  | **Compact layout**: Tighter spacing, smaller header, reduced margins               | ✅     |
| 56  | **Perceived performance**: `React.memo`, `useMemo`, `useCallback`, FOUC prevention | ✅     |
| 57  | **PWA prompt overlap**: Auto-dismiss offline-ready prompt, prevent FAB overlap     | ✅     |

> **Note**: Fixed invisible icons in dark mode (global CSS `button` rules overriding Tailwind). Removed duplicate BottomTotal footer.

### MVP Launch Checklist ✅

- [x] Create wallet
- [x] Delete wallet
- [x] Rename wallet
- [x] Reorder wallets
- [x] 3-column table with inline editing
- [x] Live total (fixed footer)
- [x] Add/trim rows
- [x] Delete row with undo
- [x] Export PDF with branding
- [x] Share PDF (Web Share API)
- [x] Light/dark theme with toggle
- [x] Installable PWA
- [x] 100% offline after first load
- [x] CI pipeline (lint + typecheck + test + build)
- [x] Deploy on Vercel
- [x] Lighthouse PWA > 95
- [x] Performance memoization
- [x] FOUC prevention (theme applied before React render)

---

## Phase 2 — Sync & Auth (Pending)

> **Goal**: Multi-device access. Data travels with the user.
> **Prerequisite**: User feedback from Phase 1 testing incorporated first.

### 2.1 — Supabase Setup

| #     | Task                                                                    | Estimated |
| ----- | ----------------------------------------------------------------------- | --------- |
| 2.1.1 | Create Supabase project (free tier)                                     | 1h        |
| 2.1.2 | Define PostgreSQL tables (wallets, items) with RLS (Row Level Security) | 3h        |
| 2.1.3 | Configure auth providers (Google + Magic Link email)                    | 2h        |

### 2.2 — Optional Auth

| #     | Task                                                                        | Estimated |
| ----- | --------------------------------------------------------------------------- | --------- |
| 2.2.1 | Login/register UI (Google one-tap + email magic link)                       | 4h        |
| 2.2.2 | Auth state in React Context                                                 | 2h        |
| 2.2.3 | Subtle banner: "Create account to sync across devices" (non-intrusive)      | 2h        |
| 2.2.4 | Flow: user without account → creates account → migrates local data to cloud | 3h        |

### 2.3 — Sync Engine

| #     | Task                                                               | Estimated |
| ----- | ------------------------------------------------------------------ | --------- |
| 2.3.1 | Sync push: items with `syncStatus: 'pending'` → upsert to Supabase | 4h        |
| 2.3.2 | Sync pull: pull server changes newer than last sync                | 4h        |
| 2.3.3 | Conflict resolution: last-write-wins with `updatedAt`              | 3h        |
| 2.3.4 | Sync on reconnect: `window.addEventListener('online', sync)`       | 1h        |
| 2.3.5 | Sync on app open: check for changes when opening the app           | 2h        |
| 2.3.6 | Sync Indicator: subtle icon showing status (synced/pending/error)  | 2h        |
| 2.3.7 | Soft delete: deleted items are marked `deleted: true` and synced   | 2h        |

### 2.4 — Optional Fields

| #     | Task                                                                  | Estimated |
| ----- | --------------------------------------------------------------------- | --------- |
| 2.4.1 | Date column per row (hidden by default, activated in wallet settings) | 3h        |
| 2.4.2 | Category/tag column per row (hidden by default)                       | 3h        |
| 2.4.3 | Dexie schema migration (v1 → v2) without losing data                  | 2h        |

---

## Phase 3 — Social & Power Features (Pending)

> **Goal**: Share, organize, export with more power.

### 3.1 — Sharing

| #     | Task                                                         | Estimated |
| ----- | ------------------------------------------------------------ | --------- |
| 3.1.1 | Generate read-only link for a budget (temporary public URL)  | 4h        |
| 3.1.2 | Public budget view (no auth, read-only, clean design)        | 4h        |
| 3.1.3 | Expiration of shared links (7 days by default, configurable) | 2h        |

### 3.2 — Organization

| #     | Task                                                          | Estimated |
| ----- | ------------------------------------------------------------- | --------- |
| 3.2.1 | Wallet categories/folders ("Personal", "Business", "Medical") | 4h        |
| 3.2.2 | Filter wallets by category on Home                            | 2h        |
| 3.2.3 | Wallet search (if there are >10)                              | 2h        |

### 3.3 — Advanced Export

| #     | Task                                        | Estimated |
| ----- | ------------------------------------------- | --------- |
| 3.3.1 | Export to CSV                               | 2h        |
| 3.3.2 | Export to Excel (.xlsx)                     | 3h        |
| 3.3.3 | Import from CSV (migration from other apps) | 4h        |

### 3.4 — UX Improvements

| #         | Task                                                       | Estimated              |
| --------- | ---------------------------------------------------------- | ---------------------- |
| 3.4.1     | Total visible in the wallet list (without entering detail) | 2h                     |
| 3.4.2     | Duplicate wallet (copy structure as template)              | 2h                     |
| 3.4.3     | Undo/redo for accidental edits                             | 4h                     |
| ~~3.4.4~~ | ~~New version available notification (SW update)~~         | ✅ Done (ReloadPrompt) |

### 3.5 — Alternative Hosting

| #     | Task                                     | Estimated |
| ----- | ---------------------------------------- | --------- |
| 3.5.1 | Document VPS deployment (Docker + Nginx) | 3h        |
| 3.5.2 | Automated deployment script for VPS      | 2h        |

---

## Phase 4 — Agenda (Timeline TBD)

> **Goal**: Agenda feature mentioned by the wife. Scope to be defined.

| #     | Task                                                           | Estimated |
| ----- | -------------------------------------------------------------- | --------- |
| 4.0.1 | Discovery: interview about what "agenda" means in this context | —         |
| 4.0.2 | Events linked to expenses? Payment reminders? Calendar?        | —         |
| 4.0.3 | PRD for agenda functionality                                   | —         |
| 4.0.4 | Implementation according to PRD                                | —         |

> This phase requires a second interview to define the scope.

---

## Key Technical Decisions

### Why NOT Dexie Cloud?

| Factor       | Dexie Cloud                          | Manual Sync (Supabase)                  |
| ------------ | ------------------------------------ | --------------------------------------- |
| Cost         | $9/mo (10 users), $99/mo (100 users) | $0 (free tier up to 1K users)           |
| Control      | Vendor lock-in                       | 100% control                            |
| Complexity   | Plug & play                          | ~20h of implementation                  |
| Auth         | Built-in                             | Supabase Auth (also easy)               |
| **Decision** |                                      | **✅ Supabase** — free and more control |

### Why jsPDF and not @react-pdf/renderer?

| Factor       | jsPDF + autotable                 | @react-pdf/renderer              |
| ------------ | --------------------------------- | -------------------------------- |
| Use case     | Simple tables                     | Complex multi-page documents     |
| Bundle size  | ~30KB gzipped                     | Higher overhead (React renderer) |
| Complexity   | 10 lines of code                  | Full React components            |
| **Decision** | **✅ jsPDF** — perfect for tables | Overkill for this case           |

### Why Vercel first and not VPS?

| Factor       | Vercel                              | VPS                                |
| ------------ | ----------------------------------- | ---------------------------------- |
| Setup        | `git push` = deploy                 | Docker + Nginx + SSL + CI/CD       |
| Cost         | $0                                  | ~$5-10/mo                          |
| Maintenance  | Zero                                | Updates, security patches, backups |
| CDN          | Global included                     | Configure manually                 |
| **Decision** | **✅ Vercel first** — zero friction | VPS documented in Phase 3          |

---

## External Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.3",
    "dexie": "^4.3.0",
    "dexie-react-hooks": "^4.2.0",
    "jspdf": "^4.1.0",
    "jspdf-autotable": "^5.0.7"
  },
  "devDependencies": {
    "vite": "^5.4.14",
    "vite-plugin-pwa": "^0.17.5",
    "tailwindcss": "^4.1.18",
    "@tailwindcss/vite": "^4.1.18",
    "typescript": "^5.7.3",
    "vitest": "^1.6.1",
    "@testing-library/react": "^14.3.1",
    "fake-indexeddb": "^6.2.5",
    "eslint": "^8.57.1",
    "prettier": "^3.4.2"
  }
}
```

**Production dependencies**: 7

> **Note**: Tailwind CSS v4 uses CSS-first config (`@theme` directive in `theme.css`, `@custom-variant dark` for dark mode via `data-theme="dark"` attribute). fake-indexeddb enables Dexie.js testing without a real browser.

---

## Immediate Next Steps

1. ~~**Define name and domain**~~ → Settled on "Cuentica"
2. ~~**Create GitHub repo**~~ → `anyeloamt/cuentica` on GitHub
3. ~~**Sprint 1.1**~~ → Foundation complete
4. ~~**Sprint 1.2**~~ → Wallet CRUD complete
5. ~~**Sprint 1.3**~~ → Budget table complete
6. ~~**Sprint 1.4**~~ → PDF export + deploy complete
7. ~~**Post-MVP polish**~~ → UI compaction, perf, dark mode fixes
8. **User testing** → Primary user (wife) testing the app — collecting feedback
9. **Incorporate feedback** → Fix issues surfaced during real usage
10. **Phase 2** → Sync & Auth with Supabase (after feedback round)
