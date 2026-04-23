# Matcha Engineering Guide

## Purpose

This repository contains the Matcha product web app and a small amount of notebook-based support tooling.

The main application lives in `next-app/` and is a Next.js App Router project for:

- auth and account entry
- multi-step onboarding
- AI-assisted profile and agent setup
- dashboard and match surfaces

This document is the working technical reference for future maintainers, engineers, and coding agents. It is intentionally practical: it explains where code lives, how the major flows are structured, and how to extend the codebase without reintroducing unnecessary complexity.

## Workspace Layout

### Repository root

- `next-app/`
  The production app workspace.
- `doc.md`
  This guide.
- `AGENT.md`
  Higher-level repository observations and agent guidance.
- `*.ipynb`, `org_info.csv`, `response.text`
  Support and exploratory assets outside the primary runtime.

### Application root: `next-app/`

- `app/`
  App Router routes, route-local components, and route-specific logic.
- `features/`
  Cross-route feature modules. Auth currently lives here.
- `lib/`
  Shared runtime code for Supabase, onboarding IndexedDB, matches, pictures, and LLM integrations.
- `docs/`
  Internal implementation references such as SQL and CSS structure notes.
- `public/`
  Static assets.

## Main Stack

- Next.js 16 App Router
- React 19
- TypeScript
- SCSS modules
- Supabase
- IndexedDB for local onboarding draft persistence

## Product Flow Overview

The current app behavior is easiest to understand as a funnel:

1. Authentication
2. Onboarding
3. Agent/profile setup
4. Dashboard and matches

### Key routes

- `app/signin/page.tsx`
- `app/signup/page.tsx`
- `app/onboarding/page.tsx`
- `app/onboarding/1-basics/page.tsx`
- `app/onboarding/2-mentality/page.tsx`
- `app/onboarding/3-picture/page.tsx`
- `app/onboarding/4-agent/page.tsx`
- `app/dashboard/page.tsx`

The onboarding index route redirects to `/onboarding/1-basics`, so the onboarding sequence is an explicit ordered workflow.

## Architecture By Area

### Auth

Auth-related UI and domain helpers are primarily split between:

- `features/auth/`
- `lib/supabase/auth.ts`
- route files in `app/signin`, `app/signup`, `app/forgot-password`, and `app/reset-password`

Keep auth UI logic close to feature components, and keep Supabase-specific behavior in `lib/supabase`.

### Onboarding

Onboarding is the most stateful and most operationally important part of the current codebase.

It is divided into:

- `app/onboarding/_shared/`
  Shared onboarding UI and state primitives.
- `app/onboarding/1-basics/_components/`
  Basic profile and preference setup.
- `app/onboarding/2-mentality/_components/`
  Intent and relationship-style branching flow.
- `app/onboarding/3-picture/_components/`
  Profile photo capture, AI transformation, and gallery handling.
- `app/onboarding/4-agent/`
  AI-guided conversation and agent profile shaping.

### Dashboard

Dashboard code is organized into:

- `app/dashboard/_components/`
- `app/dashboard/_lib/`
- route files under `app/dashboard/**`

This area is more presentation-heavy than onboarding, and it depends on Supabase-backed profile and match data that onboarding prepares.

### Shared libraries

Important libraries include:

- `lib/supabase/`
  Auth, profile persistence, match queries, generated database types.
- `lib/onboarding-idb/`
  IndexedDB-backed onboarding draft store and migration utilities.
- `lib/pictures/`
  Picture transformation, moderation, upload, and related APIs.
- `lib/llm/` and `lib/openai-realtime/`
  AI-related environment and integration helpers.

## Onboarding State Model

### Why this matters

Onboarding is where most of the app's client-side complexity lives. It involves:

- local draft persistence
- branch-aware progress
- recoverable partial completion
- eventual sync to Supabase-backed tables

This is also the area most likely to accumulate accidental duplication if not kept disciplined.

### Current persistence design

There are two separate concerns:

1. Local draft persistence in IndexedDB
2. Remote persistence to Supabase when a section is finished

IndexedDB state is managed in `lib/onboarding-idb/`.

Important files:

- `lib/onboarding-idb/types.ts`
- `lib/onboarding-idb/defaults.ts`
- `lib/onboarding-idb/meta-store.ts`
- `lib/onboarding-idb/sync-store.ts`
- `lib/onboarding-idb/migrate-legacy.ts`
- `lib/onboarding-idb/section-sync.ts`

### Meta record vs sync record

