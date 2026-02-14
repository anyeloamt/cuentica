# Cuentica - Simple Budgeting PWA

> An extremely simple budgeting app. Offline-first, web-based, with PDF export.

Cuentica is designed with radical simplicity in mind. If it takes more than 3 seconds to understand how to do something, we failed.

## Features

**Implemented:**

- **Offline-first PWA** - Works completely without internet after the first load. Includes install prompt and auto-update notification.
- **Wallet Management** - Create, rename, reorder, and delete wallets with confirmation. Data persists in IndexedDB via Dexie.js.
- **Light/Dark Theme** - Manual toggle with localStorage persistence. Theme-aware meta color for PWA.
- **Installable** - Full PWA with service worker precaching, install prompt, and reload-on-update prompt.
- **CI/CD** - GitHub Actions pipeline runs lint, typecheck, tests, and build on every push/PR.

**Coming Soon (Phase 1 remaining):**

- Budget table with inline editing (3-column: name, +/-, amount)
- Live total footer (+income -expenses = balance)
- PDF export via jsPDF + Web Share API
- Vercel deployment

## Tech Stack

| Layer     | Technology                     | Version      |
| --------- | ------------------------------ | ------------ |
| Framework | React                          | 18.3+        |
| Language  | TypeScript                     | 5.7+         |
| Build     | Vite                           | 5.4+         |
| Styling   | Tailwind CSS                   | 4.1+         |
| Local DB  | Dexie.js                       | 4.3+         |
| PWA       | vite-plugin-pwa (Workbox)      | 0.17+        |
| Testing   | Vitest + React Testing Library | 1.6+ / 14.3+ |
| CI        | GitHub Actions                 | -            |

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

### Installation

```bash
git clone https://github.com/anyeloamt/cuentica.git
cd cuentica
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build        # Production build (includes typecheck)
npm run preview      # Preview production build locally
```

## Available Scripts

| Script                  | Description                      |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Start Vite dev server            |
| `npm run build`         | Typecheck + production build     |
| `npm run preview`       | Preview production build locally |
| `npm run lint`          | ESLint (zero warnings enforced)  |
| `npm run typecheck`     | `tsc --noEmit`                   |
| `npm test`              | Vitest (unit tests)              |
| `npm run test:coverage` | Vitest with v8 coverage          |
| `npm run format`        | Prettier                         |

### Verification (run after code changes)

```bash
npm run lint && npm run typecheck && npm test
```

## Project Structure

```
src/
├── components/           # UI components (JSX only, no business logic)
│   ├── Layout/           # AppLayout, Header, BottomTotal, ReloadPrompt, InstallPrompt
│   ├── Home/             # HomePage, WalletList, CreateWalletModal, ConfirmDeleteModal, FAB
│   ├── Budget/           # WalletDetailPage (stub - Sprint 1.3)
│   ├── Export/           # (planned)
│   └── Settings/         # ThemeToggle
├── hooks/                # Custom hooks (stateful logic, side effects)
│   ├── useWallets.ts     # Wallet CRUD with discriminated union results
│   ├── useWalletName.ts  # Single wallet name lookup
│   ├── useInstallPrompt.ts
│   └── usePwaUpdatePrompt.ts
├── lib/                  # Pure functions, DB config
│   └── db.ts             # Dexie.js schema v1
├── context/              # Shared state providers
│   └── ThemeContext.tsx   # Light/dark with localStorage
├── types/                # TypeScript interfaces
│   └── index.ts          # SyncableEntity, Wallet, BudgetItem
└── styles/               # Tailwind CSS
```

**Dependency direction**: Components -> Hooks -> Lib -> Types (never reverse).

For full architecture rules, see [AGENTS.md](./AGENTS.md).

## Architecture

- **Feature-based**: Clear layer separation with enforced dependency direction.
- **Offline-first PWA**: Workbox precaching (via vite-plugin-pwa) + Dexie.js for local data.
- **No backend**: All data stays on the user's device (Phase 1).
- **Discriminated unions**: Hook return types use `{ ok: true } | { ok: false; error: '...' }` for explicit error handling.

## Testing

- **Framework**: Vitest + React Testing Library + fake-indexeddb
- **Philosophy**: Test behavior (what the user sees), not implementation.
- **Co-location**: Tests live next to their source files (`Component.test.tsx`).
- **Mocking**: Dexie.js mocked via fake-indexeddb for unit tests.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full delivery plan.

| Phase       | Status      | Focus                                         |
| ----------- | ----------- | --------------------------------------------- |
| **Phase 1** | In Progress | Local MVP - wallets, budget table, PDF export |
| **Phase 2** | Planned     | Sync & Auth via Supabase                      |
| **Phase 3** | Planned     | Social features, advanced export              |
| **Phase 4** | TBD         | Agenda feature                                |

## Contributing

See [AGENTS.md](./AGENTS.md) for coding guidelines.

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- Ensure `npm run lint && npm run typecheck && npm test` all pass before opening a PR.

## License

MIT

## Status

**Phase 1 - Local MVP** (in active development)

- Sprint 1.1 (Foundation) ........... Done
- Sprint 1.2 (Wallets) .............. Done
- Sprint 1.3 (Budget Table) ......... Next
- Sprint 1.4 (PDF + Polish) ......... Pending
