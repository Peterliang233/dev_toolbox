# Repository Guidelines

## Project Structure & Module Organization

- `src/popup/`: React UI for the extension popup (entry: `src/popup/main.tsx`, main UI: `src/popup/App.tsx`, tools: `src/popup/tools/*.tsx`).
- `src/background/`: Manifest V3 service worker entry (`src/background/main.ts`).
- `src/tools/`: Pure transformation logic (timestamp/json/text-list/escape). Prefer adding reusable logic here and keeping UI thin.
- `src/shared/`: Shared utilities (e.g. `storage`, `clipboard`) used by UI/background.
- `public/`: Static extension assets, including `public/manifest.json` and `public/icons/`.
- Build output goes to `dist/` (ignored by git).

## Build, Test, and Development Commands

- `npm i`: install dependencies.
- `npm run dev`: run Vite dev server for UI preview (not the extension runtime).
- `npm run build`: generate placeholder icons (`scripts/generate-icons.mjs`) and build the extension into `dist/`.
- `npm run preview`: serve the production build locally for a quick check.
- `npm test`: run unit tests via Vitest (`vitest run`).

Extension debugging flow:
1. `npm run build`
2. Visit `chrome://extensions` -> enable Developer Mode -> Load unpacked -> select `dist/`
3. After changes: rebuild and click Reload on the extension.

## Coding Style & Naming Conventions

- Language: TypeScript (strict) + React (function components).
- Indentation: 2 spaces; strings use double quotes; keep changes consistent with nearby code.
- Naming: React components in `PascalCase` (e.g. `TimestampTool.tsx`), utilities/functions in `camelCase`.
- No ESLint/Prettier config is currently enforced; avoid drive-by formatting.

## Testing Guidelines

- Framework: Vitest.
- Put unit tests next to logic modules, using `*.test.ts` (examples: `src/tools/timestamp.test.ts`).
- Focus tests on `src/tools/*` (pure logic) and edge cases (invalid input, timezone/unit inference, etc.).

## Commit & Pull Request Guidelines

- Git history currently uses short, imperative, lowercase messages (e.g. `add chrome extension`). Keep messages brief and action-oriented.
- PRs should include:
- Description: what changed and why.
- Testing: include `npm test` and extension load/unpacked steps.
- UI changes: screenshots of the popup.

## Security & Release Artifacts

- Do not commit build artifacts: `dist/`, `release.zip`, `*.crx`, `*.pem` are ignored by `.gitignore`.
- Publishing/packaging details live in `PUBLISHING.md`.
