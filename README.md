# Cuentica - Simple Budgeting PWA

> An extremely simple budgeting app. Offline-first, web-based, with PDF export.

Cuentica is designed with radical simplicity in mind. If it takes more than 3 seconds to understand how to do something, we failed.

## ✨ Features

- 📱 **Offline-first PWA** - Works completely without internet after the first load.
- 💰 **Wallet-based Budgeting** - Organize your expenses and income into simple "wallets".
- 📊 **Radical Simplicity** - 3-column table (name, sign, amount) designed for high-speed input.
- 📄 **PDF Export** - Generate clean reports and share them via WhatsApp, email, or other apps using the Web Share API.
- 🎨 **Light/Dark Theme** - Automatic system theme detection with manual toggle and persistence.
- 🚀 **Zero Friction** - No login required (for Phase 1), no ads, no onboarding.

## 🛠 Tech Stack

- **React 18.3+**
- **TypeScript 5.7+**
- **Vite 5.4+** (Build tool)
- **Dexie.js 4.3+** (Elegant IndexedDB wrapper)
- **jsPDF** (Client-side PDF generation)
- **vite-plugin-pwa** (Service Worker and PWA support)
- **Vitest + React Testing Library** (Testing framework)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/anyeloamt/cuentica.git
   cd cuentica
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

### Build

Create a production-ready build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 📜 Available Scripts

- `npm run dev` - Start Vite dev server.
- `npm run build` - Production build (runs type checking before building).
- `npm run preview` - Preview production build locally.
- `npm run lint` - Run ESLint to find and fix code style issues.
- `npm run typecheck` - Run TypeScript compiler check without emitting files.
- `npm test` - Run unit and integration tests.
- `npm run test:coverage` - Run tests and generate coverage reports.
- `npm run format` - Format code with Prettier.

## 📁 Project Structure

The project follows a feature-based architecture to ensure scalability and maintainability:

- `src/components/`: UI components (purely for rendering, no business logic).
- `src/hooks/`: Custom hooks for stateful logic and side effects.
- `src/lib/`: Pure functions, database configuration, and external API calls.
- `src/context/`: React context providers for shared state.
- `src/types/`: TypeScript interfaces and global type definitions.

For a detailed look at the architecture and coding rules, see [AGENTS.md](./AGENTS.md).

## 🏗 Architecture

- **Feature-based Architecture**: Clear dependency direction (Components → Hooks → Lib → Types).
- **Offline-first PWA**: Leverages Workbox (via vite-plugin-pwa) for caching and Dexie.js for local data persistence.
- **No Backend Required**: In its current phase, all data remains strictly on the user's device.

## 🧪 Development Guidelines

- **PWA Testing**: Always verify offline functionality by running `npm run build && npm run preview` and testing in airplane mode.
- **Performance**: Maintain a Lighthouse PWA score > 95.
- **Testing Philosophy**: We prioritize testing user behavior over internal implementation details.

## 🗺 Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full delivery plan.

- **Phase 1**: Local MVP (Current) - Focus on core budgeting and PDF export.
- **Phase 2**: Sync & Auth - Multi-device synchronization via Supabase.
- **Phase 3**: Social & Power Features - Shared links and advanced organization.

## 🤝 Contributing

We welcome contributions! Please refer to [AGENTS.md](./AGENTS.md) for detailed coding guidelines.

- Use **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, etc.).
- Ensure that `npm run lint`, `npm run typecheck`, and `npm test` all pass before opening a Pull Request.

## 📄 License

MIT

## 📊 Status

🚧 **Phase 1 - Local MVP** (Pre-MVP, in active development)
