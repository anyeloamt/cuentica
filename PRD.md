# PRD: [Provisional Name] — Simple Budgeting App

> **Status**: Draft v1.0
> **Date**: 2026-02-14
> **Author**: Anyelo
> **Provisional name**: `[AppName]` is used until final branding is defined (see Branding section)

---

## 1. Product Vision

An **extremely simple** budgeting app that replaces Quick Budget with two fundamental improvements: **web access** and **PDF export**. Each budget is a "wallet" with an income/expense table and a total. Nothing more.

### Design Philosophy

> "If your wife needs more than 3 seconds to understand how to do something, we failed."

- **Radical simplicity**: 3 columns (name, +/-, amount). No onboarding, no tutorials.
- **Offline-first**: Works without internet from the first load. Data lives on the device.
- **Optional sync**: Create an account only if you want to see your data on another device.
- **Zero friction**: Works without login. No ads. No upsells.

---

## 2. Problem

| Problem | Context |
|----------|----------|
| Quick Budget has no web access | Only works on the device where it is installed |
| Export limited to device-to-device QR | Cannot share a budget via WhatsApp, email, etc. |
| No way to generate PDF | To share with partner, family, or accountant you need to export |
| Data trapped on a single device | If you lose the phone, you lose everything |

---

## 3. Target Users

### Primary User: "The household organizer"
- **Profile**: Person who manages household accounts, event budgets, medical expenses
- **Motivation**: Know how much is spent, how much is left, share it quickly
- **Behavior**: Uses Quick Budget today. Has 10-30 active wallets. Creates items quickly from the phone
- **Frustration**: Cannot send the budget via WhatsApp or view it on the PC

### Secondary User: "The basic freelancer"
- **Profile**: Person who needs to track income/expenses of a simple business (Didi, delivery, freelance)
- **Motivation**: Know if they earned or lost money in a period
- **Behavior**: One wallet per month/project. Entries like "7/12 → +3660" or "gasolinera → -1000"

### General Public
- Open app for anyone needing simple budgets
- No specific currency — only numbers (the user knows which currency they are working in)

---

## 4. Features — MVP (Phase 1)

### 4.1 Home Screen: Wallet List

| Element | Description |
|----------|-------------|
| Vertical list | Each wallet shows: icon + name |
| Create wallet | "+" button in header |
| Delete wallet | Swipe or contextual menu with confirmation |
| Reorder | Drag & drop or order buttons |
| Search | Search field (if there are >10 wallets) |

**Visual reference**: Identical to Quick Budget home but with light/dark theme.

### 4.2 Wallet Detail: Budget Table

The central piece. Three columns:

```
[#] [  Name/Description  ] [+/-] [   Amount   ]
 1   Consulta 1 octubre       -      -2500
 2   Receta                   -      -4656
 3   7/12                     +       3660
 ...
═══════════════════════════════════════════════════
    +11,075.00  -2,702.00  =        +8,373.00
```

| Element | Description |
|----------|-------------|
| Name (col 1) | Free text. Placeholder: "Name" |
| Sign (col 2) | Toggle +/- (income or expense) |
| Amount (col 3) | Number. Placeholder: "Value +/-" |
| Empty row | There are always 1-2 empty rows at the end for quick input |
| Add rows | "+ Add rows" button at the end of the table |
| Trim rows | "- Trim rows" button to remove empty rows |
| Fixed total (footer) | Always visible: `+income -expenses = balance` |
| Colors | Positives: blue/green. Negatives: red. |

**Optional hidden fields** (not visible by default):
- **Date**: Shown only if the user writes a date in the name or activates the column
- **Category**: Shown only if the user activates it from wallet settings

> These fields are implemented in Phase 2 but the data model considers them from the start.

### 4.3 PDF Export

| Element | Description |
|----------|-------------|
| Trigger | Button in wallet detail header (share/PDF icon) |
| Content | [AppName] logo + wallet name + full table + total |
| Format | Vertical A4, clean table, minimal branding at the top |
| Action | On mobile: opens Web Share API (share via WhatsApp, email, etc.). Fallback: direct download |
| On desktop | Direct download of the PDF file |

**Library**: `jsPDF v4.1.0` + `jspdf-autotable`
- Client-side (no server needed)
- Supports styled tables
- ~30KB gzipped with tree-shaking

### 4.4 Light/Dark Theme

