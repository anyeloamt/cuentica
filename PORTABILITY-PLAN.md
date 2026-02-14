# Portability Plan: expense-ai Skills → Shared Toolkit

> **Source**: `/home/anyelo/code/expense-ai/.claude/`
> **Goal**: Extract reusable agentic workflows into a shared location usable by any project (starting with Cuentica)
> **Date**: 2026-02-14

---

## Executive Summary

The `expense-ai` project contains a sophisticated agentic layer with **9 skills**, **6 agent personas**, **6 commands**, and a **complete GitHub issue-to-PR orchestration workflow**. After analysis, **~60% is directly portable**, **~30% needs tech-stack adaptation**, and **~10% is project-specific** (not worth porting).

The biggest wins are the **orchestration workflow** (`work-issue`), **GitHub automation** (`gh-pr-issue-workflow`), and the **structural patterns** of plan → implement → review → PR. These are language-agnostic at their core.

---

## Inventory & Portability Classification

### Tier 1: 100% Portable (Copy & Use)

These skills are language/framework agnostic. They work for any project immediately.

| Skill | Path | What It Does | Lines |
|-------|------|--------------|-------|
| **gh-pr-issue-workflow** | `skills/gh-pr-issue-workflow/SKILL.md` | GitHub CLI patterns: PR/issue creation with safe Markdown, sub-issue hierarchy via GraphQL/REST API, templates | 195 |
| **opencode-config** | `skills/opencode-config/SKILL.md` | Model provider switching (Anthropic, Zen, Copilot, OpenAI) via config templates | 42 |
| **settings.json** | `settings.json` | Pre-commit hook: syncs Beads local issue tracker before git commits | 16 |
| **pm** | `skills/pm.md` + `skills/pm/SKILL.md` | Strategic product manager: evaluates features against roadmap, monetization, ROI. Outputs structured verdicts. | 130 |

**Action**: Copy directly to shared location. Zero modifications needed.

---

### Tier 2: Portable Core + Tech-Specific Skin (Needs Adaptation)

These have an excellent **generic structure** but contain `.NET/Clean Architecture` specific content that needs to be replaced with React/TypeScript/PWA equivalents.

#### 2A. `work-issue` — Orchestration Workflow (509 lines)

**What's generic (keep as-is):**
- The 12-step orchestration flow: Beads → Git → Explore → Plan → Implement → Review → PR → Close
- Session continuity pattern (`session_id` reuse across rounds)
- Delegation structure (orchestrator never writes code)
- Review loop (max 3 rounds, escalate to human)
- PR comment acknowledgment workflow (react + reply)
- Beads progress tracking protocol
- Markdown artifact metadata (model/persona footer)

**What's project-specific (replace):**
- References to `pwsh ./scripts/agent-hook.ps1` → Replace with `npm run lint && npm run typecheck && npm test`
- References to `pwsh ./scripts/test-coverage.ps1` → Replace with Vitest coverage
- `dotnet` build commands → Replace with Vite/npm commands
- `grepai_search` / `grepai_trace_*` references → These are optional (nice-to-have). Standard `grep`, `ast-grep`, and LSP work fine.

**Effort**: ~2h to create React/TypeScript variant

#### 2B. `plan` — Implementation Planner (256 lines)

**What's generic (keep as-is):**
- Plan structure: Overview → Affected Files → Architecture Validation → SOLID → Steps → Testing → Risk → Questions
- Risk assessment framework (7 categories)
- Output location pattern (`.md/issues/{id}/plan.md`)
- Search tool strategy table

**What needs React/TS adaptation:**

| .NET Concept | React/TypeScript Equivalent |
|--------------|---------------------------|
| Clean Architecture layers (Domain → Application → Infrastructure → Service) | Feature-based structure (components → hooks → lib → context) |
| DI Lifetime risks (Scoped into Singleton, captive deps) | React rendering risks (stale closures, missing deps in useEffect, prop drilling) |
| Concurrency risks (async void, deadlocks) | Async state risks (race conditions in useEffect, stale setState) |
| Data Access risks (unbounded queries, N+1) | IndexedDB/Dexie.js risks (schema migrations, quota limits, bulk operations) |
| Resource Management (IDisposable, HttpClient) | Cleanup patterns (useEffect cleanup, AbortController, subscription leaks) |
| Return Value Semantics | Same — applicable in any language |
| API Contract risks | API/Props contract risks (breaking component interfaces, missing PropTypes/TS) |
| Observability (structured logging) | Console/monitoring (error boundaries, Sentry integration) |

