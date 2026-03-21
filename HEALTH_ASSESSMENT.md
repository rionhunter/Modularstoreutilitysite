# Project Health Assessment — Modular Store Utility Site

**Date:** 2026-03-21  
**Assessed By:** GitHub Copilot Coding Agent  
**Version:** 0.1.0  
**Stack:** React 18 · TypeScript · Vite 6 · Tailwind CSS · ShadCN UI · React-DnD

---

## Executive Summary

The Modular Store Utility Site is a well-conceived retail operations dashboard with a solid module architecture documented in its own standards files. The core infrastructure—a singleton registry, configuration schema system, drag-and-drop dashboard, and admin portal—is structurally sound. However, a number of cross-cutting issues were identified that reduce maintainability, reliability, and potential for future growth. The most pressing categories are: **zero test coverage** (now partially remediated), **dual module-system architectures that coexist but are disconnected**, **duplicated type definitions and logic spread across multiple files**, and **several functional/security concerns** detailed below.

---

## 1. Test Coverage

### Previous State

**Zero test files.** No testing framework was configured. No test scripts in `package.json`.

### Remediation Applied

A full test harness has been introduced in this PR:

| New File | What It Tests | Tests |
|---|---|---|
| `src/utils/cashCalculator.test.ts` | `calculateFloatBreakdown`, `calculateCashTotal`, `DENOMINATIONS` | 15 |
| `src/utils/transactionParser.test.ts` | `parseTransactionInput` — all valid formats, invalid formats, edge cases | 20 |
| `src/types/module-system.test.ts` | `ModuleRegistry` (all methods), `ModuleStorageManager` (save/load/clear/malformed), `ModuleUtils` (validate, mergeConfig, generateInstanceId) | 31 |
| `src/utils/adminConfig.test.ts` | `getAdminConfig`, `saveAdminConfig`, `applyBranding` (CSS var conversion, favicon, doc title) | 15 |
| **Total** | | **81 tests, 4 test files, all passing** |

Test runner: **Vitest 4** with `jsdom` environment + `@testing-library/jest-dom`.  
Scripts added: `npm test`, `npm run test:watch`, `npm run test:coverage`.

### Test-Illuminated Findings

| # | Finding | Severity |
|---|---|---|
| T1 | `calculateCashTotal` silently ignores denominations not in the `DENOMINATIONS` array. This is correct behavior but was undocumented. | Info |
| T2 | `ModuleStorageManager.load()` logs `console.error` when JSON is malformed — this is acceptable but should eventually surface in a UI error boundary. | Low |
| T3 | `ModuleUtils.generateInstanceId` uses `Math.random().toString(36).substr(2, 9)` — `substr` is deprecated; should be `substring`. | Low |
| T4 | `applyBranding` with an invalid hex color string silently outputs `'0 0% 0%'` (black) for all CSS color variables. This is a silent misconfiguration failure. | Medium |
| T5 | No tests exist for the React components themselves (interaction tests). This is a gap that should be addressed in a follow-on iteration. | High |

---

## 2. Architectural Issues

### 2.1 Dual Module System (Disconnected Architectures)

**Severity: High**

The codebase contains two parallel, disconnected module systems:

**System A — Legacy (Simple)**
- Defined in `src/types/modules.ts` → `Module` interface (`id`, `title`, `enabled`, `order`)
- Used by: `App.tsx`, `BentoDashboard.tsx`, `ColumnarDashboard.tsx`, `ModuleSettings.tsx`, `ModuleBrowser.tsx`

**System B — Advanced (Full)**
- Defined in `src/types/module-system.ts` → `ModuleDefinition`, `InstalledModule`, `ModuleRegistry`, `ModuleStorageManager`, `ModuleUtils`
- Populated by: `src/modules/registry.ts` (CORE_MODULES)
- Consumed by: `useModules.ts` hook **only**

