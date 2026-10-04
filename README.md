<p align="center">
  <img width="120" alt="Logo" src="./resources/icon.svg">
  <h1 align="center">Taktra</h1>
</p>
<p align="center">
  Local time tracking without the overhead.
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Electron-44-47848F?logo=electron" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/CSS%20Library-Tailwind%20CSS-blue?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite" />
  <img src="https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript" />
</p>

## Table of Contents

- [Introduction](#introduction)
- [Motivation](#motivation)
- [Development](#development)
  - [Database Migrations](#database-migrations)
  - [Checks](#checks)
- [Build](#build)
- [License](#license)
  - [Forbidden](#forbidden)

## Introduction

Taktra is a time tracking app for the desktop. Work is organized into projects and activities — a daily
standup is simply the same activity booked again each day — and time is booked on activities, either with a
start and end time or as a plain duration. Tags such as `meeting` or `support` are attached to activities and
cut across projects, so every entry inherits the tags of its activity. Reports evaluate the tracked time over
any period, grouped by project, by tag, or by both.

Starting a timer takes a click: from the recently used activities on the start page, or from a quick start
search that opens from the tray icon or a global shortcut. Taktra keeps running in the
tray when its window is closed, and a small always-on-top mini timer shows what is being tracked while the
window is out of sight.

There is no server, no account and no sync. Everything runs on your machine, and your data is a plain file
you own.

## Motivation

I built Taktra for my own work. I needed to keep track of how my time is split across projects and
recurring tasks, and the tools I looked at were either hosted services that hold my data or self-hosted
platforms that require running and maintaining a server, a database and user accounts — far too much
overhead for one person who just wants to book a few hours a day.

What I wanted was something lean: an app that starts instantly, works offline, and keeps everything in a
single local file that I can back up or move myself. Taktra is exactly that and deliberately not more — no
server to run, no account, no BI tool, just booking time and seeing where it went.

## Development

The development environment needs nothing besides Node.js. `better-sqlite3` ships prebuilt binaries for
Windows, macOS and Linux, so no compiler toolchain is required.

Requirements:

- Node.js 24+ and NPM

Installs the dependencies, including Electron itself.

```bash
npm install
```

Starts the app in development mode with hot reload for the renderer.

```bash
npm run dev
```

Profiles and settings are stored in the user data directory — `%APPDATA%\taktra` on Windows,
`~/Library/Application Support/taktra` on macOS, `~/.config/taktra` on Linux. The sample profile on the
welcome screen is the quickest way to get realistic data for development.

### Database Migrations

The schema lives in `src/main/db/schema/`. After changing it, generate a migration and commit it together
with the schema change. Generated migrations are never edited by hand.

```bash
npm run db:generate -- --name <what_changed>
```

### Checks

Type checking, linting and formatting must pass before a change is done.

```bash
npm run typecheck
npm run lint
npm run format
```

## Build

Packaging is configured for Windows so far. The build runs the type check, bundles the app with
electron-vite and creates an NSIS installer in `dist/`.

```bash
npm run build:win
```

`npm run build:unpack` builds an unpacked app directory instead, which is handy for a quick test of the
production build.

## License

Copyright (c) 2026 Constantin Müller

[GNU AFFERO GENERAL PUBLIC LICENSE](https://www.gnu.org/licenses/) or [LICENSE](./LICENSE.md) for
more details.

### Forbidden

**Hold Liable**: Software is provided without warranty and the software
author/license owner cannot be held liable for damages.
