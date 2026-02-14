# Roadmap: [Provisional Name] — Simple Budgets App

> **Status**: Draft v1.0
> **Date**: 2026-02-14
> **Target Timeline**: MVP in 1-2 weeks
> **Reference**: See `PRD.md` for full details

---

## Phase Summary

```
Phase 1 ██████████░░░░░░░░░░  Local MVP        (1-2 weeks)
Phase 2 ░░░░░░░░░░██████░░░░  Sync & Auth      (2-3 weeks)
Phase 3 ░░░░░░░░░░░░░░░░████  Social & Power   (3-4 weeks)
Phase 4 ░░░░░░░░░░░░░░░░░░░░  Agenda           (TBD)
```

---

## Phase 1 — Local MVP (Week 1-2)

> **Goal**: Functional app that replaces Quick Budget 100%. Offline-first. PDF export.

### Sprint 1.1 — Foundation (Days 1-3)

| # | Task | Priority | Estimated |
|---|-------|-----------|----------|
| 1.1.1 | **Project Setup**: Vite + React + TypeScript + ESLint + Prettier | High | 2h |
| 1.1.2 | **PWA Configuration**: vite-plugin-pwa, manifest.json, SW with precache | High | 3h |
| 1.1.3 | **Dexie.js Configuration**: Schema v1 (wallets + items), DB instance | High | 2h |
| 1.1.4 | **Theme System**: CSS Custom Properties + ThemeContext + FOUC prevention | Medium | 2h |
| 1.1.5 | **Routing**: React Router (Home ↔ Wallet Detail) | High | 1h |
| 1.1.6 | **Base Layout**: Header, scrollable content, fixed footer | High | 2h |

**Deliverable**: App skeleton that installs as PWA, works offline (empty screen), has light/dark theme.

### Sprint 1.2 — Core: Wallets (Days 3-5)

| # | Task | Priority | Estimated |
|---|-------|-----------|----------|
| 1.2.1 | **WalletList**: List wallets from IndexedDB with Dexie `liveQuery` | High | 3h |
| 1.2.2 | **Create Wallet**: Modal/inline input → name → save to DB | High | 2h |
| 1.2.3 | **Delete Wallet**: Swipe or button with confirmation + delete associated items | High | 2h |
| 1.2.4 | **Rename Wallet**: Tap on name to edit inline | Medium | 1h |
| 1.2.5 | **Reorder Wallets**: Drag & drop or buttons ↑↓ | Low | 2h |
| 1.2.6 | **Empty state**: "You have no wallets. Tap + to create one." | Medium | 30min |

**Deliverable**: Functional Home screen. Create, view, delete, rename wallets. Data persists in IndexedDB.

### Sprint 1.3 — Core: Budget Table (Days 5-8)

| # | Task | Priority | Estimated |
|---|-------|-----------|----------|
| 1.3.1 | **BudgetTable**: Render items of a wallet in a 3-column table | High | 3h |
| 1.3.2 | **BudgetRow**: Name input + toggle +/- + amount input (inline editing) | High | 4h |
| 1.3.3 | **Auto-save**: Save changes to Dexie on blur/change (no save button) | High | 2h |
| 1.3.4 | **Add Rows**: "+ Add Rows" button (adds N empty rows) | High | 1h |
| 1.3.5 | **Trim Rows**: "- Trim Rows" button (removes empty rows from the end) | Medium | 1h |
| 1.3.6 | **Delete Row**: Swipe or button × on individual row (with data) | High | 1h |
| 1.3.7 | **Total Footer**: Sticky component: `+income -expenses = balance` with colors | High | 2h |
| 1.3.8 | **Numbering**: Row numbers on the left (1, 2, 3...) | Medium | 30min |
| 1.3.9 | **Scroll with fixed footer**: Table scrolls, total always visible at the bottom | High | 1h |
| 1.3.10 | **Numeric Keypad**: Amount input opens numeric keypad on mobile | High | 30min |

**Deliverable**: Complete budget table identical to Quick Budget. Inline editing. Auto-save. Live total.

### Sprint 1.4 — PDF Export + Polish (Days 8-10)