**Effort**: ~3h to create React/TypeScript variant

#### 2C. `code-review` — Rigorous Reviewer (791 lines)

**What's generic (keep as-is):**
- Review output structure (Critical → Architecture → Concurrency → ... → Verdict)
- Multi-round review workflow
- Output location pattern
- Review process steps
- Verdict system (APPROVE / REQUEST CHANGES / BLOCK MERGE)
- Markdown format template

**What needs React/TS adaptation:**

| .NET Review Category | React/TypeScript Equivalent |
|---------------------|---------------------------|
| Clean Architecture violations | Component architecture violations (logic in UI, side effects in render) |
| SOLID principles | Component design (SRP per component, composition over inheritance, interface segregation via props) |
| Security (SQL injection, XSS) | Security (XSS via dangerouslySetInnerHTML, prototype pollution, localStorage secrets) |
| Async anti-patterns (.Result, async void) | Async anti-patterns (missing cleanup in useEffect, race conditions, unhandled Promise rejections) |
| DI Lifetime (captive deps) | Hook rules violations (conditional hooks, hooks in loops, stale closures) |
| Memory leaks (event handlers, IDisposable) | Memory leaks (missing useEffect cleanup, event listener leaks, setInterval without clear) |
| Data Access (unbounded, N+1) | IndexedDB patterns (missing indexes, unbounded liveQuery, schema migration gaps) |
| Resource management (HttpClient) | Resource management (AbortController for fetch, Web Worker cleanup) |
| CancellationToken | AbortSignal / AbortController |
| Nullable reference types | TypeScript strict null checks, optional chaining misuse |
| Exception handling | Error boundaries, try/catch in async handlers, global error handling |
| Logging | Console discipline, error reporting service integration |

**Effort**: ~4h to create React/TypeScript variant (this is the longest skill)

#### 2D. `implement` — Implementation Executor (292 lines)

**What's generic (keep as-is):**
- Core workflow: Discover → Read → Discuss → Implement → Validate
- Output file conventions
- Pitfall section structure

**What needs React/TS adaptation:**
- All code examples → React/TypeScript patterns
- Architecture rules → React component architecture
- Build/test commands → `npm run build`, `npm test`, `npm run lint`
- Pitfalls → React-specific (stale closures, key prop issues, controlled vs uncontrolled)

**Effort**: ~2h to create React/TypeScript variant

---

### Tier 3: Not Portable (Project-Specific)

| Item | Why Not Portable |
|------|-----------------|
| `AGENTS.md` | Contains expense-ai project hierarchy, phase status, build commands, grepai setup. Each project needs its own. |
| `.claude/agents/*.md` | Personas reference "SpendiaBot", ".NET developer". Need new personas per project. |
| `.claude/commands/agents/*` | Agent commands tailored to expense-ai workflows (marketing-writer, doc-writer for Telegram bot). |
| `implement/references/` | Architecture.md and patterns.md are .NET-specific reference docs. |

**Action**: Don't port. Create new per-project. Use expense-ai versions as structural templates.

---

## Proposed Shared Structure

```
~/.config/opencode/shared-skills/          # OR a git repo
├── workflows/
│   ├── work-issue.md                      # Tier 1: Generic orchestration (parameterized)
│   └── gh-pr-issue-workflow.md            # Tier 1: GitHub CLI patterns
├── skills/
│   ├── opencode-config.md                 # Tier 1: Model switching
│   └── pm.md                             # Tier 1: Product manager
├── templates/
│   ├── react-ts/                          # Tier 2: React/TypeScript skin
│   │   ├── plan.md                        # Planning with React risk categories
│   │   ├── code-review.md                # Review with React/TS checks
│   │   └── implement.md                  # Implementation with React patterns
│   ├── dotnet/                            # Tier 2: .NET skin (current expense-ai)
│   │   ├── plan.md
│   │   ├── code-review.md
│   │   └── implement.md
│   └── _template/                         # Tier 2: Blank template to create new skins
│       ├── plan.md
│       ├── code-review.md
│       └── implement.md
├── hooks/
│   └── settings.json                      # Beads pre-commit hook
└── configs/
    ├── anthropic-only.json                # OpenCode model configs
    ├── anthropic-zen.json
    └── copilot-antigravity.json
```