**The problem:** The advanced `useModules` hook is never used anywhere in the application. The registry is initialized (`initializeModuleRegistry()`) on app load but its `InstalledModule` system never drives the rendered dashboard. This means:
- All the rich config schema logic in `registry.ts` is dead weight
- Module configuration (currency, thresholds, etc.) cannot be persisted or applied to components
- The `ModuleComponentProps` interface (`config`, `onConfigChange`, `isEditing`) is defined but **no module component accepts or uses these props**

**Recommended Rectification Plan:**
1. Migrate `App.tsx` to use `useModules` as the single source of truth
2. Convert all module components to accept and use the `config` prop
3. Remove `src/types/modules.ts` (the legacy `Module` interface) once migration is complete
4. Connect the dashboard render path to `InstalledModule.config` so modules receive their configured values

### 2.2 Duplicate Module Rendering Switch Statement

**Severity: Medium**

Both `BentoDashboard.tsx` and `ColumnarDashboard.tsx` contain identical `renderModule(moduleId)` switch statements that manually map module IDs to component imports. This is a maintenance liability — adding a new module requires editing two files. The module registry already contains the component reference; these switch statements should be replaced with a registry lookup:

```tsx
// Current (duplicated, fragile)
switch (moduleId) {
  case 'cash-calculator': return <CashCalculatorModule />;
  // … 8 more cases …
}

// Recommended (DRY, registry-driven)
const definition = registry.get(moduleId);
if (!definition) return null;
const ModuleComponent = definition.component;
return <ModuleComponent config={config} />;
```

### 2.3 `BentoDashboard` is Imported But Never Rendered

**Severity: Low**

`BentoDashboard` is imported in `App.tsx` and is a fully functional component, but `ColumnarDashboard` is always rendered in its place. Either:
- Remove `BentoDashboard` if the columnar layout is the intended design, or
- Expose a layout toggle in Admin settings to switch between the two

---

## 3. Overlapping / Duplicated Logic

### 3.1 Duplicate Type Definitions

**Severity: Medium**

Several interfaces are defined both in the shared `src/types/modules.ts` and locally within individual module components:

| Interface | Shared Location | Local Duplicate In |
|---|---|---|
| `CashEntry` | `types/modules.ts:18` | `CashCalculatorModule.tsx` (removed in this PR) |
| `Task` | `types/modules.ts:31` | `TaskTrackerModule.tsx:14` |
| `QuoteItem`, `Quote` | `types/modules.ts:54,45` | `QuoteSystemModule.tsx:11,17` |
| `StockItem` | `types/modules.ts:61` | Not used — module uses its own `BayLocation` type |

**Recommended Rectification Plan:**
- Each module component should import its domain type from `src/types/modules.ts`
- Remove local re-declarations
- `StockItem` in `types/modules.ts` should either be updated to match actual usage or removed

### 3.2 Business Logic Embedded in React Components

**Severity: Medium — Partially Remediated**

`CashCalculatorModule` and `TransactionCalculatorModule` previously contained their entire business logic (denomination breakdown algorithm, transaction string parser) as inlined closures within the component. These have been extracted to testable utility modules:

- `src/utils/cashCalculator.ts` — `calculateFloatBreakdown`, `calculateCashTotal`, `DENOMINATIONS`
- `src/utils/transactionParser.ts` — `parseTransactionInput`

**Remaining:** `TaskTrackerModule`, `QuoteSystemModule`, `StockTrackerModule`, `SpecialsModule` still contain significant inline logic that would benefit from extraction and testing.

### 3.3 Currency Formatting Duplicated Across Modules

**Severity: Low**

The `formatCurrency` function (using `Intl.NumberFormat`) is independently defined inside:
- `CashCalculatorModule.tsx`
- `TransactionCalculatorModule.tsx`
- `QuoteSystemModule.tsx` (likely)
- `BalanceCalculatorModule.tsx` (uses inline `${}` template literal)

**Recommended Rectification Plan:**
- Create `src/utils/formatCurrency.ts` with a shared formatter that accepts a currency code
- Connect it to the per-module `config.currency` field once the advanced module system is wired in

---

## 4. Security Issues

### 4.1 Plaintext Password Storage (Critical)

**Severity: Critical**

