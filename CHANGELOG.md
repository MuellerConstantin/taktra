# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The sidebar and the timer indicator show the arrow cursor like every other control.

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
