# Contributing to AI Nazar Dashboard

Thanks for considering a contribution — this guide covers local setup,
the coding conventions the codebase already follows, and how to open a
pull request.

## Local setup

```bash
git clone https://github.com/harshalone/ai-nazar.git
cd ai-nazar
npm install       # also runs `db:generate` (Prisma clients) via postinstall
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and go through
`/setup` — pick SQLite for local development, it needs zero config and
creates `./data/nazar.db` automatically.

To reset your local state, stop the dev server, delete `.env.local` and
`./data/nazar.db`, and restart — you'll land back on `/setup`.

## Project structure

Read the [Architecture section of the README](./README.md#architecture)
first — it explains the storage abstraction (`EventsStore`), the three
backends (SQLite, Postgres, Postbase), the ingestion route, and the
setup gate in `src/proxy.ts`. Most changes fall into one of:

- `src/lib/store/` — the `EventsStore` interface and its three
  implementations. If you touch one backend, check whether the same
  change is needed in the others (they're expected to behave
  identically).
- `src/app/` — Next.js App Router pages and API routes.
- `src/components/` — UI components, styled with Tailwind.
- `prisma/sqlite/` and `prisma/postgres/` — Prisma schemas, kept
  structurally identical. `prisma/postbase/schema.sql` mirrors both by
  hand.

## Before opening a PR

```bash
npm run lint
npm run build
```

Both must pass — this is what CI checks on every PR. There's no
automated test suite yet; if you're adding non-trivial logic
(especially in `src/lib/store/`), consider adding one alongside your
change.

## Making changes to the database schema

If you change `prisma/sqlite/schema.prisma`, mirror the change in
`prisma/postgres/schema.prisma` and in `prisma/postbase/schema.sql`
(camelCase column names, no translation layer — see the comment at the
top of that file). Then generate a migration:

```bash
npm run db:migrate:dev:sqlite
npm run db:migrate:dev:postgres
```

## Pull request workflow

1. Fork the repo and create a branch off `main`.
2. Keep PRs focused — one logical change per PR is easier to review
   and merge.
3. Make sure `npm run lint` and `npm run build` pass.
4. Open the PR against `main` with a clear description of what changed
   and why. Link any related issue.
5. A maintainer will review and may ask for changes — that's normal,
   not a rejection.

## Looking for something to work on?

Check issues labeled
[`good first issue`](https://github.com/harshalone/ai-nazar/labels/good%20first%20issue)
— they're scoped to be approachable without deep familiarity with the
codebase. If nothing fits, feel free to open an issue proposing what
you'd like to work on before writing code, so we can align on approach
first.

## Reporting bugs / requesting features

Use the issue templates — they ask for the information that's usually
needed to act on a report (repro steps, environment, expected vs.
actual behavior).