`AuthPage.tsx` stores user passwords in plaintext in `localStorage`:
```ts
password, // In production, hash this!
```

This is acknowledged in a code comment but not actioned. Anyone with access to DevTools can read all passwords. Since this is a local-only utility tool with no backend, a practical interim solution is to use a client-side hash (e.g., SHA-256 via the Web Crypto API) before storing:

```ts
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
```

**Note:** For a proper production deployment, passwords must never be processed client-side. A backend authentication service is required.

### 4.2 Moderate Vulnerability in Vite Dependency

**Severity: Moderate** (external dependency)

`npm audit` reports a moderate vulnerability in `vite ≤6.3.5`:
- `GHSA-jqfw-vq24-v9c3` and `GHSA-93m4-6634-74q7` — `server.fs` settings bypass via `HTML` and backslash on Windows.

**Recommended Rectification:** Upgrade Vite: `npm install --save-dev vite@latest`. The vulnerability primarily affects the dev server, not production builds.

---

## 5. Code Quality Issues

### 5.1 Versioned Import Aliases (Figma Make Artifact)

**Severity: Medium**

`vite.config.ts` contains 40+ aliases to resolve version-pinned imports like `'sonner@2.0.3'`:
```ts
alias: {
  'sonner@2.0.3': 'sonner',
  'recharts@2.15.2': 'recharts',
  // … 38 more …
}
```

Multiple component files import from these versioned paths (e.g., `import { toast } from 'sonner@2.0.3'`). This is a Figma Make code-generation artifact. It creates fragile build configuration and makes IDE analysis and refactoring unreliable.

**Recommended Rectification Plan:**
- Replace all versioned imports with clean package names (e.g., `import { toast } from 'sonner'`)
- Remove the alias block from `vite.config.ts`

This affects approximately 15+ component files.

### 5.2 `confirm()` Replaced with Toast Action

**Severity: Low — Remediated**

`BalanceCalculatorModule.tsx` used the native browser `confirm()` dialog, which is:
- Blocking (freezes the event loop)
- Not styleable (breaks design system consistency)
- Inaccessible (screen readers handle it poorly)

**Fix applied:** Replaced with a Sonner toast action pattern that provides `Clear` / `Cancel` buttons inline.

### 5.3 Unused `useMemo` Import in `App.tsx`

**Severity: Low — Remediated**

`App.tsx` imported `useMemo` from React but never used it. Removed.

### 5.4 `SpecialsModule` Expiration Logic Bug

**Severity: Medium**

In `SpecialsModule.tsx` (~line 66), the `checkExpiration` effect calculates `isExpired` on each special but:
1. `isExpired` is not part of the `Special` interface, so TypeScript cannot catch misuse
2. The `hasChanges` comparison compares the newly-computed value against itself (always `false`), making the re-render trigger dead code

```ts
const wasExpired = new Date(original.endDate) < now;
return s.isExpired !== wasExpired; // s.isExpired is the same as wasExpired — always false
```

**Recommended Fix:** Compute `isExpired` as a derived value during render (no `useEffect` needed) and add it to the `Special` interface or as a computed type.

### 5.5 `ModuleRegistry` Singleton Not Reset Between Hot Reloads

**Severity: Low**

The `ModuleRegistry` is a global singleton. During Vite HMR (hot module replacement), `initializeModuleRegistry()` may be called again on each reload, triggering `console.warn("Module X is already registered. Overwriting...")` for every module. This is functional but noisy during development.

**Recommended Fix:** Add a guard in `initializeModuleRegistry()`:
```ts
if (registry.count() === 0) {
  CORE_MODULES.forEach(m => registry.register(m));
}
```

### 5.6 `Contact` Type Leaked from `ContactsPage` Component

**Severity: Low**

Both `ModuleBrowser.tsx` and `ModuleSettings.tsx` import the `Contact` type from `./ContactsPage`. Domain types should live in `src/types/`, not inside page components. This creates an awkward import dependency.

**Recommended Fix:** Move `Contact` and related types to `src/types/contacts.ts`.

