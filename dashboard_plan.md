# Dashboard Plan

## Goal

Turn the dashboard from a mostly presentational shell into a real AI chat product with:

- a working general-purpose chat with Glint
- match-specific chats that let Glint answer questions using the matched person's information
- durable user memory that Glint can reuse across conversations
- suggested prompts on empty and early chat states
- a database design that works cleanly for both web and future mobile apps

This document is the finalized implementation plan based on confirmed product decisions.

## UI Overrides

These UI decisions override any earlier plan language that conflicts with them.

- Saved chat screens should be transcript-first and should not show a large hero block that repeats thread copy above the conversation.
- Match chat screens should keep match context compact and should avoid large introductory text regions above the transcript.
- General thread items in the drawer should show the thread title only. They should not show the assistant's latest reply preview under the title.
- Thread management UI should live in the drawer item interaction model: hover on desktop and long-press on mobile.
- The product should use permanent delete for chats rather than archive-and-restore UI.
- Chat transitions should feel continuous: sending a message should not flash or reload the whole conversation view while the assistant reply is streaming.

## Final Product Decisions

### Conversation Types

There are only two thread types:

- `general`
- `match`

### Route Semantics

- `/dashboard` is the `New Chat` surface
- `/dashboard` is not a thread
- `/dashboard` is the only empty homescreen state
- `/dashboard/threads/[threadId]` is a real general chat thread
- `/dashboard/matches/[matchId]` is a real match-scoped chat surface

### New Chat Behavior

- Clicking `New Chat` always routes the user to `/dashboard`
- `/dashboard` shows an empty chat experience with starter suggestions
- No thread is created when the user lands on `/dashboard`
- A `general` thread is only created when the user sends the first message from `/dashboard`
- After the first message is sent, the app creates the thread and routes the user to `/dashboard/threads/[threadId]`
- Only real threads with at least one message appear in drawer history

### Match Chat Behavior

- `/dashboard/matches/[matchId]` is a chat surface for discussing one match
- Each user has at most one AI chat thread per `match_id`
- When the user opens `/dashboard/matches/[matchId]`, the app finds or creates that user's `match` thread for that match
- Messages sent from the match page always belong to that match-scoped thread
- The agent must be able to read approved information about the matched person when generating replies

### Empty Homescreen Rule

- There is only one empty homescreen state
- It exists only at `/dashboard`
- It does not persist as a thread

## Data Model

Use the cloud database as the canonical source of truth.

### Keep Existing Tables

#### `user_agent_profile`

Keep `user_agent_profile` as a profile-level summary table, not a transcript table.

Purpose:

- onboarding-derived agent context
- stable criteria and summary data
- optional compact memory summary cache

Do not use it to store full chat history.

#### `matches`

Keep `matches` as the domain table that represents a match between two users.

Purpose:

- relationship record between users
- source for match-scoped chat context
- source for the `matchId` route

Do not store chat messages inside `matches`.

### New Tables

#### `agent_threads`