The local onboarding store is intentionally split:

- `meta`
  The actual draft state by section.
- `sync`
  Sync metadata such as dirty flags, sync error, and migration markers.

This split is useful and should be preserved. It keeps user answers separate from synchronization bookkeeping.

### Shared async draft-state foundation

The shared onboarding state foundation now lives in:

- `app/onboarding/_shared/use-onboarding-section-state.ts`

This hook is the standard pattern for onboarding sections that need:

- async hydration from IndexedDB
- async persistence back to IndexedDB
- local draft status messaging
- save error wiring
- shared `isHydrating` and section-save state handling

The hook is intentionally generic over:

- `draft`
- `progress`
- stored section state shape

Each section supplies:

- `initialDraft`
- `initialProgress`
- `readStoredState`
- `hasDraftContent`
- `persistState`
- optional `onStoredStateLoaded`
- user-facing error/status strings

This design keeps section-specific business logic inside the section, while centralizing the repeated lifecycle mechanics.

### Why this refactor matters

Before this refactor, `1-basics` and `2-mentality` each reimplemented the same pattern:

- create local draft/progress state
- hydrate on mount with cancellation logic
- recompute `hasSavedDraft`
- persist on every relevant change
- maintain near-identical draft status messaging
- wire identical save error handling

That pattern is now shared instead of duplicated.

## Onboarding Sections

### 1. Basics

Core files:

- `app/onboarding/1-basics/_components/basic-info-onboarding.tsx`
- `app/onboarding/1-basics/_components/basic-info-idb.ts`
- `app/onboarding/1-basics/_components/basic-info-data.ts`
- `app/onboarding/1-basics/_components/basic-info-types.ts`

Responsibilities:

- age and phone number
- preferred age range
- identity and interest preferences
- ethnicity and preference selection
- local age lock behavior

Notes:

- This section now consumes the shared async onboarding state hook.
- It still owns its section-specific logic such as age locking and step completion rules.

### 2. Mentality

Core files:

- `app/onboarding/2-mentality/_components/mentality-onboarding.tsx`
- `app/onboarding/2-mentality/_components/mentality-idb.ts`
- `app/onboarding/2-mentality/_components/mentality-flow.ts`
- `app/onboarding/2-mentality/_components/mentality-data.ts`
- `app/onboarding/2-mentality/_components/mentality-types.ts`

Responsibilities:

- relationship intent selection
- branch-specific follow-up questions
- branch-aware progress sanitization

Notes:

- This section also now consumes the shared async onboarding state hook.
- `sanitizeMentalityProgress` is still a critical integrity function and should remain the authority for validating branch-specific progress.

### 3. Picture

Core files:

- `app/onboarding/3-picture/_components/picture-onboarding.tsx`
- `app/onboarding/3-picture/_components/picture-idb.ts`
- `app/onboarding/3-picture/_components/picture-draft-files.ts`
- `app/onboarding/3-picture/_components/picture-file-utils.ts`

Responsibilities:

- upload or camera capture
- local file draft persistence
- optional AI transformation
- gallery uploads
- final profile picture upload

Recent cleanup:

- legacy `picture-storage.ts` was removed
- the active source of truth is now the IndexedDB-backed `picture-idb.ts` path

Do not reintroduce a parallel localStorage-based picture draft layer.

### 4. Agent

Core files:

- `app/onboarding/4-agent/_components/agent-onboarding.tsx`
- `app/onboarding/4-agent/_lib/agent-idb.ts`
- `app/onboarding/4-agent/_lib/agent-server.ts`
- `app/onboarding/4-agent/_lib/agent-chat-client.ts`

This section is more complex than the earlier onboarding steps because it blends:

- draft persistence
- chat transcript management
- criteria extraction
- voice/text modality
- streamed responses

It still contains meaningful opportunities for further consolidation. If refactoring onboarding again, this is the next highest-value target after the current shared foundation.

## IndexedDB and Legacy Migration

Legacy onboarding data may exist in:

- localStorage keys
- the older `matcha-onboarding` IndexedDB picture draft store

Migration is handled by:

- `lib/onboarding-idb/migrate-legacy.ts`

Rules for future changes:

- preserve migration behavior unless there is a deliberate migration version bump
- never silently delete migration logic without confirming all active users are past the legacy state
- prefer additive migrations over rewriting existing draft semantics in place

## Sync Flags

Section dirty-state updates are now centralized through:

- `lib/onboarding-idb/section-sync.ts`

