# Daily Dev — Gamified Habit Tracker

A desktop habit tracker inspired by *Atomic Habits* and Habitica. Each habit has a
character (an image) that represents it. You mark which habits you completed each day,
and the app keeps an independent consistency streak for every habit.

> **v1 scope**: create habits with an image, mark them daily, and track each habit's
> individual streak with automatic resets. Nothing else (see [Non-goals](#non-goals)).

## Stack

- **[Tauri 2](https://tauri.app/)** — desktop shell (Rust)
- **React 19** + **TypeScript** + **Vite**
- **SQLite** via `@tauri-apps/plugin-sql` (versioned migrations)
- **Tailwind CSS 4** — light theme, orange primary, rounded friendly type
- **Framer Motion** — mark / streak-up feedback animations
- **Zustand 5** — thin UI state orchestration
- **Vitest** — unit tests (strict TDD on the streak engine)

## Getting started

```bash
pnpm install
pnpm tauri dev     # run the desktop app
pnpm test          # run the Vitest suite
pnpm build         # build the web assets
```

> Requires a [Rust toolchain](https://www.rust-lang.org/tools/install) and Node + pnpm.

## Architecture

Layered / screaming architecture. The streak engine is a **pure function** with zero
Tauri/React/SQLite imports, so it is fully unit-testable in isolation.

```
src/
  domain/          # entities + pure streak engine (computeStreak)
  application/     # use cases (loadToday, toggleHabitToday, habit CRUD) + ports
  infrastructure/  # SQLite repositories + filesystem adapter (Tauri plugins)
  ui/              # atomic components, Today view, habit form
  state/           # Zustand store (orchestration only)
src-tauri/
  migrations/      # SQLite schema migrations
  capabilities/    # Tauri permission scopes (incl. image asset access)
```

### Source of truth

`habits.current_streak` is a **recomputed cache**, never mutated incrementally.
The real history lives in `daily_records` (one sparse row per completed habit per day).
If a streak ever looks wrong, `daily_records` is the source of truth for debugging it.

## Streak rules

Applied independently to each habit, recomputed on every app open by comparing the
current local date with each habit's last record (no midnight timer — the app may be closed):

- Mark a habit on a day → its streak **+1**.
- Miss **one** day → streak **holds** (one grace day).
- Miss **two consecutive** days → streak **resets to 0**.
- App not opened for **3+ days** → **all** streaks reset to 0. This short-circuits and
  overrides the grace day (a habit on its grace day during a 3+ day gap still resets).

A habit is never penalized for days before it was created.

## Non-goals

Out of scope for v1, intentionally: per-character progress bars, character evolution,
levels, unlockables, and any points system.