### 5.7 Hardcoded LocalStorage Keys Without Namespacing

**Severity: Low**

Each module independently manages its own localStorage key:
- `'tasks'`, `'specials'`, `'balance-entries'`, `'store-modules'`, `'admin-config'`, `'installed-modules'`, `'users'`

These bare keys risk collision with other apps sharing the same origin, or with future modules. A namespacing convention (e.g., `store-utility:tasks`) would prevent this.

---

## 6. Performance Issues

### 6.1 No Code Splitting — 1 MB Bundle

**Severity: Medium**

The production bundle is a single chunk of 1,021 KB (304 KB gzipped). Vite's own build output warns about this. The admin portal, store layout page, stock take, sales/POS screen, and module components could all be lazy-loaded:

```tsx
// Example: lazy-load the Admin portal
const AdminPortal = React.lazy(() => import('./components/AdminPortal'));
```

This would significantly reduce the initial load time, particularly for the dashboard view which is the most commonly accessed.

### 6.2 All Radix UI Primitives Installed (Most Unused)

**Severity: Low**

`package.json` includes all ~22 `@radix-ui` packages. A package audit would likely reveal that several (e.g., `@radix-ui/react-menubar`, `@radix-ui/react-aspect-ratio`) are unused. Removing unused packages reduces bundle size and dependency surface area.

---

## 7. Missing Features / Decrepit Stubs

### 7.1 `ModuleRegistry.importModule()` is a Stub

**Severity: Info**

```ts
public async importModule(moduleCode: string): Promise<ModuleDefinition> {
  throw new Error('Dynamic module import not yet implemented');
}
```

This is explicitly noted in `MODULE_STANDARD.md` as future work. It is not a bug but should be tracked.

### 7.2 Module Config Props Never Wired

**Severity: High** (architectural — see §2.1)

All module components are expected to receive `config` and `onConfigChange` props per the `ModuleComponentProps` interface. Currently none of them accept these props. The `configSchema` defined for each module in `registry.ts` (e.g., `currency`, `defaultFloat`, `taxRate`) is completely inert.

### 7.3 No Mobile Navigation Menu

**Severity: Low**

The header has a duplicate mobile navigation bar with all the same buttons as the desktop nav. A proper mobile menu (hamburger → drawer) would be more ergonomic and avoid UI duplication.

### 7.4 No Error Boundaries

**Severity: Medium**

No React `ErrorBoundary` wraps the module components. A runtime error in a single module (e.g., corrupted localStorage data) will crash the entire dashboard. Each module should be wrapped in a boundary that catches errors and shows a fallback card.

---

## 8. Documentation Assessment

| Document | Status | Notes |
|---|---|---|
| `README.md` | ✅ Adequate | Basic setup and overview |
| `src/DASHBOARD_GUIDE.md` | ✅ Good | User-facing guide for all modules |
| `src/MODULE_STANDARD.md` | ✅ Good | Developer spec for custom modules |
| `src/README_MODULE_SYSTEM.md` | ✅ Good | Architecture overview |
| `src/Attributions.md` | ℹ️ Exists | Empty or placeholder |
| `src/guidelines/Guidelines.md` | ⚠️ Incomplete | Contains template comments, no actual guidelines filled in |

**Recommendation:** Fill in `guidelines/Guidelines.md` with actual project guidelines (naming conventions, component patterns, accessibility requirements). Move `src/DASHBOARD_GUIDE.md`, `src/MODULE_STANDARD.md`, `src/README_MODULE_SYSTEM.md`, and `src/Attributions.md` to a `/docs` folder at the project root to keep `src/` clean.

---

## 9. Modularity Principles — Assessment & Guidance

Modularity and efficiency are foundational to this project's stated goals. The following principles should guide all future development:

### ✅ What Is Currently Done Well
- **Registry Pattern:** The `ModuleRegistry` singleton decouples module discovery from rendering — new modules can be added without touching the dashboard layout code.
- **Configuration Schema:** The `ModuleConfigSchema` system allows each module to declare its own configurable fields declaratively. This is a strong foundation.
- **Self-Contained State:** Each module manages its own localStorage key, keeping state isolated.
- **ShadCN UI:** Using a shared design system ensures consistent visual language without UI logic bleeding between modules.