| Element | Description |
|----------|-------------|
| Default | Detects operating system preference |
| Manual toggle | Sun/moon icon in header or settings |
| Persistence | Saved in localStorage |
| Implementation | CSS Custom Properties + React Context |
| FOUC prevention | Inline script in `<head>` before React |

### 4.5 Offline-First PWA

| Element | Description |
|----------|-------------|
| Installable | Installation prompt on Android/iOS. Icon on home screen. |
| 100% Offline | Works completely without internet after the first load |
| Local data | Everything is saved in IndexedDB via Dexie.js |
| Service Worker | Precache of all assets + NetworkFirst for API |
| Update | SW auto-update with check every hour |

---

## 5. Features — Post-MVP (see ROADMAP.md)

These features are NOT in the MVP but the data model considers them:

| Feature | Phase |
|---------|------|
| Cloud sync (Supabase) | Phase 2 |
| Optional Auth (Google/email/magic link) | Phase 2 |
| Date column per row | Phase 2 |
| Category column per row | Phase 2 |
| Wallet categories/folders | Phase 3 |
| Read-only link sharing | Phase 3 |
| Export CSV/Excel | Phase 3 |
| Agenda (TBD functionality) | Phase 4 |

---

## 6. Technical Architecture

### Stack

| Layer | Technology | Version | Justification |
|------|-----------|---------|---------------|
| Framework | React | 18+ | Developer's existing knowledge. Mature ecosystem. |
| Build | Vite | 5+ | Fast, HMR, excellent DX |
| Language | TypeScript | 5+ | Type safety. Prevents bugs in data models. |
| PWA | vite-plugin-pwa | 0.17+ | generateSW mode with Workbox. Industry standard. |
| Local DB | Dexie.js | 4.3.0 | Elegant wrapper over IndexedDB. 14k stars. Sync support. |
| Remote DB | Supabase (PostgreSQL) | - | Generous free tier. Auth + Realtime + DB. Phase 2. |
| PDF | jsPDF + jspdf-autotable | 4.1.0 | Client-side. Best option for simple tables. |
| Styles | CSS Modules + Custom Properties | - | No extra dependency. Themes via CSS variables. |
| Hosting | Vercel | - | Automatic deploy from GitHub. Free tier. |

### Data Model (IndexedDB — Dexie.js)

```typescript
// Base interface for future sync
interface SyncableEntity {
  id?: string;           // Auto-generated UUID
  createdAt: number;     // Unix timestamp
  updatedAt: number;     // Unix timestamp (for last-write-wins sync)
  syncStatus?: 'pending' | 'synced'; // Phase 2
  deleted?: boolean;     // Soft delete for sync
}

interface Wallet extends SyncableEntity {
  name: string;          // "gasto pre y post embarazo Amelia"
  order: number;         // Position in home list
  color?: string;        // Wallet color (future)
  categoryId?: string;   // Folder/category (Phase 3)
}

interface BudgetItem extends SyncableEntity {
  walletId: string;      // FK to Wallet
  order: number;         // Position in table
  name: string;          // "Consulta 1 octubre", "gasolinera", "7/12"
  type: '+' | '-';       // Income or expense
  amount: number;        // Absolute value (sign comes from `type`)
  date?: string;         // Optional date (Phase 2) — ISO string
  categoryTag?: string;  // Optional category (Phase 2)
}

// Dexie.js Schema
class AppDB extends Dexie {
  wallets!: Table<Wallet>;
  items!: Table<BudgetItem>;

  constructor() {
    super('[AppName]DB');
    this.version(1).stores({
      wallets: '++id, name, order, updatedAt, syncStatus',
      items: '++id, walletId, order, updatedAt, syncStatus'
    });
  }
}
```