Use `markOnboardingSectionDirty(sectionKey)` when a section's draft has changed locally and the sync record should reflect that.

Do not repeat the same `updateOnboardingSyncRecord` boilerplate in each section file unless a section truly needs special sync behavior.

## Supabase Data Responsibilities

Onboarding does not just collect client state. It ultimately writes into remote domain tables.

Examples:

- basic info updates `user_basic_info` and `user_matches_info`
- mentality updates `user_mentality` and `user_matches_info`
- picture updates profile image state and `user_matches_info`
- agent onboarding updates `user_agent_profile` and match-facing profile summary

Keep a clear boundary:

- local onboarding state belongs in `app/onboarding/**` and `lib/onboarding-idb/**`
- server persistence belongs in `lib/supabase/**`

## Conventions For Future Maintainers

### 1. Prefer one abstraction over many similar implementations

If two onboarding sections repeat the same lifecycle pattern, extend the shared foundation instead of copying logic.

### 2. Keep section business rules local

Shared hooks should own mechanics.

Section files should own:

- validation rules
- step ordering
- branch logic
- user-facing copy specific to that section

### 3. Avoid parallel persistence systems

One active storage path per concern is the target. Parallel localStorage and IndexedDB implementations create uncertainty and bugs.

### 4. Separate draft persistence from final submission

Draft persistence should be cheap and local.

Final section submission should be explicit, authenticated, and remote.

### 5. Keep data sanitizers authoritative

Functions like `sanitizeMentalityProgress` are high-value because they make invalid state harder to persist. Prefer strengthening them instead of bypassing them.

## Recommended Reading Order For New Engineers

1. `next-app/package.json`
2. `next-app/app/layout.tsx`
3. `next-app/app/onboarding/page.tsx`
4. `next-app/app/onboarding/_shared/use-onboarding-section-state.ts`
5. `next-app/lib/onboarding-idb/types.ts`
6. `next-app/lib/onboarding-idb/migrate-legacy.ts`
7. `next-app/app/onboarding/1-basics/_components/basic-info-onboarding.tsx`
8. `next-app/app/onboarding/2-mentality/_components/mentality-onboarding.tsx`
9. `next-app/app/onboarding/3-picture/_components/picture-onboarding.tsx`
10. `next-app/app/onboarding/4-agent/_components/agent-onboarding.tsx`
11. `next-app/lib/supabase/`
12. `next-app/app/dashboard/`

## Development Commands

From `next-app/`:

```bash
npm run dev
npm run lint
npm run build
```

Notes:

- In PowerShell on this machine, `npm` may require `npm.cmd` because script execution policy can block `npm.ps1`.
- `next build` currently compiles successfully but may fail later with an environment-level `spawn EPERM`; treat that separately from TypeScript or app-code regressions.

## Known Issues And Risks

### Generated `.next` validator typing

Plain `tsc --noEmit` currently reports type errors inside `.next/types/validator.ts`. Those errors appear to be generated-route typing issues rather than errors from the refactor described here.

If you want a clean standalone TypeScript check, either:

- fix the route typing source that generates those files
- or use a validation command that ignores generated artifacts

### Agent flow complexity

The agent onboarding area still contains duplicated persistence and status-management logic that can likely be folded into the shared draft-state foundation in a later pass.

### Limited test coverage

The repository does not yet present a clear automated test suite for onboarding behavior. Refactors in this area should be accompanied by careful manual route verification.

## Practical Extension Guidance

### To add a new onboarding section

1. Create the section route and local component folder.
2. Define `initialDraft`, `initialProgress`, and section types.
3. Add section shape to the onboarding IndexedDB meta and sync records if needed.
4. Implement `readStoredState`, `persistState`, and `hasDraftContent`.
5. Use `useOnboardingSectionState` instead of hand-rolling hydration and persistence effects.
6. Keep final remote submission logic separate from local persistence.

### To refactor safely

Start with the state boundary, not the UI.

Good refactor sequence:

1. unify persistence primitives
2. reduce duplicated hook/effect logic
3. move repeated state transitions into helpers
4. only then simplify component render branches

This order minimizes behavior regressions.

## Final Guidance

The codebase will stay understandable if future work follows three rules:

- one source of truth per data path
- one shared abstraction per repeated lifecycle
- section-specific business rules kept close to the section

If you are unsure where a change belongs, default to making state transitions clearer rather than cleverer. In this repository, readability and explicit ownership are worth more than compactness alone.