| # | Task | Priority | Estimated |
|---|-------|-----------|----------|
| 1.4.1 | **Generate PDF**: jsPDF + autotable. Logo on top + wallet name + table + total | High | 3h |
| 1.4.2 | **Web Share API**: Share PDF on mobile (WhatsApp, email, etc.) | High | 2h |
| 1.4.3 | **Fallback download**: On desktop or browsers without Share API → direct download | High | 1h |
| 1.4.4 | **PDF button in header**: Share/export icon in the detail bar | High | 30min |
| 1.4.5 | **Offline Testing**: Verify everything works in airplane mode | High | 2h |
| 1.4.6 | **Performance**: Lighthouse audit → PWA score > 95, Performance > 90 | Medium | 2h |
| 1.4.7 | **Responsive**: Check on mobile (360px), tablet (768px), desktop (1280px) | High | 2h |
| 1.4.8 | **Deploy Vercel**: Connect GitHub repo → auto-deploy | High | 1h |
| 1.4.9 | **Provisional Domain**: Set up subdomain or `[appname].vercel.app` | Medium | 30min |

**Deliverable**: Full MVP. Works offline. Generates and shares PDF. Deployed on Vercel.

### MVP Launch Checklist

- [ ] Create wallet ✓
- [ ] Delete wallet ✓
- [ ] 3-column table with inline editing ✓
- [ ] Live total (sticky footer) ✓
- [ ] Add/trim rows ✓
- [ ] Export PDF with branding ✓
- [ ] Share PDF (Web Share API) ✓
- [ ] Light/dark theme with toggle ✓
- [ ] Installable PWA ✓
- [ ] 100% offline after first load ✓
- [ ] Deploy on Vercel ✓
- [ ] Lighthouse PWA > 95 ✓

---

## Phase 2 — Sync & Auth (Week 3-5)

> **Goal**: Multi-device access. Data travels with the user.

### 2.1 — Supabase Setup

| # | Task | Estimated |
|---|-------|----------|
| 2.1.1 | Create Supabase project (free tier) | 1h |
| 2.1.2 | Define PostgreSQL tables (wallets, items) with RLS (Row Level Security) | 3h |
| 2.1.3 | Configure auth providers (Google + Magic Link email) | 2h |

### 2.2 — Optional Auth

| # | Task | Estimated |
|---|-------|----------|
| 2.2.1 | Login/register UI (Google one-tap + email magic link) | 4h |
| 2.2.2 | Auth state in React Context | 2h |
| 2.2.3 | Subtle banner: "Create account to sync across devices" (non-intrusive) | 2h |
| 2.2.4 | Flow: user without account → creates account → migrates local data to cloud | 3h |

### 2.3 — Sync Engine

| # | Task | Estimated |
|---|-------|----------|
| 2.3.1 | Sync push: items with `syncStatus: 'pending'` → upsert to Supabase | 4h |
| 2.3.2 | Sync pull: pull server changes newer than last sync | 4h |
| 2.3.3 | Conflict resolution: last-write-wins with `updatedAt` | 3h |
| 2.3.4 | Sync on reconnect: `window.addEventListener('online', sync)` | 1h |
| 2.3.5 | Sync on app open: check for changes when opening the app | 2h |
| 2.3.6 | Sync Indicator: subtle icon showing status (synced/pending/error) | 2h |
| 2.3.7 | Soft delete: deleted items are marked `deleted: true` and synced | 2h |

### 2.4 — Optional Fields

| # | Task | Estimated |
|---|-------|----------|
| 2.4.1 | Date column per row (hidden by default, activated in wallet settings) | 3h |
| 2.4.2 | Category/tag column per row (hidden by default) | 3h |
| 2.4.3 | Dexie schema migration (v1 → v2) without losing data | 2h |

---

## Phase 3 — Social & Power Features (Week 6-8)

> **Goal**: Share, organize, export with more power.

### 3.1 — Sharing

| # | Task | Estimated |
|---|-------|----------|
| 3.1.1 | Generate read-only link for a budget (temporary public URL) | 4h |
| 3.1.2 | Public budget view (no auth, read-only, clean design) | 4h |
| 3.1.3 | Expiration of shared links (7 days by default, configurable) | 2h |

### 3.2 — Organization

