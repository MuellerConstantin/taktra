# Project Overview

**taktra** is a local, single-user time tracking desktop application. Users
organize their work into projects and activities, book time on them — either
manually or via a start/stop timer — and evaluate the tracked time by project,
by tag, or by both.

taktra runs entirely on the user's machine. There is no server, no web app, no
account and no sync. Data lives in local files that the user owns and can copy,
back up or move like any other document.

## Functionality

**Profiles**
Similar to KeePass, a user can work with several independent profiles, e.g.
one for work and one for private projects. Each profile is a single SQLite file
(`*.taktra`) at a location of the user's choice. The app remembers the known
profiles and the active one; the files themselves are self-contained. Profile
name and file name are independent: the app never renames or moves a file.
A profile whose file is missing or cannot be opened stays listed as
unavailable. Deleting a profile moves its file to the operating system's trash.

**Projects, activities, tags**
Projects group activities; an activity is what time is booked on. Recurring
work needs no special modeling — it is the same activity booked again. Tags are
global and attached to activities only; every entry inherits the tags of its
activity, retroactively included.

**Time entries**
An entry is recorded with start and end, with a duration only, or by the timer.
The timer books the elapsed time rounded to whole minutes (at least one). Only
one timer runs at a time, across all profiles.

**Quick access to the timer**
The timer view is the start page with recently used activities. A sidebar
indicator shows the running timer everywhere, and a small always-on-top mini
timer shows it while the main window is minimized or covered. The app lives in
the tray; the tray icon and a configurable global shortcut open a quick start
window to search an activity and start it.

**Reports**
Tracked time is evaluated over a date range, filtered and grouped by project,
by tag, or both. Because an activity can carry several tags, per-tag sums may
overlap and must not be added up to a total.

**Sample profile**
The welcome view offers a generated sample profile for trying the app and for
development.

## Tech Stack

- **Runtime**: Electron, Node.js, TypeScript
- **UI**: React, React Router (hash router), React Aria Components with
  `tailwindcss-react-aria-components` (no shadcn/ui), Remix Icon
- **Styling**: Tailwind CSS v4, `tailwind-variants`, `tailwind-merge`
- **i18n**: `use-intl` (`en`, `de`)
- **Database**: SQLite via `better-sqlite3`, Drizzle ORM, `drizzle-kit`
- **Validation**: Zod (main process only)
- **Charts**: nivo
- **App settings**: `electron-store`

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── db/            # Connection, migrations, schema, backups, sample data
│   ├── domain/        # Data of the active profile and its IPC handlers; uses db/, never desktop/
│   └── desktop/       # Windows, tray, global shortcut; uses domain/, never db/ directly
├── preload/           # Typed `window.api` bridge
├── shared/            # Types used by main, preload and renderer
│   └── validation/    # Zod schemas per domain, text length limits
└── renderer/src/      # React UI
    ├── views/         # One component per route
    ├── components/    # Atomic Design: atoms, molecules, organisms, templates
    ├── contexts/      # Context objects and providers
    ├── hooks/
    ├── lib/           # API client and helpers
    └── messages/      # Translations