### ❌ What Needs Improvement for Maximum Modularity

1. **Modules must accept `config` props.** A module that ignores its configuration isn't truly modular — it can't be customised per-deployment or per-user without code changes.

2. **Render paths must be registry-driven, not switch statements.** Hard-coded switch statements tie the dashboard to a fixed set of module IDs. The registry should be the single source of truth for both module discovery and component instantiation.

3. **Business logic must be separate from UI components.** Logic embedded in component closures cannot be tested, reused, or composed. The extraction of `cashCalculator.ts` and `transactionParser.ts` in this PR is the model to follow for all remaining modules.

4. **Types must be centralised.** Duplicate type declarations between `src/types/modules.ts` and individual components create drift and silent type mismatches. All domain types belong in `src/types/`.

5. **Modules must be individually lazy-loadable.** For the module marketplace vision (outlined in `MODULE_STANDARD.md`) to be achievable, each module must be a separate chunk that can be loaded on demand.

6. **One source of truth for module state.** The current dual-system (legacy `Module[]` array vs. advanced `InstalledModule[]` system) means configuration changes in the Admin portal cannot reach the rendered modules. Consolidating on the advanced system resolves this.

---

## 10. Prioritised Remediation Plan

| Priority | Issue | Effort | Impact |
|---|---|---|---|
| 🔴 Critical | §4.1 Plaintext password storage | Medium | Security |
| 🔴 High | §2.1 Wire `useModules` / advanced system to dashboard | Large | Architecture |
| 🔴 High | §7.2 Wire module `config` props to components | Large | Functionality |
| 🟠 Medium | §5.1 Remove versioned import aliases | Medium | Maintainability |
| 🟠 Medium | §2.2 Replace switch statements with registry lookups | Small | Modularity |
| 🟠 Medium | §3.1 Remove duplicate type definitions | Small | Maintainability |
| 🟠 Medium | §5.4 Fix SpecialsModule expiration logic bug | Small | Correctness |
| 🟠 Medium | §7.4 Add React Error Boundaries around modules | Small | Reliability |
| 🟠 Medium | §6.1 Implement code splitting with lazy imports | Medium | Performance |
| 🟡 Low | §4.2 Upgrade Vite to fix advisory | Small | Security |
| 🟡 Low | §5.5 Guard registry re-init on HMR | Small | DX |
| 🟡 Low | §3.3 Create shared `formatCurrency` utility | Small | DRY |
| 🟡 Low | §5.6 Move `Contact` type to `src/types/` | Small | Organisation |
| 🟡 Low | §5.7 Namespace localStorage keys | Small | Robustness |
| 🟡 Low | §2.3 Remove / integrate `BentoDashboard` | Small | Clarity |
| 🟡 Low | §T3 Replace deprecated `substr` with `substring` | Trivial | Quality |
| 🟡 Low | §8 Move docs to `/docs` folder | Trivial | Organisation |

---

## 11. Testing Roadmap

Now that the infrastructure is in place (Vitest + jsdom + Testing Library), the following tests should be added incrementally:

| Component/Module | Recommended Test Type | Priority |
|---|---|---|
| `TaskTrackerModule` business logic (alert calculation) | Unit | High |
| `SpecialsModule` expiry detection | Unit | High |
| `QuoteSystemModule` total calculation | Unit | High |
| `ModuleSettings` toggle behaviour | Component (RTL) | Medium |
| `AuthPage` sign-in / sign-up flow | Component (RTL) | Medium |
| `ColumnarDashboard` module rendering | Component (RTL) | Medium |
| `useModules` hook | Hook test (renderHook) | Medium |
| `adminConfig` round-trip | Integration | Low |
| End-to-end dashboard flow | E2E (Playwright) | Low |

---

*This document should be updated whenever significant architecture changes are made or new test findings emerge.*
