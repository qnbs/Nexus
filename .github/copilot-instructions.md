# Nexus — Copilot Workspace Instructions

## Project Overview

Nexus is an AI-powered knowledge exploration app — a dynamic cognitive partner that transforms learning into an interconnected discovery journey. It is a **client-side-only** React application deployed on Google AI Studio.

## Tech Stack

- **Framework:** React 18.2 with TypeScript 5.8
- **Build:** Vite 6.2, no SSR
- **Styling:** Tailwind CSS (loaded via CDN, utility-first)
- **AI Backend:** Google Gemini API (`@google/genai`)
  - Text: `gemini-2.5-flash`
  - Images: `imagen-4.0-generate-001`
  - Image editing: `gemini-2.5-flash-image`
  - Video: `veo-3.1-fast-generate-preview`
- **Storage:** Browser IndexedDB via custom `dbService`
- **PWA:** Service worker + manifest + adaptive icons

## Architecture

```
index.tsx → NexusProvider → App → MainLayout → Components
```

### Patterns

- **State:** `useReducer` + React Context with sub-reducers (`state/reducers/`)
- **Business Logic:** Custom hooks in `hooks/` — orchestrated by `useNexus`
- **API Layer:** `services/geminiService.ts` with exponential backoff + jitter retry
- **Errors:** Custom error classes in `services/errors.ts` (`ApiError`, `RateLimitError`, `OfflineError`)
- **Localization:** JSON-based i18n via `LocalizationContext` (DE/EN)

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `components/` | React UI components (functional, with React.memo where needed) |
| `hooks/` | Custom hooks encapsulating business logic |
| `context/` | React Context providers and type definitions |
| `services/` | API services, DB abstraction, error classes, prompt templates |
| `state/` | Root reducer + feature-specific sub-reducers |
| `locales/` | Translation JSON files (de.json, en.json) |
| `icons/` | PWA SVG icons |

## Code Conventions

### TypeScript
- Use **enums** for fixed option sets (see `types.ts`: `Language`, `AccentColor`, `FontFamily`, etc.)
- Use **interfaces** for data shapes, **types** for unions/intersections
- Avoid `any` — define interfaces for external APIs when possible
- Path alias: `@/*` maps to project root

### React
- **Functional components only** — no class components
- Use `React.memo()` for list items and expensive renders
- Use `useCallback`/`useMemo` for handler stability in context values
- Custom hooks encapsulate all business logic — components are thin UI shells

### Styling
- Tailwind CSS utility classes exclusively — no CSS modules, no styled-components
- Dark theme by default (`bg-gray-950`, `text-gray-100`, etc.)
- Accent colors configurable via settings (amber, sky, rose, emerald)

### Localization
- All user-facing strings MUST come from locale files (`locales/de.json`, `locales/en.json`)
- Use template variables: `{{variableName}}` in translation strings
- Both locale files MUST stay synchronized — every key in `en.json` must exist in `de.json` and vice versa
- Access via `useLocalization()` hook → `t('key.path')`

### Naming
- Components: `PascalCase` (`ArticleView.tsx`)
- Hooks: `camelCase` with `use` prefix (`useArticleManager.ts`)
- Services: `camelCase` (`geminiService.ts`)
- Reducers: `camelCase` with `Reducer` suffix (`bookmarksReducer.ts`)
- Types/Interfaces: `PascalCase` (`ArticleData`, `LearningPath`)
- Enums: `PascalCase` with `PascalCase` members (`Language.English`)

## Build & Dev

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

**Environment:** Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.

## Known Architectural Limitations

- **API key is client-side**: Required by Google AI Studio's client-only deployment model. No backend proxy available.
- **No server-side rendering**: Pure SPA architecture.
- **Tailwind via CDN**: No tree-shaking; acceptable for AI Studio deployment.

## Security Notes

- Never log or expose API keys in console output
- `dangerouslySetInnerHTML` is used for API response rendering — always sanitize if source changes
- Validate imported user data (backup JSON) against expected schema
- All data stays in user's browser (IndexedDB) — no server-side data storage