| # | Task | Estimated |
|---|-------|----------|
| 3.2.1 | Wallet categories/folders ("Personal", "Business", "Medical") | 4h |
| 3.2.2 | Filter wallets by category on Home | 2h |
| 3.2.3 | Wallet search (if there are >10) | 2h |

### 3.3 — Advanced Export

| # | Task | Estimated |
|---|-------|----------|
| 3.3.1 | Export to CSV | 2h |
| 3.3.2 | Export to Excel (.xlsx) | 3h |
| 3.3.3 | Import from CSV (migration from other apps) | 4h |

### 3.4 — UX Improvements

| # | Task | Estimated |
|---|-------|----------|
| 3.4.1 | Total visible in the wallet list (without entering detail) | 2h |
| 3.4.2 | Duplicate wallet (copy structure as template) | 2h |
| 3.4.3 | Undo/redo for accidental edits | 4h |
| 3.4.4 | New version available notification (SW update) | 2h |

### 3.5 — Alternative Hosting

| # | Task | Estimated |
|---|-------|----------|
| 3.5.1 | Document VPS deployment (Docker + Nginx) | 3h |
| 3.5.2 | Automated deployment script for VPS | 2h |

---

## Phase 4 — Agenda (Timeline TBD)

> **Goal**: Agenda feature mentioned by the wife. Scope to be defined.

| # | Task | Estimated |
|---|-------|----------|
| 4.0.1 | Discovery: interview about what "agenda" means in this context | — |
| 4.0.2 | Events linked to expenses? Payment reminders? Calendar? | — |
| 4.0.3 | PRD for agenda functionality | — |
| 4.0.4 | Implementation according to PRD | — |

> This phase requires a second interview to define the scope.

---

## Key Technical Decisions

### Why NOT Dexie Cloud?

| Factor | Dexie Cloud | Manual Sync (Supabase) |
|--------|-------------|----------------------|
| Cost | $9/mo (10 users), $99/mo (100 users) | $0 (free tier up to 1K users) |
| Control | Vendor lock-in | 100% control |
| Complexity | Plug & play | ~20h of implementation |
| Auth | Built-in | Supabase Auth (also easy) |
| **Decision** | | **✅ Supabase** — free and more control |

### Why jsPDF and not @react-pdf/renderer?

| Factor | jsPDF + autotable | @react-pdf/renderer |
|--------|-------------------|---------------------|
| Use case | Simple tables | Complex multi-page documents |
| Bundle size | ~30KB gzipped | Higher overhead (React renderer) |
| Complexity | 10 lines of code | Full React components |
| **Decision** | **✅ jsPDF** — perfect for tables | Overkill for this case |

### Why Vercel first and not VPS?

| Factor | Vercel | VPS |
|--------|--------|-----|
| Setup | `git push` = deploy | Docker + Nginx + SSL + CI/CD |
| Cost | $0 | ~$5-10/mo |
| Maintenance | Zero | Updates, security patches, backups |
| CDN | Global included | Configure manually |
| **Decision** | **✅ Vercel first** — zero friction | VPS documented in Phase 3 |

---

## External Dependencies (Phase 1 MVP)

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "dexie": "^4.3.0",
    "dexie-react-hooks": "^1.x",
    "jspdf": "^4.1.0",
    "jspdf-autotable": "^5.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.17.x",
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

**Total production dependencies**: 5 (minimum possible)

---

## Summary Schedule

| Week | Phase | Deliverable |
|--------|------|------------|
| **1** | 1.1 + 1.2 | PWA Skeleton + Wallet CRUD |
| **2** | 1.3 + 1.4 | Budget Table + PDF + Deploy |
| **3-4** | 2.1 + 2.2 | Supabase + Optional Auth |
| **5** | 2.3 + 2.4 | Sync engine + optional fields |
| **6-7** | 3.1 + 3.2 | Shared links + categories |
| **8** | 3.3 + 3.4 | Advanced export + UX polish |
| **TBD** | 4 | Agenda (requires interview) |

---

## Immediate Next Steps

1. **Define name and domain** → Look for alternatives to "Cuentica"
2. **Create GitHub repo** → Project base structure
3. **Sprint 1.1** → Setup Vite + React + PWA + Dexie.js
4. **Start building** 🚀