### Per-Project Setup

Each project would have a thin `.claude/` layer that:
1. **Symlinks or copies** shared skills it needs
2. **Has its own** `AGENTS.md` with project-specific context
3. **Has its own** agent personas if needed
4. **References** the appropriate tech-stack skin (react-ts, dotnet, etc.)

Example for Cuentica:
```
cuentica/.claude/
├── skills/
│   ├── work-issue/SKILL.md          → symlink or copy from shared/workflows/
│   ├── gh-pr-issue-workflow/SKILL.md → symlink or copy from shared/workflows/
│   ├── plan/SKILL.md                → copy from shared/templates/react-ts/plan.md
│   ├── code-review/SKILL.md         → copy from shared/templates/react-ts/code-review.md
│   ├── implement/SKILL.md           → copy from shared/templates/react-ts/implement.md
│   └── opencode-config/SKILL.md     → symlink from shared/skills/
├── settings.json                     → copy from shared/hooks/
└── AGENTS.md                         → project-specific (new)
```

---

## Implementation Roadmap

### Phase A: Extract & Organize (2-3h)

| # | Task | Effort |
|---|------|--------|
| A.1 | Create shared skills repo/directory structure | 30min |
| A.2 | Copy Tier 1 skills (gh-pr-issue-workflow, opencode-config, pm, settings.json) as-is | 15min |
| A.3 | Extract generic core from `work-issue` — parameterize build/test commands | 1h |
| A.4 | Copy `.opencode-configs/` model config templates | 15min |

### Phase B: Create React/TypeScript Skin (4-6h)

| # | Task | Effort |
|---|------|--------|
| B.1 | Create `react-ts/plan.md` — adapt risk categories, architecture validation | 1.5h |
| B.2 | Create `react-ts/code-review.md` — adapt all review categories with React/TS examples | 2.5h |
| B.3 | Create `react-ts/implement.md` — React patterns, hooks rules, component architecture | 1.5h |

### Phase C: Apply to Cuentica (1-2h)

| # | Task | Effort |
|---|------|--------|
| C.1 | Set up `cuentica/.claude/` directory with skills from shared | 30min |
| C.2 | Write `cuentica/AGENTS.md` — project context, build commands, PWA guidelines | 1h |
| C.3 | Test workflow: create a GitHub issue and run `/work-issue` end-to-end | 30min |

### Phase D: Preserve .NET Skin (30min)

| # | Task | Effort |
|---|------|--------|
| D.1 | Copy current expense-ai skills to `shared/templates/dotnet/` | 15min |
| D.2 | Update expense-ai to reference shared Tier 1 skills | 15min |

---

## Key Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Where to store shared skills?** | (a) `~/.config/opencode/shared-skills/` (b) Dedicated git repo (c) Git submodule in each project | **(b) Dedicated git repo** — version controlled, shareable across machines, can be cloned into each project |
| **Symlinks vs copies?** | (a) Symlinks to shared (b) Copy on project init | **(b) Copy** — more resilient, no broken links. Use a script to update from shared. |
| **Should `work-issue` be parameterized or per-skin?** | (a) One file with variables (b) One per tech stack | **(a) Parameterized** — the orchestration flow is identical. Only build/test commands differ, and those come from AGENTS.md |

---

## What Cuentica Gets from This

| Capability | Before (from scratch) | After (ported from expense-ai) |
|-----------|----------------------|-------------------------------|
| Issue-to-PR automation | Manual | `/work-issue 5` → automated branch, plan, implement, review, PR |
| Architectural planning | Ad hoc | Structured plans with React-specific risk assessment |
| Code review | Manual or skipped | Automated 3-round review with React/TS-specific checks |
| GitHub workflow | Manual PR creation | Safe Markdown, sub-issue hierarchy, templates |
| Progress tracking | None | Beads integration with session recovery |
| Model switching | Manual config edit | `/opencode-config` → instant swap |
| Feature evaluation | Gut feeling | `/pm` → structured ROI verdicts |

---

## Total Effort Estimate

| Phase | Effort | Dependency |
|-------|--------|------------|
| A: Extract & Organize | 2-3h | None |
| B: React/TS Skin | 4-6h | Phase A |
| C: Apply to Cuentica | 1-2h | Phase B |
| D: Preserve .NET | 30min | Phase A |
| **Total** | **8-12h** | |

This is a one-time investment that pays off for every future project.