One row per real conversation.

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `kind text not null check (kind in ('general', 'match'))`
- `match_id uuid null references public.matches(id) on delete cascade`
- `title text null`
- `latest_message_preview text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `last_message_at timestamptz null`
- `summary text null`
- `summary_updated_at timestamptz null`
- `metadata jsonb not null default '{}'::jsonb`

Rules:

- `match_id` is null for general threads
- `match_id` is required for match threads at the application layer
- only one thread per user per match

Recommended indexes and constraints:

- index on `(user_id, updated_at desc)`
- index on `(user_id, kind, updated_at desc)`
- unique index on `(user_id, match_id)` where `match_id is not null`

#### `agent_messages`

One row per message.

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `thread_id uuid not null references public.agent_threads(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null check (role in ('user', 'assistant', 'system'))`
- `content text not null`
- `status text not null default 'completed' check (status in ('pending', 'completed', 'failed'))`
- `created_at timestamptz not null default now()`
- `metadata jsonb not null default '{}'::jsonb`

Recommended indexes:

- index on `(thread_id, created_at asc)`
- index on `(user_id, created_at desc)`

`metadata` can later store:

- model name
- token counts
- source route
- suggestion clicked
- failure details
- memory extraction flags

#### `agent_memories`

One row per durable memory item.

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `source_thread_id uuid null references public.agent_threads(id) on delete set null`
- `source_message_id uuid null references public.agent_messages(id) on delete set null`
- `kind text not null`
- `content text not null`
- `confidence numeric(4,3) null`
- `status text not null default 'active' check (status in ('active', 'discarded', 'superseded'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `metadata jsonb not null default '{}'::jsonb`

Recommended indexes:

- index on `(user_id, status, updated_at desc)`

Purpose:

- durable memory store for the agent
- source of truth for saved memories
- editable memory list in settings

### Optional `user_agent_profile` Additions

Reasonable additions:

- `memory_summary text null`
- `last_memory_refresh_at timestamptz null`
- `agent_version text null`

Do not add transcript arrays or per-thread history blobs to `user_agent_profile`.

## Security and Ownership

All chat data must be protected with RLS and server-side validation.

### `agent_threads`

User may only:

- read their own threads
- create threads for themselves
- update their own threads

### `agent_messages`

User may only:

- read messages belonging to their own threads
- create messages belonging to their own threads

### `agent_memories`

User may only:

- read their own memories
- update or delete their own memories

### Match Thread Validation

When creating or reading a match-scoped thread, the server must verify:

- the authenticated user is `user1` or `user2` in the target `matches` row
- the match context exposed to the agent only includes approved fields

## Context Model For The Agent

The agent should not rely on full raw chat history forever. All messages are stored, but inference context should be assembled intelligently.

### General Thread Context

For a general thread, build the model context from:

- recent messages from the current thread
- the thread summary if available
- active user memories from `agent_memories`
- relevant profile and onboarding context from `user_agent_profile`, `user_basic_info`, and `user_mentality`

### Match Thread Context

For a match thread, include everything from the general thread context plus:

- the `matches` row
- safe counterparty information from `user_matches_info`
- match-specific summary fields like `match_reason`

The agent must never use private or hidden fields that are not intended for this product surface.

## Thread Lifecycle Rules

### General Threads

1. User clicks `New Chat`
2. App routes to `/dashboard`
3. Empty homescreen is shown
4. User sends first message
5. App creates a `general` thread
6. App saves the user message into that thread
7. App requests the assistant response
8. App saves the assistant response
9. App routes to `/dashboard/threads/[threadId]`
10. Thread now appears in drawer history

### Match Threads

1. User opens `/dashboard/matches/[matchId]`
2. App verifies the user belongs to that match
3. App finds or creates that user's `match` thread for that `match_id`
4. App loads thread messages
5. User sends message
6. App saves the user message
7. App builds context including matched-person info
8. App requests assistant response
9. App saves assistant response

## API and Server Work

Build server-side helpers and routes for thread and message operations.

### Thread Operations

Implement:

- `createGeneralThread(userId)`
- `findOrCreateMatchThread(userId, matchId)`
- `listThreadsForUser(userId)`
- `getThreadByIdForUser(userId, threadId)`
- `getThreadByMatchIdForUser(userId, matchId)`

### Message Operations

Implement:

- `listMessagesForThread(userId, threadId)`
- `createUserMessage(threadId, userId, content, metadata)`
- `createAssistantMessage(threadId, userId, content, metadata)`
- `markMessageFailed(messageId)`

### Memory Operations

Implement:

- `listActiveMemoriesForUser(userId)`
- `createMemory(userId, sourceThreadId, sourceMessageId, memory)`
- `updateMemory(userId, memoryId, patch)`
- `deleteMemory(userId, memoryId)` or soft-delete with `status`

### Recommended API Routes

Suggested route responsibilities:

- `GET /api/dashboard/threads`
  - list all real threads for the current user
- `POST /api/dashboard/threads`
  - create a new general thread after first message intent
- `GET /api/dashboard/threads/[threadId]/messages`
  - load thread history
- `POST /api/dashboard/threads/[threadId]/messages`
  - append a message to an existing thread
- `POST /api/dashboard/matches/[matchId]/thread`
  - find or create match thread for the current user
- `POST /api/dashboard/chat/turn`
  - create user message, generate assistant turn, save assistant message

You may later merge some of these into fewer endpoints, but the underlying responsibilities should remain distinct.

## Real Chat Turn Flow

Every assistant turn should follow this server-side sequence:

1. authenticate user
2. validate thread ownership
3. save user message
4. load recent thread messages
5. load thread summary if available
6. load active user memories
7. load profile context
8. if match thread, load match-safe counterparty data
9. assemble model input
10. generate assistant reply
11. save assistant message
12. update thread preview and timestamps
13. trigger memory extraction
14. return the assistant message and any UI metadata

## Memory System

Durable memory should be extracted from chats and stored independently of transcript history.

### What To Save As Memory

Save only durable user-specific information such as:

- relationship preferences
- emotional patterns
- communication preferences
- boundaries
- goals
- recurring concerns
- values

Do not save every conversational detail.

### Memory Extraction Flow

After a successful assistant turn:

1. inspect the latest user and assistant exchange
2. extract durable memories
3. write them to `agent_memories`
4. associate them with source thread and source message when possible
5. optionally refresh a compact memory summary in `user_agent_profile`

### Memory UI

The settings page should eventually load real rows from `agent_memories` instead of static placeholders.

Users should be able to:

- review memories
- delete memories
- later possibly pin or suppress memories

## Suggested Prompts

Suggested prompts should be UI helpers, not fake assistant messages.

### General Chat Suggestions

On `/dashboard`, show starter prompts like:

- help me think about what I want
- help me understand my dating patterns
- help me prepare for a conversation

### Match Chat Suggestions

On first arrival to `/dashboard/matches/[matchId]`, show prompts like:

- what stands out about this person
- what could we have in common
- what should I ask first
- are there any compatibility concerns

### Suggestion Tracking

When a suggestion is clicked:

- insert the suggestion text as the user's message
- optionally mark `metadata.suggestion_clicked = true`

## UI Refactor Plan

### Drawer

Update the drawer to reflect the final product model.

Sections:

- `New Chat`
- `Matches`
- `Recent Chats`
- `Profile`
- `Settings`

Rules:

- `New Chat` always routes to `/dashboard`
- `Matches` appears above `Recent Chats`
- `Recent Chats` lists general threads only
- general thread items show title only
- `Matches` lists match-scoped routes using `matchId`
- only real threads with messages appear in history

The current placeholder `Agent Threads` concept should be removed once real thread history exists.

### Home Screen

Replace the current `Main Reflection` home content with:

- an empty chat canvas
- helpful intro copy
- starter prompt suggestions
- the real composer

### General Thread Screen

`/dashboard/threads/[threadId]` should show:

- persisted message history
- loading and error states
- composer
- optimistic user messages if desired
- no large header copy above the transcript
- continuous streaming updates without full-view reloads

### Match Thread Screen

`/dashboard/matches/[matchId]` should show:

- persisted message history for the match thread
- match intro card or match context header
- suggested prompt chips for match-specific questions
- composer
- compact context framing only, not a large hero block above the transcript

## Summarization Strategy

Store all messages in the database, but avoid sending the full transcript to the model every turn.

### Thread Summary

For long threads:

- generate a rolling thread summary
- store it on `agent_threads.summary`
- refresh it periodically

### Inference Context Window

Send to the model:

- recent messages
- thread summary
- durable memories
- profile context
- match context when relevant

This keeps token usage and latency under control.

## Analytics and Quality Signals

Use `metadata` fields for light instrumentation where helpful.

Examples:

- source route
- prompt suggestion used
- response generation failure
- model version
- memory extraction completion

This should stay secondary to the core chat implementation.

## Implementation Phases

### Phase 1: Database Foundation

1. create `agent_threads`
2. create `agent_messages`
3. create `agent_memories`
4. add indexes
5. add updated-at triggers where needed
6. add RLS policies
7. regenerate Supabase types

### Phase 2: Server Data Layer

1. add Supabase helpers for threads
2. add Supabase helpers for messages
3. add Supabase helpers for memories
4. add ownership validation for match threads
5. add a helper that loads full agent turn context

### Phase 3: General Chat MVP

1. change the dashboard home to `New Chat`
2. make `/dashboard` an empty chat surface
3. connect the composer so first message creates a general thread
4. save the first user message
5. generate and save assistant response
6. route to `/dashboard/threads/[threadId]`
7. render real transcript history

### Phase 4: Drawer and History

1. replace placeholder drawer structure
2. add `New Chat`
3. put `Matches` before `Recent Chats`
4. add `Recent Chats`
5. remove placeholder `Agent Threads`
6. show thread titles and timestamps without assistant preview text

### Phase 5: Match Chat MVP

1. find or create match thread on match page load
2. load match thread messages
3. load safe matched-person context
4. send context into the assistant turn
5. render real transcript instead of placeholder match copy

### Phase 6: Memory System

1. implement memory extraction
2. store extracted memories in `agent_memories`
3. load active memories into future turns
4. optionally refresh `user_agent_profile.memory_summary`
5. connect settings page to real memories

### Phase 7: Suggested Prompts

1. add general chat suggestion chips
2. add match-specific suggestion chips
3. support click-to-send behavior
4. optionally track suggestion usage in metadata

### Phase 8: Thread Summaries

1. add rolling thread summary generation
2. store summaries on `agent_threads`
3. use summaries in inference context

### Phase 9: Polish and Reliability

1. add pending and failed message UI
2. add optimistic updates
3. refine empty states
4. test refresh and route recovery
5. test auth and RLS edge cases
6. test match ownership enforcement

## Recommended Build Order

Build in this order:

1. database schema and RLS
2. server-side thread and message helpers
3. general chat creation and rendering
4. drawer/history refactor
5. match-scoped chat
6. memory extraction and settings integration
7. suggested prompts
8. long-thread summarization
9. polish and QA

## Immediate Next Task

The first implementation slice should be:

1. add the new Supabase tables and policies
2. wire `/dashboard` so first send creates a general thread
3. route into `/dashboard/threads/[threadId]`
4. render real saved messages in general thread view

That gives the product its first real end-to-end chat loop while preserving the final architecture.
