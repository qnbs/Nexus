# Nexus — Codebase Audit Report

**Date:** 2026-05-02 (updated)
**Auditor:** Automated / Cursor-assisted review
**Scope:** Full app, repo structure, environment, security, architecture, code quality
**App Version:** 1.0.0

---

## Executive Summary

Nexus is a well-architected, feature-rich AI-powered knowledge exploration app built with React 18, TypeScript 5.8, and Vite 6.x. It leverages the Google Gemini API suite for text, image, and video generation. The app is deployed as a client-side-only application on Google AI Studio.

**Overall Assessment: 7.5/10** — Production-quality UI and feature set with strong TypeScript usage and complete bilingual localization. Infrastructure now includes CI (GitHub Actions), ESLint, and a reproducible lockfile; automated tests remain optional follow-up. Known architectural security trade-offs (client-side API key, HTML rendering) are unchanged.

| Category | Score | Status |
|----------|-------|--------|
| Security | 4/10 | 🔴 API key client-side (architectural), XSS surface via `dangerouslySetInnerHTML` |
| Code Quality | 7/10 | 🟡 Clean patterns, some oversized hooks/components |
| TypeScript | 8/10 | 🟢 Well-typed, 0 compile errors, some `any` / hook-deps warnings in ESLint |
| Performance | 6/10 | 🟡 All panels rendered simultaneously, no debouncing |
| Architecture | 7/10 | 🟢 Good Context/Reducer separation, clean hook abstraction |
| Localization | 9/10 | 🟢 Fully synchronized DE/EN, 950+ keys, idiomatic |
| Infrastructure | 6/10 | 🟡 GitHub Actions CI, ESLint, `npm run ci`; no unit/E2E tests yet |
| PWA | 8/10 | 🟢 `public/` manifest, icons, service worker copied to `dist/`; cache strategy documented in `public/sw.js` |

---

## Fixed in This Audit

| Issue | Severity | Fix |
|-------|----------|-----|
| `charset="utf-t-8"` in `index.html` | 🔴 Critical | Corrected to `utf-8` |
| `.gitignore` incomplete | 🟡 Medium | Added OS files, IDE configs, logs, coverage |
| No `.env.example` | 🟡 Medium | Created with `GEMINI_API_KEY` documentation |
| Broken import in `useVideoGeneration.ts` | 🔴 Critical | Fixed path `../../services/errors` → `../services/errors` (build failure) |
| Version `0.0.0` | 🟡 Low | Bumped to `1.0.0` |
| PWA assets not under Vite `public/` | 🔴 High | `manifest.webmanifest`, `sw.js`, icons → `public/` for correct `dist/` output |
| `package-lock.json` ignored | 🟡 Medium | Lockfile tracked; `npm ci` in CI |
| No CI / lint | 🔴 High | GitHub Actions + ESLint 9 + `npm run ci` |
| Redundant try/catch in `generateVideo` | 🟡 Low | Removed useless rethrow in `hooks/useArticleManager.ts` |

---

## Security Analysis

### 🔴 Critical: API Key Exposure (Architectural)

**Files:** `vite.config.ts`, `services/geminiService.ts`

The Gemini API key is embedded into the client-side bundle via Vite's `define` config:

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

**Impact:** Any user can extract the API key from browser DevTools.

**Assessment:** This is an **architectural trade-off** inherent to Google AI Studio's client-only deployment model. There is no backend available to proxy API calls. The key is scoped to the Gemini API and rate-limited by Google.

**Recommendation (if migrating off AI Studio):**
- Route API calls through a backend proxy with authentication
- Use server-side API key storage
- Implement per-user rate limiting

### 🟡 Medium: XSS Surface via `dangerouslySetInnerHTML`

**Files:** `components/AthenaCopilot.tsx` (line ~122), `components/ArticleView.tsx` (line ~49)

Both components use `dangerouslySetInnerHTML` with regex-based HTML formatting of API responses.

**Risk Assessment:** Low-to-medium. Content comes from the Gemini API (trusted source), not arbitrary user input. However, if the API ever returns malicious content or prompt injection succeeds, XSS is possible.

**Recommendation:**
- Replace with `react-markdown` or `marked` + `DOMPurify` for safe rendering
- Until then, add `DOMPurify.sanitize()` as a minimum safeguard
- Priority: Medium-term refactoring

