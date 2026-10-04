# Project Overview

**taktra** is a local, single-user time tracking desktop application. Users
organize their work into projects and activities, book time on them — either
manually or via a start/stop timer — and evaluate the tracked time by project,
by tag, or by both.

taktra runs entirely on the user's machine. There is no server, no web app, no
account and no sync. Data lives in local database files that the user owns and
can copy, back up or move like any other document.

## Functionality

**Profiles**
Similar to KeePass, a user can work with several independent profiles — for
example one for work and one for private projects. Each profile is a single
SQLite file (`*.taktra`) at a location of the user's choice, by default
`profiles/` in the user data directory. The app remembers the known profiles and the
active one; the files themselves are self-contained. Besides creating a new
profile, an existing `*.taktra` file can be opened; it is only accepted if its
`application_id` and stored name identify it as a Taktra profile. A profile
whose file was moved, deleted or cannot be opened stays listed as unavailable;
selecting it offers to remove it from the list, which never touches any file.

Profile name and file name are independent, as in KeePass. When creating a
profile, the file name is only a suggestion — a slug of the profile name — and
can be changed freely. Renaming a profile later only changes the name stored in
the file; the file itself is never renamed or moved by the app.

Deleting a profile moves its file (and any SQLite sidecar files) to the
operating system's trash instead of erasing it, so a mistake can be undone. If
the deleted profile was active, the next available profile becomes active.

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
  booked automatically, rounded to whole minutes (at least one). Only one
  timer can run at a time, across all profiles: starting a new one stops the
  running one, and switching the active profile stops and books it first.

**Quick access to the timer**
The timer view is the start page: it shows the running timer and the recently
used activities for one-click start. A sidebar indicator shows the running
timer in every view. While the main window is minimized or covered, a small
always-on-top mini timer shows it. Closing the main window only hides it; the
app keeps running in the tray. The tray icon (left click) and a configurable
global shortcut (default Ctrl/Cmd+Alt+T) open a centered quick start window
to search an activity and start its timer. In-app shortcuts are a fixed list,
shown read-only in the controls settings and in button tooltips.

**Sample profile**
The welcome view offers a sample profile with ten projects, fifteen tags and
two years of generated bookings, for trying the app and for development.

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
- **Database**: SQLite via `better-sqlite3`, Drizzle ORM, `drizzle-kit` for migrations
- **Validation**: Zod (main process only)
- **Charts**: nivo (`@nivo/bar`, `@nivo/pie`)
- **App Settings**: `electron-store`

## Project Structure

