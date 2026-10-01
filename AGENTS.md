# Project Overview

**taktra** is a local, single-user time tracking desktop application. Users
organize their work into projects and activities, book time on them — either
manually or via a start/stop timer — and evaluate the tracked time by project,
by tag, or by both.

taktra runs entirely on the user's machine. There is no server, no web app, no
account and no sync. Data lives in local database files that the user owns and
can copy, back up or move like any other document.

## Functionality

**Databases**
Similar to KeePass, a user can work with several independent "databases" — for
example one for work and one for private projects. Each database is a single
SQLite file. The app remembers recently opened files, but the files themselves
are self-contained.

**Projects & Activities**
Projects group activities. An activity is the thing time is booked on (e.g.
"Daily Standup" in project "Customer X"). Recurring work needs no special
modeling: a daily meeting is simply the same activity booked again each day,
and every booking carries its own date, time and duration.

**Time Entries**
Every piece of tracked time is a time entry on an activity. Entries can be
recorded in three ways:

- **Start and end** — a manual entry with clock times; duration is derived
- **Duration only** — a manual entry with a date and a duration, no clock times
- **Timer** — clock in on an activity, clock out later; the elapsed time is
  booked automatically. Only one timer can run at a time; starting a new one
  stops the running one.

**Tags**
Tags are global and cut across projects (e.g. `meeting`, `support`). They are
attached to activities only, never to individual entries — every entry
inherits the tags of its activity, retroactively included.

**Reports**
Tracked time can be evaluated over a date range, filtered and grouped by
project, by tag, or by project and tag combined. Because an activity can carry
several tags, per-tag sums may overlap and must not be added up to a total.

## Tech Stack

- **Runtime**: Electron 44+, Node.js 24+, TypeScript 6+
- **UI**: React 19+
- **Routing**: React Router 8+ (hash router)
- **i18n**: `use-intl` (currently `en` and `de`)
- **Styling**: Tailwind CSS v4+, `tailwind-variants` for component variants, `tailwind-merge`
- **UI Components**: React Aria Components with `tailwindcss-react-aria-components`
  (no shadcn/ui)
- **Icons**: Remix Icon via `@remixicon/react`
- **Database**: SQLite
- **App Settings**: `electron-store`

## Project Structure

```
.
├── src/
│   ├── main/                         # Electron main process
│   │   ├── index.ts                  # App lifecycle, window creation
│   │   └── settings.ts               # App settings store, IPC handlers, theme
│   ├── preload/                      # Bridge between main and renderer
│   │   ├── index.ts                  # Exposes the typed `window.api`
│   │   └── global.d.ts               # Global typing for `window.api`
│   ├── shared/                       # Types shared by main, preload and renderer
│   └── renderer/                     # React UI
│       ├── index.html                # Entry HTML incl. Content-Security-Policy
│       └── src/
│           ├── main.tsx              # React entry point
│           ├── main.css              # Tailwind entry, plugins and theme tokens
│           ├── router.tsx            # Route definitions
│           ├── views/                # One component per route; nested routes in subfolders (settings/)
│           ├── contexts/             # Context objects and providers (settings, locale)
│           ├── hooks/                # React hooks (e.g. useSettings reading the settings context)
│           ├── messages/             # Translations (en.json, de.json)
│           ├── i18n.d.ts             # Types translation keys against en.json
│           └── components/           # UI components (Atomic Design)
│               ├── atoms/            # Styled react-aria wrappers (Field, RadioGroup, Select, …) and utils.ts
│               ├── molecules/        # Composed components (ViewHeader, ViewPlaceholder)
│               ├── organisms/        # Full sections (Sidebar)
│               └── templates/        # Layouts (AppTemplate: sidebar + route outlet)
├── build/                            # Build resources for electron-builder (icons)
├── resources/                        # Runtime assets shipped with the app
├── electron.vite.config.ts
├── electron-builder.yml
├── eslint.config.mjs
├── tsconfig.json                     # References tsconfig.node / tsconfig.web
├── tsconfig.node.json                # main + preload
├── tsconfig.web.json                 # renderer
└── package.json
```

## Design Decisions

- **Local-first, no backend**: Everything runs on the user's machine. No
  network access is required for any feature.
- **One SQLite file per database**: Gives the KeePass-like "open a file"
  experience, makes backups a file copy, and still allows proper SQL for
  reports. Schema versions are tracked with `PRAGMA user_version`, the file
  type is marked with `PRAGMA application_id`.
- **App settings outside the database**: Preferences that belong to the
  installation (recent files, theme, window state) live in
  `%APPDATA%\taktra\settings.json`, not in a database file. They are owned by
  the main process via `electron-store` (JSON schema validation, defaults,
  atomic writes, version migrations) and reach the renderer only through
  `window.api.settings`. The `Settings` type lives in `src/shared/` and is used
  by main, preload and renderer alike. `electron-store` is ESM-only and is
  therefore bundled into the CJS main build (`externalizeDeps.exclude`).