### 🟡 Medium: Video Download URL Exposes API Key

**File:** `services/geminiService.ts` (line ~218)

```typescript
`${downloadLink}&key=${process.env.API_KEY}`
```

The API key is visible in network requests and potentially logged by intermediaries.

**Recommendation:** Same as API key issue above — architectural limitation of client-only deployment.

### 🟢 Low: No Input Validation on Import

**File:** `hooks/useDataManager.ts`

Imported backup JSON is not validated against a schema before applying to state.

**Recommendation:** Add Zod or similar schema validation for imported data.

---

## Code Quality Analysis

### Oversized Components & Hooks

| File | Lines | Recommendation |
|------|-------|----------------|
| `components/ArticleView.tsx` | ~650 | Split into ArticleHeader, ArticleSection, ArticleTimeline, InteractionModal subcomponents |
| `services/geminiService.ts` | ~450 | Extract schema definitions, retry logic, and model configs into separate modules |
| `hooks/useArticleManager.ts` | ~150 | Extract image generation and chat management into separate hooks |
| `context/NexusProvider.tsx` | ~200 | Extract settings management and localization into dedicated providers |

### Race Conditions

**File:** `hooks/useArticleManager.ts`

Uses `searchIdRef` to cancel outdated searches, but concurrent `generateAllImages` calls are not cancelled when a new search starts. This can cause images from a previous search to overwrite the current article's images.

**Recommendation:** Add AbortController support for image generation or track generation batches.

### Type Safety Issues

| Location | Issue |
|----------|-------|
| `hooks/useVideoGeneration.ts` | `(window as any).aistudio` — unchecked external API |
| `services/geminiService.ts` ~L162 | `(operation as any).metadata` — type casting |
| Several hooks | `as T` casts without proper narrowing |

**Recommendation:** Define TypeScript interfaces for external APIs (e.g., `AIStudioWindow`).

### Dead/Redundant Code