```
.
├── src/
│   ├── main/                         # Electron main process
│   │   ├── index.ts                  # App lifecycle, single instance, wires up all modules
│   │   ├── ipc.ts                    # handle(): IPC registration with Zod argument validation and uniform error responses
│   │   ├── constants.ts              # Main-process constants (application id, …)
│   │   ├── settings.ts               # App settings store, IPC handlers, theme
│   │   ├── profiles.ts               # Known profiles store, profile lifecycle, IPC handlers
│   │   ├── db/
│   │   │   ├── schema/               # Drizzle schema, one file per table (properties, …)
│   │   │   ├── migrations/           # Generated by `npm run db:generate`, committed, never edited by hand
│   │   │   ├── database.ts           # Open/validate/migrate profile files, active connection
│   │   │   ├── backup.ts             # Backup of a profile before it is migrated
│   │   │   ├── errors.ts             # SQLite error helpers (unique violation)
│   │   │   └── sample.ts             # Sample profile data
│   │   ├── domain/                   # Data of the active profile; uses db/, never desktop/
│   │   │   ├── projects.ts, activities.ts, tags.ts, timeEntries.ts, reports.ts
│   │   │   │                         # Queries on the active profile, IPC handlers
│   │   │   ├── timer.ts              # Running timer, recent activities
│   │   │   ├── timerEvents.ts        # timer:changed broadcast to all windows and main listeners
│   │   │   └── names.ts              # Name keys for case-insensitive uniqueness, sorting by app language
│   │   └── desktop/                  # Windows and OS integration; uses domain/, never db/ directly
│   │       ├── windows.ts            # createRendererWindow(), main window registry
│   │       ├── miniTimer.ts          # Mini timer window shown while the main window is hidden
│   │       ├── quickStart.ts         # Quick start window (tray click, global shortcut)
│   │       ├── tray.ts               # Tray icon and menu
│   │       └── shortcuts.ts          # Global shortcut registration
│   ├── preload/                      # Bridge between main and renderer
│   │   ├── index.ts                  # Exposes the typed `window.api` (invokers and `events`)
│   │   └── global.d.ts               # Global typing for `window.api`
│   ├── shared/                       # Types shared by main, preload and renderer (incl. errors.ts)
│   │   └── validation/               # Zod schemas per domain, limits.ts with text length limits
│   └── renderer/                     # React UI
│       ├── index.html                # Entry HTML incl. Content-Security-Policy
│       └── src/
│           ├── main.tsx              # React entry point
│           ├── main.css              # Tailwind entry, plugins and theme tokens
│           ├── router.tsx            # Route definitions (main window, /mini, /quick)
│           ├── views/                # One component per route; nested routes in subfolders
│           │   └── settings/
│           │       ├── app/          # App settings (/settings): appearance, controls
│           │       └── profile/      # Settings of the active profile (/profile): name, …
│           ├── contexts/             # Context objects and providers (settings, locale, profiles, timer)
│           ├── lib/                  # api.ts (typed client over window.api), shortcuts, periods, report data, formatting
│           ├── hooks/                # React hooks (e.g. useSettings, useErrorMessage, useShortcut)
│           ├── messages/             # Translations (en.json, de.json)
│           ├── i18n.d.ts             # Types translation keys against en.json
│           └── components/           # UI components (Atomic Design)
│               ├── atoms/            # Styled react-aria wrappers (Button, Field, Menu, Select, …), utils.ts and shared tv styles in styles.ts
│               ├── molecules/        # Composed components (ViewHeader, ProfileSwitcher, charts, dialogs, …)
│               ├── organisms/        # Full sections (Sidebar, ReportBreakdown)
│               └── templates/        # Layouts (AppTemplate, ProfileTemplate, TabViewTemplate)
├── build/                            # Build resources for electron-builder (icons)
├── resources/                        # Runtime assets shipped with the app
├── drizzle.config.ts                 # drizzle-kit config (schema path, migrations folder, casing)
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
- **One SQLite file per profile**: Gives the KeePass-like "open a file"
  experience, makes backups a file copy, and still allows proper SQL for
  reports. The file type is marked with `PRAGMA application_id` (`0x54414B54`,
  "TAKT"). A key/value table `properties` holds file-level data such as the
  profile name, so a copied or renamed file keeps its name. Which profiles exist and
  which one is active is app state in `profiles.json` in the user data
  directory (own `electron-store`, separate from user settings), never inside a
  profile.
- **Drizzle ORM on `better-sqlite3`**: The schema is TypeScript code in
  `src/main/db/schema/` (one file per table, camelCase in code, snake_case
  columns via `casing: 'snake_case'`); row types are inferred from it, never
  written by hand. Schema changes go through
  `npm run db:generate -- --name <what_changed>` (snake_case, e.g. `add_projects`), which writes a SQL migration
  to `src/main/db/migrations/` (the `meta/` folder there is drizzle-kit's
  bookkeeping: `_journal.json` orders the migrations, the snapshots are diffed
  for the next one). Generated migrations are committed and never edited by
  hand; until the first release they may be squashed into a single `init`
  migration, afterwards they are immutable. Every profile is migrated when it
  is opened; packaged builds ship the migrations as an extra resource.
  Migrations are not run by drizzle's `migrate()`: it executes them inside a
  transaction, where the `PRAGMA foreign_keys=OFF` emitted by drizzle-kit for
  table rebuilds has no effect, so dropping the old table would cascade deletes
  into child tables. `database.ts` follows SQLite's procedure for schema
  changes instead: foreign keys off before the transaction, all pending
  migrations in one transaction, `PRAGMA foreign_key_check` before the commit,
  bookkeeping in drizzle's `__drizzle_migrations` table. A failed migration
  leaves the file unchanged. Before an existing profile is migrated, a copy is
  written to `backups/<profile uid>/` in the user data directory via
  `VACUUM INTO`, keeping the newest three per profile, so a migration that
  succeeds but damages data can be undone by opening or copying the backup.
  Indexes on expressions are avoided: drizzle-kit quotes them as column names
  when it rebuilds a table, which breaks the generated migration.
- **Migration state is the file format version**: There is no separate
  version number. A profile that contains a migration newer than the newest
  one this app knows was written by a newer Taktra version; it is refused
  (shown as unavailable, "newer version") instead of being opened, because an
  older app could corrupt a schema it does not know.
  `better-sqlite3` (v13+) ships prebuilt, ABI-stable binaries for Windows,
  macOS and Linux, so no compiler or per-Electron rebuild is needed — which is
  also why `postinstall` must not run `electron-builder install-app-deps`.
- **One open connection, owned by the main process**: Exactly the active
  profile is kept open (`src/main/db/database.ts`); switching profiles closes
  it before opening the next, and it is closed before the file is moved to the
  trash (Windows locks open files). Other profiles are opened only briefly, for
  example read-only to show their name.
- **App settings outside the database**: Preferences that belong to the
  installation (theme, language, mini timer, global shortcut) live in
  `settings.json` in the user data directory, not in a database file. They are owned by
  the main process via `electron-store` (JSON schema validation, defaults,
  atomic writes, version migrations) and reach the renderer only through
  `window.api.settings`. The `Settings` type lives in `src/shared/` and is used
  by main, preload and renderer alike. `electron-store` is ESM-only and is
  therefore bundled into the CJS main build (`externalizeDeps.exclude`). The
  mini timer position is window state in its own `mini-timer.json`.
- **Database access only in the main process**: The renderer never touches
  SQLite or Node APIs. It talks to the main process through a typed API
  exposed in the preload script via `contextBridge`. The renderer runs with
  `sandbox` and `contextIsolation` enabled.
- **Validated IPC arguments**: Every IPC handler is registered through
  `handle(channel, z.tuple([...]), fn)` with a Zod schema for its arguments;
  invalid arguments are rejected with `VALIDATION_FAILED` before the handler
  runs and the reason is logged. The schemas live in `src/shared/validation/`
  (one file per domain); they also trim text, turn empty optional text into
  `null` and normalize colors, and the input types (`ProjectInput`, …) are
  inferred from them instead of written by hand. Business rules that need the
  database (existence, name collisions, end after start) stay in the main
  process modules. The renderer imports only types and `validation/limits.ts`,
  never the schema index, so Zod stays out of the renderer bundle.
- **Text length limits on three levels**: Names are limited to 50 characters,
  project descriptions to 500 and notes to 2000 (`validation/limits.ts`).
  Inputs set `maxLength`, the Zod schemas reject longer values, and check
  constraints in the database are the last line of defence.
- **Uniform errors with codes**: Errors the user may see are thrown in the main
  process as `AppError` with a code from `src/shared/errors.ts`. IPC handlers
  are registered through `handle()` (`src/main/ipc.ts`), never `ipcMain.handle`
  directly; it turns every result into `{ ok, value }` or `{ ok: false, error:
{ code } }` and maps unexpected errors to `UNKNOWN` after logging them, so no
  internals reach the UI. Error classes do not survive IPC or `contextBridge`,
  which is why preload passes these plain objects through and the renderer
  client in `lib/api.ts` turns failures back into `AppError`. UI code uses
  `api` from `lib/api.ts`, not `window.api`, and shows errors via
  `useErrorMessage`, which translates the code from `messages/*.json`
  (`Errors.<CODE>`). Expected outcomes that are not errors (e.g. a canceled
  file dialog) are returned as values such as `null`.
- **Times in UTC, days in local time**: Clock times are stored as UTC together
  with the timezone they were recorded in. Each entry additionally stores the
  local date it counts towards, so entries without clock times and entries
  across midnight are attributed unambiguously.
- **Duration as the single source of truth for reports**: Aggregations sum
  `duration_sec` only, regardless of whether an entry was recorded with clock
  times, as a duration, or by the timer.
- **Running timer persisted in the database**: A running timer is a time entry
  without an end, so it survives crashes, restarts and standby. It counts
  towards the day it was started and cannot be edited while it runs. The main
  process enforces one running timer across profiles by stopping it before
  the active profile changes. After every change to the timer, and to the
  names, colors and tags it displays, it sends `timer:changed` to all windows
  (`events.onTimerChanged` in the renderer), so the main window, the mini
  timer and the quick start stay in sync.
- **Several windows, one renderer**: The mini timer (`/mini`) and the quick
  start (`/quick`) are routes of the same renderer, opened as small frameless
  windows through `createRendererWindow()` with the same preload and sandbox
  settings as the main window, on transparent backgrounds
  (`.transparent-window`). The main window reports its page visibility, so
  the mini timer also appears when the window is covered (Windows, macOS).
- **Tray app, single instance**: Closing the main window hides it; the app
  quits from the tray menu (or Cmd+Q). A second start quits immediately and
  brings the running instance to the front, so two instances never work on
  the same profile and settings.
- **Shortcuts**: In-app shortcuts are a static list in `lib/shortcuts.ts`,
  bound with `useShortcut` (single keys are ignored while typing or with a
  dialog open) and shown in tooltips via the button's `shortcut` prop. The
  only global shortcut opens the quick start; it can be turned off and
  re-recorded, and a new one is saved only if it can be registered.
- **Names compared in JavaScript, not SQLite**: SQLite's `lower()` and
  `NOCASE` only fold ASCII, so "Ärger" and "ärger" would count as different
  names and sort after "Zoo". Projects, activities and tags therefore store a
  `nameKey` (`toNameKey()` in `names.ts`: NFC, lower case, independent of the
  app language), and their unique indexes are on that column. Every write of a
  name sets it. Lists sorted by name are sorted in the main process with an
  `Intl.Collator` for the app language instead of `ORDER BY`.
- **Archive instead of delete**: Anything with booked time is archived, never
  deleted, so historic reports stay complete.
- **Cross-platform code, Windows packaging first**: Code must not assume a
  specific OS — paths come from Electron (`app.getPath('userData')` is
  `%APPDATA%\taktra` on Windows, `~/Library/Application Support/taktra` on
  macOS, `~/.config/taktra` on Linux) and generated file names avoid anything
  invalid on any of the three systems. Only packaging is configured for Windows
  so far.
- **No active profile is a first-class state**: On first start (and whenever the
  active profile's file is missing) there is no usable profile. All
  profile-dependent routes sit below `ProfileTemplate`, which renders the
  `WelcomeView` (create or open a profile) instead of the route. The matching
  sidebar entries are disabled. App settings stay reachable without a profile.
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
  follows the operating system live. The renderer never toggles classes itself. The window's
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
