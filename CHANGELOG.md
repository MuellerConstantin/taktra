# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Custom fields for extra details such as an order number, a cost center or a ticket number. A
  field belongs to projects, clients or activities and is free text or a select list. Fields are
  managed in the profile settings and filled in on the project, client or activity. Fields and
  options with values are archived instead of deleted.
- Export templates choose the columns of the file, their order and names, custom fields included.
  Templates are saved in the profile; without one the standard columns are written.
- An in-app help explains the concepts of Taktra in short chapters. It opens from the command
  palette and from the help popovers in the view headers.
- A command palette (Ctrl+Shift+P) reaches views, actions and settings from the keyboard, also by
  synonyms such as "customers" for clients.
- Export entries as JSON in addition to CSV, with the same columns.
- A note can be added when starting a timer and edited while it runs.
- Merge an activity into another one, which takes over its time entries.
- When a new activity is created while booking, similar existing activities are suggested first.
- View headers and empty states explain the concepts behind each view.
- Removing a project's client tells that it is handed down to the project's activities.
- After some days of use, a reminder now and then asks for a donation. It can be snoozed or
  turned off for good.
- The sample profile includes custom fields and export templates.

### Changed

- The actions of the activity detail view moved into its menu.
- The about dialog has calmer buttons.
- The headers of the reports, export and detail views are calmer.

### Fixed

- Names that differ only in extra whitespace count as the same name for projects, activities, tags
  and clients.

## [0.2.0] - 2026-10-05

### Added

- Clients: a profile-wide list of who the work is for, managed in its own view. A client is set
  on a project for all its activities, or on single activities of a project without one, e.g. a
  standard product with client-specific customizing. The timer and quick start show the client,
  the quick start also finds activities by it, and reports and export can be filtered by client.
  Reports get a client breakdown whose shares add up, and the export a `client` column at the end.
  The sample profile includes clients.
- Move an activity with its time entries to another project.
- A detail view for each activity with its client, total and time entries, where the timer can be
  started and entries can be edited or deleted.
- Notes support a small subset of Markdown: lists, bold, italic, code and links. The entry dialog
  has a preview, and long notes are collapsed. Notes are exported as written.
- The project and tag filters in reports and export can be searched.
- Report a bug or suggest an idea from the about dialog. Bug reports open on GitHub with the
  version and system already filled in.

### Changed

- The entries view shows the day as a timeline.
- The sidebar groups tracking, managing and evaluating views. The shortcuts for tags, reports and
  export move to Ctrl+5, Ctrl+6 and Ctrl+7, as clients take Ctrl+4.

### Fixed

- In time entry rows, the project moves to its own line when the activity name is long, and
  shortened names show in full on hover.
- Tooltips no longer open by themselves when the window is focused again, and tooltips that could
  not be positioned no longer show up.
- View headers and the sidebar stay usable at the minimum window size; header actions wrap onto
  the next line when space runs out.

## [0.1.1] - 2026-10-04

### Fixed

- The sidebar and the timer indicator show the arrow cursor like every other control.
- A stopped timer rounds its start and end to whole minutes instead of its duration, so an entry
  and the timer started right after it no longer seem to overlap by a minute.

## [0.1.0] - 2026-10-04

### Added

- Profiles as single `*.taktra` files at any location, KeePass-style: create, open, rename, switch
  and move to the trash. A generated sample profile for trying the app.
- Projects, activities and global tags. Activities with booked time are archived instead of deleted.
- Time entries with start and end, with a duration only, or recorded by a start/stop timer.
  Only one timer runs at a time, across all profiles.
- Quick access to the timer: start page with recent activities, timer indicator in the sidebar,
  always-on-top mini timer while the main window is hidden, tray icon and a quick start window
  opened by a configurable global shortcut.
- Reports over any period, filtered and grouped by project, by tag, or both.
- CSV export of completed entries in a stable format (RFC 4180, fixed English column names,
  durations in minutes) with a preview.
- English and German, light and dark theme, in-app keyboard shortcuts.
- Windows installer and portable zip.
- Automatic updates from GitHub releases for the installed app, with a manual check in the about dialog.