```

App-wide modules (lifecycle, IPC registration, settings, profiles) sit directly
in `src/main/`.

## Design Decisions

### Data and storage

- **One SQLite file per profile**: Gives the "open a file" experience, makes
  backups a file copy, and still allows proper SQL for reports. Files are
  marked with `PRAGMA application_id`; a key/value table holds file-level data
  such as the profile name. Which profiles exist and which one is active is app
  state in the user data directory, never inside a profile.
- **One open connection, owned by the main process**: Only the active profile
  stays open. It is closed before switching and before its file is moved to the
  trash (Windows locks open files). Other profiles are opened only briefly.
- **Drizzle schema as the source of truth**: The schema is TypeScript (one file
  per table, snake_case columns); row and input types are inferred, never
  written by hand. Schema changes go through
  `npm run db:generate -- --name <what_changed>`. Generated migrations are
  committed and never edited by hand. Until the first release they may be
  squashed into a single `init` migration; afterwards they are immutable.
- **Own migration runner instead of drizzle's `migrate()`**: drizzle runs
  migrations inside a transaction, where the `PRAGMA foreign_keys=OFF` that
  drizzle-kit emits for table rebuilds has no effect, so rebuilds would cascade
  deletes into child tables. The runner follows SQLite's procedure for schema
  changes (foreign keys off outside the transaction, `foreign_key_check` before
  commit) and keeps drizzle's bookkeeping table. A failed migration leaves the
  file unchanged; existing profiles are backed up before they are migrated.
- **No indexes on expressions**: drizzle-kit writes them as column names when it
  rebuilds a table, which breaks the generated migration.
- **Migration state is the file format version**: A profile with a migration
  newer than this app knows is refused instead of opened, because an older app
  could corrupt a schema it does not know.
- **Names compared in JavaScript, not SQLite**: SQLite's `lower()` and `NOCASE`
  only fold ASCII. Named entities therefore store a normalized name key, set on
  every write of the name, and are unique on that key. Lists are sorted by name
  in the main process with `Intl.Collator`, not with `ORDER BY`.
- **Times in UTC, days in local time**: Clock times are stored as UTC with the
  timezone they were recorded in, and each entry stores the local date it
  counts towards. Reports sum durations only, however an entry was recorded.
- **Running timer persisted in the database**: A running timer is an entry
  without an end, so it survives crashes and restarts. It cannot be edited
  while it runs and is stopped before the active profile changes.
- **Archive instead of delete**: Anything with booked time is archived, never
  deleted, so historic reports stay complete.
- **Text length limits on three levels**: Inputs set `maxLength`, the Zod
  schemas reject longer values, and check constraints in the database are the
  last line of defence. The limits are defined once in `shared/validation/`.
- **App settings outside the database**: Preferences of the installation
  (theme, language, mini timer, global shortcut) live in an `electron-store` in
  the user data directory and reach the renderer only through the API.
  `electron-store` is ESM-only and must stay bundled into the CJS main build.
- **No native rebuild**: `better-sqlite3` ships prebuilt, ABI-stable binaries,
  so `postinstall` must not run `electron-builder install-app-deps`.

### Main and renderer

- **Database and Node APIs only in the main process**: The renderer runs
  sandboxed with context isolation and talks to main only through the typed
  preload API. UI code uses the client in `lib/api.ts`, not `window.api`.
- **Validated IPC**: Every handler is registered through `handle()` with a Zod
  schema for its arguments, never with `ipcMain.handle` directly. The schemas
  also normalize input (trim text, empty optional text to `null`). Rules that
  need the database stay in the main process. The renderer imports only types
  and the limits from `shared/`, never the schemas, so Zod stays out of its
  bundle.
- **Uniform errors with codes**: Errors the user may see are thrown as
  `AppError` with a code from `shared/errors.ts` and translated in the renderer
  under `Errors.<CODE>`. Unexpected errors are logged and reach the UI as
  `UNKNOWN`. Expected outcomes that are not errors (e.g. a canceled dialog) are
  returned as values.
- **Main broadcasts, windows reload**: When state that several windows show
  changes (running timer and what it displays, app settings), the main process
  sends an event to all windows and each one reloads what it needs.
- **Several windows, one renderer**: The mini timer and the quick start are
  routes of the same renderer, opened as small frameless windows with the same
  preload and sandbox settings as the main window.
- **Tray app, single instance**: Closing the main window hides it; the app
  quits from the tray. A second start brings the running instance to the
  front, so two instances never work on the same files.
- **Cross-platform code, Windows packaging first**: Code must not assume an OS:
  paths come from Electron and generated file names are valid on Windows, macOS
  and Linux. Only packaging is configured for Windows so far.

### UI

- **No active profile is a first-class state**: All profile-dependent routes
  render the welcome view (create or open a profile) instead while no profile
  is usable. App settings stay reachable.
- **Hash routing**: The packaged app loads `index.html` via `file://`, where
  path-based URLs would resolve to files on disk.
- **Theme via semantic tokens**: Colors, radii and shadows are CSS variables
  for light and dark, exposed to Tailwind. Components use only these tokens,
  never raw palette colors. The primary color is `#a855f7`; neutrals carry a
  faint tint of its hue.
- **Dark mode via `nativeTheme`**: The theme setting is applied in the main
  process, which drives `prefers-color-scheme` in all windows and native UI.
  The renderer never toggles classes itself.
- **i18n from the start**: No hardcoded UI strings. English is the reference:
  translation keys are typed against `en.json`, so a missing key fails the
  typecheck.
- **Atomic Design**: Components follow the structure of tarvello. Atoms wrap
  react-aria-components with the theme styling; everything above uses atoms
  instead of styling react-aria primitives directly. Components use named
  exports.
- **Context, provider and hook in separate files**: The `react-refresh` lint
  rule allows only component exports per file.
- **Shortcuts**: In-app shortcuts are a static, non-configurable list shown in
  tooltips and the controls settings. The only global shortcut opens the quick
  start; it can be turned off and re-recorded.

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