### Component Architecture (React)

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx          # Top bar with actions
│   │   └── BottomTotal.tsx     # Fixed footer with total
│   ├── Home/
│   │   ├── WalletList.tsx      # Wallet list
│   │   └── WalletCard.tsx      # Individual wallet item
│   ├── Budget/
│   │   ├── BudgetTable.tsx     # Main budget table
│   │   ├── BudgetRow.tsx       # Individual row (name, +/-, amount)
│   │   └── BudgetFooter.tsx    # Total: +income -expenses = balance
│   ├── Export/
│   │   └── PdfExport.tsx       # PDF generation and sharing
│   └── Settings/
│       └── ThemeToggle.tsx     # Light/dark switch
├── context/
│   ├── ThemeContext.tsx         # Light/dark theme
│   └── DatabaseContext.tsx      # Dexie.js instance
├── hooks/
│   ├── useWallets.ts           # Wallet CRUD
│   ├── useBudgetItems.ts       # Budget items CRUD inside wallet
│   └── useOfflineStatus.ts     # Detect connection
├── lib/
│   ├── db.ts                   # Dexie.js configuration
│   ├── pdf.ts                  # PDF generation with jsPDF
│   └── share.ts                # Web Share API + fallback
├── styles/
│   ├── theme.css               # CSS variables for themes
│   └── global.css              # Global styles
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

### Service Worker Strategy (Offline)

```
┌─────────────────────────────────────────┐
│           First Visit                   │
│  1. Load app from network               │
│  2. SW installs and precaches everything │
│  3. Data is saved in IndexedDB          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Subsequent Visits             │
│  1. SW serves app from cache (instant)  │
│  2. IndexedDB provides all data         │
│  3. Needs no network for ANYTHING       │
│  4. SW checks for updates in background │
└─────────────────────────────────────────┘
```

---

## 7. Hosting & Deployment

### Vercel (Primary — MVP)

| Aspect | Detail |
|---------|---------|
| Deploy | Automatic from GitHub (`git push` = deploy) |
| Free tier | 100GB bandwidth, unlimited deploys, HTTPS, global CDN |
| Config | Zero-config for Vite SPA |
| URL | `[appname].vercel.app` (or custom domain) |
| Preview | Each PR generates automatic preview URL |

### VPS (Alternative — Roadmap)

For when/if more control is needed or self-hosting is desired.

---

## 8. Estimated Costs

### Phase 1 (MVP — Offline only)

| Item | Cost |
|------|-------|
| Hosting (Vercel) | $0/month |
| Domain | ~$10-15/year |
| **Total** | **~$1/month** |

### Phase 2 (With sync — Supabase)

| Item | Cost |
|------|-------|
| Hosting (Vercel) | $0/month |
| Supabase (0-1000 users) | $0/month (free tier: 500MB DB, 50K MAU) |
| Supabase (1000-5000 users) | $25/month (Pro) |
| Domain | ~$10-15/year |
| **Total (< 1000 users)** | **~$1/month** |
| **Total (1000-5000 users)** | **~$26/month** |

---

## 9. Success Metrics

| Metric | Target (3 months) |
|---------|-------------------|
| Your wife uses it daily | ✅ Yes |
| Replaces Quick Budget completely | ✅ Yes |
| Time-to-first-budget | < 30 seconds |
| PDF successfully generated and shared | ✅ Works on WhatsApp |
| Works offline | ✅ 100% without internet |
| Lighthouse PWA score | > 95 |

---

## 10. Branding (Pending)

### Current Situation
- **"Cuentica"** is taken as a brand (Spanish accounting software)
- All domains (.com, .app, .io, .co) taken
- Risk of brand confusion

### Next Steps
1. Define final name
2. Verify domain availability
3. Register domain
4. Design minimal logo (wallet/billfold icon)

### Alternatives to explore
- Names with "wallet", "pocket", "sleeve"
- Short and memorable invented names
- Verify .app and .com simultaneously

---

## 11. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|--------|-------------|---------|------------|
| Safari limits IndexedDB to 1GB | Medium | High | Monitor usage, implement pruning of old data |
| SW update delays (users with old version) | High | Low | Auto-update + check every hour + "new version" banner |
| Supabase free tier falls short | Low (< 1K users) | Medium | Migrate to Pro ($25) or self-host Supabase on VPS |
| Sync conflicts (editing on 2 devices offline) | Low | Medium | Last-write-wins with timestamps. Acceptable for budgets. |
| Name/brand legal conflict | Medium | High | Choose original name before public launch |

---

## Appendix A: Visual Reference (Quick Budget)

The current app being replicated/improved:

- **Home**: Vertical list of wallets with wallet icon + name + chevron
- **Detail**: Header with (← save QR ⋮) + title + 3-column numbered table
- **Footer**: Sticky with `+positives -negatives = total` in colors
- **Actions**: "- Trim rows" / "+ Add rows" at the end of the table
- **Color scheme**: White background, black header, dark blue positives, red negatives
