# 4-Agent Overhaul Plan

## Goal

Refactor the onboarding agent so text and voice share one conversation architecture:

- the app is the source of truth for prompt construction
- the app is the source of truth for turn snapshots and structured state
- text streams interviewer responses directly from the app pipeline
- voice uses OpenAI Realtime for speech output, but the app still prepares the same turn context and pushes it into the Realtime session
- extraction and criteria updates run asynchronously and become authoritative on the next turn

This removes the fake static opener, improves perceived latency, and keeps the structured profile state consistent.

## Desired Conversation Model

### First turn

- Do not seed a static assistant opener into local transcript state.
- When the user selects and confirms a mode, generate a real first assistant turn.
- Build that first-turn context from:
  - interviewer system prompt
  - selected mode
  - `isFirstTurn: true`
  - criteria definitions
  - current authoritative criteria snapshot
  - prior onboarding answers from earlier sections
  - any other known profile context already collected by onboarding
- Persist the generated first turn into transcript state as a normal assistant turn.

### Text mode

- The app streams the interviewer response directly to the UI.
- The streamed response is based on the turn snapshot created at the start of that turn.
- When the stream completes, save the final assistant message to transcript state.

### Voice mode

- The app still constructs the turn snapshot and prompt payload.
- The app sends that prepared turn context into the OpenAI Realtime session.
- Realtime generates the spoken assistant response from that app-prepared snapshot.
- Do not use voice as only transcription plus post-hoc TTS.
- The first generated assistant turn should be prepared before the voice session starts, then delivered immediately once the session is ready.

## Turn Consistency Rules

- Every user turn creates a stable snapshot.
- The assistant reply for a turn uses:
  - the authoritative structured state available at turn start
  - the latest raw user message
  - recent transcript context if needed
- Extractor work runs separately against that same turn snapshot.
- Extractor results do not mutate an in-flight assistant reply.
- Extractor results become authoritative only for the next turn.
- If extraction is delayed or fails, conversation continues with the last known good structured state.

## Performance Strategy

### Fast lane

The user-facing assistant reply should start as quickly as possible:

- text: stream tokens to chat immediately
- voice: start spoken response from Realtime immediately after the app sends the prepared turn context

### Slow lane

Structured updates should not block the reply:

- run extraction asynchronously
- merge updated criteria when extraction completes
- use merged criteria on the next turn

## Refactor Targets

### `agent-onboarding.tsx`

- Remove the static seeded opener behavior.
- Add a mode-confirm flow that triggers first-turn generation.
- Load earlier onboarding answers into the initial turn context.
- Store authoritative criteria state separately from in-flight UI response state if needed.

### `use-agent-voice-session.ts`

- Stop treating voice as completed transcription plus `/api/agent-turn` plus audio playback.
- Keep the app as the source of truth for turn snapshots.
- Add a way to send prepared turn context into the Realtime session.
- Support immediate delivery of the first assistant turn after connect.
- Keep live transcript and voice connection state visible in the UI.

### `agent-server.ts`

- Split interviewer response generation from extraction work more cleanly.
- Support streaming interviewer responses for text mode.
- Support turn-snapshot-based prompt construction for both text and voice.
- Keep extraction as an asynchronous state update path.

### API routes

- Add or refactor routes to support:
  - streaming text interviewer responses
  - background extraction updates
  - preparing first-turn context from prior onboarding data

## Implementation Principles

- One prompt-construction path for both text and voice.
- One turn snapshot model for both text and voice.
- One authoritative structured criteria state.
- No fake assistant transcript items.
- No extractor mutation of an already-streaming reply.
- No voice-specific interviewer logic that can drift from text behavior.

## Success Criteria

- Voice no longer waits for the user to speak before the first assistant question is delivered.
- Text and voice both generate the first assistant turn from the same app-owned logic.
- Text replies feel streamed instead of batched.
- Voice feels conversational rather than transcription-first and TTS-second.
- Criteria updates happen quickly, but do not block response latency.
- The next assistant turn reliably uses the newest completed extraction snapshot.