- `vite.config.ts` defines both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` with the same value — only one is needed
- `context/AppContext.ts` comment says "being refactored" — incomplete state

---

## Performance Analysis

### Rendering

- **All panels rendered simultaneously** in `MainLayout.tsx` (CommandPalette, SettingsModal, HelpGuide, MobilePanel) — should use `React.lazy()` for code splitting
- **No search debouncing** in `SearchBar.tsx` — API calls fire on every Enter press (acceptable since it's submit-based, not keystroke-based)
- **CommandPalette** filters on every keystroke without debounce — acceptable for small dataset

### State Management

- Every `dispatch()` triggers re-render of all consumers — consider `useMemo`/`useCallback` optimization in context values
- Settings loaded from IndexedDB on every mount — could cache in `localStorage` for instant hydration

### Bundle Size

- Tailwind CSS loaded from CDN (no tree-shaking) — acceptable for AI Studio deployment
- No code splitting beyond React defaults
- `@google/genai` is the only significant dependency

---

## Infrastructure Gaps

### In place (2026-05-02)

| Item | Notes |
|------|--------|
| ESLint 9 (flat `eslint.config.js`) | `npm run lint`; React Hooks rules; TypeScript recommended |
| GitHub Actions | `.github/workflows/ci.yml` — `npm ci` + `npm run ci` on push/PR |
| `package-lock.json` | Committed; reproducible installs |
| EditorConfig + VS Code extension hints | `.editorconfig`, `.vscode/extensions.json` |
| Cursor | `.cursor/rules/nexus.mdc` for workspace conventions |

### Still missing (priority order)

| Item | Priority | Effort | Impact |
|------|----------|--------|--------|
| Prettier (optional) | Medium | Low | Consistent formatting (EditorConfig covers basics) |
| Unit tests (Vitest) | High | High | Regression prevention, refactoring confidence |
| Error boundary components | Medium | Low | Graceful failure handling |
| Pre-commit hooks (Husky + lint-staged) | Medium | Low | Enforce quality before commit |
| Bundle size monitoring | Low | Low | Track growth over time |
| E2E tests (Playwright) | Low | High | Full user flow verification |

### DevContainer

Not critical for current solo-development workflow. Would become valuable if:
- Onboarding new contributors
- Standardizing Node/npm versions across machines
- Reproducing environment-specific issues

---

## Localization Assessment

**Status: Excellent (9/10)**

- Both `de.json` and `en.json` are fully synchronized with identical key structures
- 950+ translation keys covering all UI elements, notifications, errors, and prompts
- German translations are natural and idiomatic (not machine-translated quality)
- Proper use of template variables (`{{key}}`)
- No orphaned keys detected

**Potential Improvement:**
- Split monolithic locale files by feature domain for maintainability (e.g., `en/settings.json`, `en/article.json`)
- Add pluralization support if needed in future

---

## Architecture Assessment

### Strengths

- **Clean separation of concerns**: hooks (business logic), context (state distribution), services (API), state (reducers), components (UI)
- **Reducer pattern**: Predictable state updates with sub-reducers (bookmarks, history, images, paths, snapshots)
- **Hook composition**: `useNexus` orchestrates dependency ordering elegantly
- **Error handling**: Custom error classes (`ApiError`, `RateLimitError`, `OfflineError`) with exponential backoff + jitter
- **PWA architecture**: Proper manifest, adaptive icons, service worker registration

### Weaknesses

- **No error boundaries**: Component failures crash the entire app
- **Monolithic orchestrator**: `NexusProvider` handles settings, localization, and context — could be split
- **No middleware**: Cross-cutting concerns (logging, analytics, error tracking) have no hook point

---

## Recommended Roadmap

### Short-Term (Next Sprint)

1. ~~Add ESLint + CI~~ (done: ESLint 9 + GitHub Actions + `npm run ci`)
2. Add React Error Boundary component wrapping major sections
3. Add `DOMPurify.sanitize()` to all `dangerouslySetInnerHTML` usages
4. Fix race condition in `useArticleManager` image generation

### Medium-Term (1-3 Sprints)

5. Replace `dangerouslySetInnerHTML` with `react-markdown`
6. ~~GitHub Actions CI~~ (done)
7. Add Vitest with tests for services and hooks
8. Split `ArticleView.tsx` into smaller subcomponents
9. Add Zod validation for imported backup data

### Long-Term (3+ Sprints)

10. Implement `React.lazy()` code splitting for panels
11. Add Playwright E2E tests for critical user flows
12. Consider Zustand/Jotai for simpler state management
13. Split locale files by feature domain
14. Add bundle size monitoring to CI

---

## File Inventory

### Core App (7 files)
- `index.html` — Entry HTML with PWA meta tags, Tailwind CDN
- `index.tsx` — React root mount + service worker registration
- `App.tsx` — Root component with default settings
- `types.ts` — Shared TypeScript types and enums
- `vite.config.ts` — Build config with Gemini API key injection
- `tsconfig.json` — TypeScript config (ES2022, bundler resolution)
- `sw.js` — Service worker (caching strategy)

### Components (18 files)
`ArticleView`, `AthenaCopilot`, `BottomNavBar`, `CommandPalette`, `EntryPortal`, `Header`, `HelpGuide`, `IconComponents`, `LearningPathsManager`, `LoadingSpinner`, `Logo`, `MainLayout`, `MobilePanel`, `RightSidebar`, `SearchBar`, `SettingsModal`, `SynapseGraph`, `WelcomeScreen`

### Hooks (12 files)
`useArticleManager`, `useDataManager`, `useImageEditing`, `useInteractionModal`, `useNexus`, `useNotifications`, `usePanelManager`, `usePwaManager`, `useTextInteraction`, `useUserData`, `useVideoGeneration`, `types`

### Context (7 files)
`AppContext`, `ArticleContext`, `LocalizationContext`, `NexusContext`, `NexusProvider`, `UIContext`, `UIProvider`

### Services (4 files)
`dbService` (IndexedDB), `errors` (custom error classes), `geminiService` (Gemini API), `prompts` (prompt templates)

### State (6 files)
`appReducer` (root), `bookmarksReducer`, `historyReducer`, `imageLibraryReducer`, `learningPathsReducer`, `snapshotsReducer`

### Localization (2 files)
`de.json`, `en.json` — 950+ keys each, fully synchronized

### PWA & static assets (`public/`, copied verbatim to `dist/`)
`public/manifest.webmanifest`, `public/sw.js`, `public/icons/icon-192.svg`, `public/icons/icon-512.svg`, `public/icons/maskable-icon-512.svg`, `public/icons/apple-touch-icon.svg`
