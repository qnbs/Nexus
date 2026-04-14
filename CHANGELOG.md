# Changelog

All notable changes to Nexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-14

### Added

- **Real-time article synthesis** powered by `gemini-2.5-flash` with configurable depth (Concise, Standard, In-Depth).
- **AI image generation** via `imagen-4.0-generate-001` with four styles: Photorealistic, Artistic, Vintage, Minimalist.
- **In-situ AI image editing** using `gemini-2.5-flash-image` with natural language prompts.
- **Video generation** via `veo-3.1-fast-generate-preview` for article sections.
- **Athena AI Copilot** — context-aware chat assistant with full article comprehension.
- **Synapse Graph** — interactive related-topics visualization with configurable density.
- **Cosmic Leap** — serendipity engine for surprising topic discovery.
- **Text interaction tools** — highlight text to Define, Explain, or Visualize inline.
- **Multi-faceted summaries** — TL;DR, ELI5, Key Points, and Analogy modes.
- **Learning Paths** — curate and track custom article collections with progress.
- **Session Snapshots** — save/restore complete session state (article, chat, graph).
- **Bookmarks & History** — persistent article tracking with IndexedDB.
- **Command Palette** (Cmd/Ctrl+K) — quick access to all app actions.
- **Full localization** — German (de) and English (en) with 950+ translation keys.
- **PWA support** — installable with service worker, manifest, and adaptive icons.
- **Data portability** — full export/import of user profile as JSON.
- **Deep customization** — accent color, font family, text size, article length, image style.
- **Responsive design** — desktop sidebar + mobile bottom panel layout.
- **IndexedDB persistence** — offline-capable client-side storage for all user data.
- `.env.example` for environment variable documentation.
- `AUDIT.md` — comprehensive codebase audit and improvement roadmap.
- `.github/copilot-instructions.md` — Copilot workspace instructions.
- `CHANGELOG.md` following Keep a Changelog standard.

### Fixed

- **Critical**: Fixed `charset="utf-t-8"` typo in `index.html` (should be `utf-8`).
- **Critical**: Fixed broken import path in `useVideoGeneration.ts` (`../../services/errors` → `../services/errors`) that caused build failure.
- Expanded `.gitignore` to cover OS files, IDE configs, logs, and coverage output.

### Changed

- Bumped version from `0.0.0` to `1.0.0` to reflect production-ready status.

[Unreleased]: https://github.com/qnbs/Nexus/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/qnbs/Nexus/releases/tag/v1.0.0
