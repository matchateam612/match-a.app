# Repository Guide

## What This Repo Is

This repository currently contains a single web app workspace in `next-app` plus a small amount of notebook-based support tooling at the repo root.

The app appears to be an early-stage matchmaking product called "Matcha". Its product language frames the experience as an AI-assisted match discovery system:

- an AI scout called "Agent Glint"
- "social ripples" and "urban clusters"
- a dashboard that surfaces possible matches

The current implementation is part scaffold, part product build. Some routes and metadata still use default Next.js starter content, while the auth and dashboard flows are clearly being shaped into the real app.

## Main Stack

The primary app in `next-app` uses:

- Next.js App Router
- React 19
- TypeScript
- SCSS modules
- Supabase for auth and app data

Important note: there is an existing [next-app/AGENTS.md](C:\Users\willi\Documents\GitHub\match-a.app\next-app\AGENTS.md) that warns this project uses a newer Next.js version and that agents should consult the local Next.js docs in `node_modules/next/dist/docs/` before making framework-sensitive changes.

## Repository Layout

At the time of writing, the repository looks like this:

- `next-app/`
  - the actual product code
- `create_match.ipynb`
  - helper notebook for inserting match records into Supabase by user email
- `test.ipynb`
  - currently empty / minimal

Within `next-app/`:

- `app/`
  - route files and route-local UI
- `app/dashboard/_components/`
  - dashboard presentation components
- `app/dashboard/_lib/`
  - lightweight mapping/types for dashboard cards
- `app/signup/_components/`
  - current polished signup UI
- `app/signin/_components/`
  - current simpler signin test UI
- `lib/supabase/`
  - browser client, env helpers, auth helpers, match queries, and shared types
- `docs/css-structure.md`
  - styling conventions for globals, SCSS partials, CSS variables, and modules

## Product Understanding

The clearest current product behavior is:

- users can sign up with email/password through Supabase
- signed-in users can load match records from a Supabase `matches` table
- the dashboard visualizes those records as "Potential Ripples"

The dashboard language suggests the intended UX is an AI-mediated dating or social matching experience, not a generic messaging or directory app.

Current match data model in `lib/supabase/types.ts`:

- `id`
- `user1`
- `user2`
- `match_reason`
- `user1_match_status`
- `user2_match_status`

Current status mapping in `app/dashboard/_lib/ripple-mappers.ts`:

- both statuses `1` => `"Mutual"`
- one status `1` => `"Pending"`
- otherwise no label

## Key Routes

- `app/page.tsx`
  - still default Next.js starter page
- `app/signup/page.tsx`
  - current branded account creation experience
- `app/signin/page.tsx`
  - simple signin page using a test form
- `app/dashboard/page.tsx`
  - main product dashboard shell
- `app/dashboard/matches/page.tsx`
  - placeholder route, currently only renders `"Matches"`

## Important Files To Read First

If you are a new agent and need fast context, start here:

1. `next-app/package.json`
2. `next-app/app/layout.tsx`
3. `next-app/app/signup/page.tsx`
4. `next-app/app/signup/_components/signup-shell.tsx`
5. `next-app/app/dashboard/page.tsx`
6. `next-app/app/dashboard/_components/dashboard-hero.tsx`
7. `next-app/app/dashboard/_components/potential-ripples-container.tsx`
8. `next-app/lib/supabase/auth.ts`
9. `next-app/lib/supabase/matches.ts`
10. `next-app/lib/supabase/types.ts`
11. `next-app/docs/css-structure.md`

## Supabase Integration

Supabase browser configuration lives in:

- `lib/supabase/client.ts`
- `lib/supabase/env.ts`

Expected public env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Current auth helper coverage:

- email/password sign in
- email/password sign up
- get current user
- sign out

Current match query coverage:

- list all matches where the current user is either `user1` or `user2`

## Styling System

Styling is intentionally organized around:

- `app/globals.scss` for true global styles
- `app/styles/_tokens.scss` for shared Sass tokens and theme variables
- `app/styles/_mixins.scss` for shared Sass helpers
- route/component-local `.module.scss` files for scoped styling

The dashboard and signup flows already use this structure and are more representative of the intended design direction than the home page.

## Current State Of The Codebase

This codebase is actively in transition.

Observed characteristics:

- the homepage and metadata still contain scaffold/default content
- the dashboard has more product-specific copy and visuals
- signup has been developed into a branded flow
- signin appears less finished than signup
- `app/dashboard/matches/page.tsx` is still a stub
- notebooks are being used as operational tooling for seeding or testing match data

There are also existing uncommitted changes in the working tree, including auth and signup-related files. Do not assume the tree is clean when starting work.

## Practical Guidance For Future Agents

- Treat `next-app` as the actual application root.
- Do not use the top-level `README` as a reliable product overview; it is still mostly starter text.
- Prefer reading dashboard and signup code to understand product intent.
- Be careful around auth and onboarding routes because these are actively being reshaped.
- Check for local worktree changes before editing; the repo may already contain in-progress user work.
- For framework-sensitive changes, heed the warning in `next-app/AGENTS.md` about the newer Next.js version.

## Gaps / Unknowns

These areas were not fully documented in the repository at the time of review:

- no authoritative product README yet
- no explicit database schema docs beyond the TypeScript types and notebook usage
- no visible backend/server-side Supabase usage yet; current integration is browser-side
- no test suite or CI guidance was identified from the initial pass

When in doubt, derive intent from the implemented dashboard/auth flows rather than from scaffolded app files.