- **Database access only in the main process**: The renderer never touches
  SQLite or Node APIs. It talks to the main process through a typed API
  exposed in the preload script via `contextBridge`. The renderer runs with
  `sandbox` and `contextIsolation` enabled.
- **Times in UTC, days in local time**: Clock times are stored as UTC together
  with the timezone they were recorded in. Each entry additionally stores the
  local date it counts towards, so entries without clock times and entries
  across midnight are attributed unambiguously.
- **Duration as the single source of truth for reports**: Aggregations sum
  `duration_sec` only, regardless of whether an entry was recorded with clock
  times, as a duration, or by the timer.
- **Running timer persisted in the database**: A running timer is a time entry
  without an end, so it survives crashes, restarts and standby.
- **Archive instead of delete**: Anything with booked time is archived, never
  deleted, so historic reports stay complete.
- **Windows first**: The app is built and tested for Windows. macOS and Linux
  packaging is not configured.
- **Hash routing**: The packaged app loads `index.html` via `file://`, where
  path-based URLs would resolve to files on disk. React Router therefore uses a
  hash router. react-aria's `RouterProvider` is wired to React Router in
  `AppTemplate`, so react-aria `Link`s navigate client-side.
- **Theme via CSS variables**: Colors, radii and shadows are semantic tokens
  (`--primary`, `--muted-foreground`, …) defined in `main.css` for light and
  for `prefers-color-scheme: dark`, and exposed to Tailwind through `@theme`
  (`bg-primary`, `text-muted-foreground`, …). Components use these tokens
  only, never raw Tailwind palette colors, so light/dark and future palette
  changes happen in one place. The primary color is `#a855f7`; neutrals carry
  a faint tint of its hue.
- **i18n from the start**: All user-facing strings live in
  `src/renderer/src/messages/` and are read via `useTranslations`. No hardcoded
  UI strings in components. English is the default and the reference: keys are
  typed against `en.json`, so a missing or misspelled key fails the typecheck.
  The language is an app setting; `LocaleProvider` feeds it to `use-intl`,
  react-aria's `I18nProvider` and `<html lang>`.
- **Atomic Design**: Components follow the structure of tarvello — atoms,
  molecules, organisms, templates. Atoms wrap react-aria-components with the
  theme styling, built with `tailwind-variants` and the helpers in
  `atoms/utils.ts` (`focusRing`, `composeTailwindRenderProps`). Views and
  higher-level components use these atoms instead of styling react-aria
  primitives directly. Components use named exports.
- **Context, provider and hook in separate files**: The `react-refresh` lint
  rule only allows component exports per file, so a context object lives in
  `contexts/XContext.ts`, its provider in `contexts/XProvider.tsx`, and the
  consuming hook in `hooks/useX.ts`.
- **Dark mode via `nativeTheme`**: The theme setting (`system` | `light` |
  `dark`, default `system`) is applied in the main process through
  `nativeTheme.themeSource`. That drives `prefers-color-scheme` in the
  renderer as well as native UI (menus, dialogs, scrollbars), and `system`
  follows Windows live. The renderer never toggles classes itself. The window's
  `backgroundColor` matches the theme so there is no light flash on startup.

## Coding Principles

- **KISS**: Prefer the simplest solution that works. Avoid unnecessary abstractions – extract only after the third repetition (Rule of Three).
- **DRY**: Define logic once, import everywhere. Duplicated code is a maintenance liability.
- **YAGNI**: Don't build features or abstractions on speculation. Implement what's needed now.
- **Single Responsibility**: Each function, component, and module has one clear purpose.
- **Fail Fast**: Validate inputs early, throw meaningful errors immediately. Never swallow exceptions silently.
- **Guard Clauses over Nesting**: Prefer early returns over deeply nested `if/else` blocks.
- **Immutability by Default**: Use `const`, `readonly`, and spread operators. Avoid mutation unless there's a clear performance reason.
- **Explicit over Implicit**: Prefer explicit parameters and return types over hidden assumptions or side effects.
- **No Comment Spam**: Document _why_, not _what_. Docstrings on public APIs are welcome; `// increment counter` before `counter += 1` is not.

## General Instructions

- Never dig into node_modules – if you need to understand a dependency, read its docs or types, not its source. If something seems broken, check imports,
  versions, and your own code first. If you need still additional information just ask me.
- Prefer reading before writing – understand the existing structure before generating new files or refactoring. Don't assume conventions; verify them.
- Don't fix what you didn't break – scope changes strictly to what was asked. No opportunistic refactors, formatting fixes, or "while I'm here" changes. But if
  you find something feel free to tell me.
- One task at a time – complete and verify the current task before moving to the next. Don't batch unrelated changes in one go.
- Comments explain the code and the decisions behind it – why an approach was
  chosen over an alternative, what a non-obvious constraint is, what would break
  if it were done differently. They are not the place for business rationale,
  market reasoning, measurements, or the discussion that led to a change. Those
  belong in the commit message, the docs or the issue. In particular: do not
  carry justifications from our conversation into the code just because they
  were convincing at the time.
- Verify changes with `npm run typecheck`, `npm run lint` and
  `npm run format` before considering a task done.
