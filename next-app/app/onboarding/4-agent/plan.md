# Agent Onboarding Architecture Plan

This document defines the recommended architecture for `next-app/app/onboarding/4-agent`.

The goal of section 4 is to help the user express dating preferences through a guided conversation, with two input modes:

- text chat
- voice chat

Both modes should feed the same shared onboarding engine, the same stored profile schema, and the same completion rules.

## Product goals

- Make onboarding feel natural, warm, and low-pressure.
- Capture preference information that is actually useful for downstream matching.
- Avoid saving silent misinterpretations as truth.
- Support both text-first and voice-first users without duplicating core logic.
- End the conversation once we have enough information, instead of dragging the user through too many turns.

## Core recommendation

Do not build this as two long-lived LLMs with separate drifting memories.

Instead, build:

1. one live interviewer agent responsible for the next user-facing reply
2. one extractor pass responsible for updating structured preference state
3. one orchestrator layer in app code that decides what is still missing and when to stop

The durable memory should live in application state / database, not inside either model.

## High-level architecture

The section should be built as one shared conversation engine with two transport layers.

- Shared conversation engine
  - structured profile state
  - transcript
  - criterion progress
  - completion rules
  - confirmation flow
  - persistence

- Text transport
  - text input
  - streaming text output

- Voice transport
  - microphone capture
  - live transcript
  - audio playback
  - interruption / reconnect handling

At the business-logic level, text and voice should behave the same.

## Suggested folder architecture

Recommended future structure inside `next-app/app/onboarding/4-agent`:

```text
4-agent/
  page.tsx
  plan.md
  _components/
    agent-onboarding.tsx
    agent-layout.tsx
    mode-picker.tsx
    chat-panel.tsx
    transcript-message-list.tsx
    text-input-bar.tsx
    voice-session-panel.tsx
    voice-waveform.tsx
    agent-summary-card.tsx
    completion-review.tsx
  _lib/
    agent-types.ts
    agent-criteria.ts
    agent-prompts.ts
    agent-orchestrator.ts
    agent-extractor.ts
    agent-completion.ts
    agent-storage.ts
    agent-voice.ts
  _actions/
    start-agent-session.ts
    submit-agent-text-turn.ts
    finalize-agent-profile.ts
    create-realtime-session.ts
```

This keeps UI concerns separate from orchestration and persistence.

## Data flow

Each turn should follow this lifecycle:

1. user sends text or speaks
2. app creates a transcript item
3. extractor updates structured preference state
4. orchestrator determines:
   - which criteria are still unresolved
   - whether confirmation is needed
   - whether the session is complete
5. interviewer generates the next assistant response
6. app stores:
   - transcript
   - criteria state
   - assistant reply
   - session status

For voice mode, the same flow applies, but transcript text is produced from audio first.

## Recommended LLM structure

### 1. Interviewer model

Purpose:
- produce the next best thing to say
- keep the tone natural
- ask focused follow-up questions
- summarize and confirm before saving

Input:
- system prompt
- recent transcript
- structured criteria state
- missing / weak criteria
- any confirmation summary prepared by the app

Output:
- assistant message
- optional metadata such as:
  - intent: `ask_followup | confirm_summary | transition_topic | complete`
  - target criterion

The interviewer should not invent a hidden memory. It should read from structured state supplied by the app.

### 2. Extractor model

Purpose:
- convert transcript evidence into structured profile updates

Input:
- relevant transcript
- prior extracted state
- target schema

Output:
- per-criterion updates
- evidence
- confidence
- source type: explicit vs inferred
- whether confirmation is needed

This should be a structured-output task. The extractor should produce JSON-like data that is easy to validate.

### 3. App-level orchestrator

Purpose:
- own the deterministic conversation rules
- decide what to ask next
- decide when to confirm
- decide when to end

This part should be regular application code, not an LLM.

## Why this is better than two separate-memory LLMs

If both models maintain independent memory, they can drift apart:

- the interviewer may think the user wants one thing
- the summarizer may infer something else
- debugging becomes difficult
- persistence becomes inconsistent

A shared structured state avoids that problem and makes the system easier to inspect, test, and improve.

## Recommended criteria set

Keep the criteria useful for matching and concrete enough to confirm.

Suggested criteria:

1. `relationship_intention`
2. `communication_style`
3. `lifestyle_social_energy`
4. `values_priorities`
5. `emotional_availability_conflict_style`
6. `partner_traits_sought`
7. `dealbreakers`
8. `pace_boundaries`

These are broad enough to guide matching, but specific enough to discuss in a natural interview.

## Completion rules

Do not stop only because every field is above a flat threshold.

Use three status levels per criterion:

- `missing`
- `tentative`
- `confirmed`

Recommended completion rule:

- all required criteria must be at least `tentative`
- most required criteria should be `confirmed`
- low-confidence inferred items should trigger a confirmation turn
- the flow should end after a final summary and user confirmation

Suggested required criteria:

- `relationship_intention`
- `communication_style`
- `values_priorities`
- `partner_traits_sought`
- `dealbreakers`

Suggested optional-but-helpful criteria:

- `lifestyle_social_energy`
- `emotional_availability_conflict_style`
- `pace_boundaries`

## Confidence design

Do not rely only on the model's self-reported confidence number.

Confidence should be influenced by:

- whether the user said it explicitly
- whether the point was repeated consistently
- whether the point was directly confirmed by the user
- whether the point is still only an inference

Suggested practical scoring interpretation:

- `0.00 - 0.39`: weak / speculative
- `0.40 - 0.69`: tentative
- `0.70 - 0.84`: strong
- `0.85 - 1.00`: confirmed or nearly confirmed

Suggested rule:

- anything inferred with confidence below `0.85` should usually be confirmed before final save

## Stored schema

The main durable state should look roughly like this:

```ts
export type AgentCriterionKey =
  | "relationship_intention"
  | "communication_style"
  | "lifestyle_social_energy"
  | "values_priorities"
  | "emotional_availability_conflict_style"
  | "partner_traits_sought"
  | "dealbreakers"
  | "pace_boundaries";

export type AgentCriterionStatus = "missing" | "tentative" | "confirmed";

export type AgentCriterion = {
  key: AgentCriterionKey;
  label: string;
  summary: string | null;
  structuredValue: unknown;
  confidence: number;
  status: AgentCriterionStatus;
  source: "explicit" | "inferred";
  evidence: string[];
  updatedAt: string;
  needsConfirmation: boolean;
};

export type AgentTranscriptItem = {
  id: string;
  role: "user" | "assistant" | "system";
  modality: "text" | "voice";
  text: string;
  createdAt: string;
};

export type AgentConversationStatus =
  | "collecting"
  | "confirming"
  | "complete";

export type AgentOnboardingState = {
  sessionId: string;
  selectedMode: "text" | "voice" | null;
  turnCount: number;
  status: AgentConversationStatus;
  lastAskedCriterion: AgentCriterionKey | null;
  criteria: AgentCriterion[];
  transcript: AgentTranscriptItem[];
  finalSummary: string | null;
  completedAt: string | null;
};
```

Notes:

- `summary` is what the UI can display.
- `structuredValue` is what later matching systems can consume.
- `evidence` should remain short and human-readable.
- `needsConfirmation` is important because some good inferences should still not be auto-saved as truth.

## Prompting strategy

Prompting should be separated by responsibility.

### Interviewer prompt design

The interviewer prompt should define:

- tone: warm, natural, non-judgmental
- goal: learn the user's dating preferences efficiently
- constraints:
  - ask one focused thing at a time
  - do not interrogate
  - do not overexplain
  - do not ask questions already answered confidently
  - periodically reflect back what has been learned
  - before finishing, confirm the final summary

Important implementation rule:

Do not send the full raw transcript forever if it becomes large. Prefer:

- a recent rolling window of transcript
- the structured profile state
- the missing criteria list

This keeps cost down and avoids prompt bloat.

### Extractor prompt design

The extractor prompt should define:

- the exact schema to produce
- that it must prefer explicit evidence over inference
- that it must return `missing` when evidence is weak
- that it must identify `needsConfirmation` for uncertain inferences

The extractor should be asked to cite short supporting evidence from the transcript, paraphrased or quoted briefly.

## Conversation style guidelines

The app should feel like a guided conversation, not a survey.

Good behaviors:

- start broad, then narrow
- follow up on emotionally meaningful cues
- avoid asking two unrelated questions at once
- use reflective summaries
- gracefully handle vague answers
- offer a correction path when the summary is wrong

Bad behaviors:

- machine-gun questioning
- repeated "tell me more" without direction
- overconfident assumptions
- ending without confirmation

## End-of-conversation confirmation

Before saving, the interviewer should give a concise summary such as:

"Here’s what I’m hearing: you're looking for a serious relationship, value thoughtful communication, want someone kind and emotionally mature, and you’re not interested in heavy party culture. Did I get that right?"

Then the app should:

- allow the user to confirm
- allow the user to correct one or more points
- only mark the session complete after confirmation

This final check is one of the highest-value quality safeguards in the flow.

## Text mode implementation

Recommended text mode behavior:

- standard chat panel with streaming assistant replies
- visible progress indicator across criteria
- subtle "switch to voice" option
- summary / confirmation card near the end

Text mode should be the first mode implemented because it is:

- simpler
- cheaper
- easier to debug
- easier to test

## Voice mode implementation

Voice mode should reuse the same orchestrator and extraction system as text mode.

Only the transport layer should differ.

Recommended voice architecture:

- browser captures microphone input
- app server creates an ephemeral realtime session
- browser connects using WebRTC
- live transcript is shown in the UI
- transcript and extracted state are saved by the app

Recommended initial approach:

- still keep transcript-first state in your app
- always display the text transcript even during voice use
- provide a one-tap fallback to text if voice fails

Important voice-specific requirements:

- microphone permission handling
- reconnect / timeout handling
- interruption behavior
- visible listening / speaking states
- transcript correction support if speech recognition is wrong

## Voice architecture options

### Option A: Realtime speech-to-speech

Pros:

- more natural phone-call feeling
- lower perceived latency
- strongest voice UX

Cons:

- more complex client implementation
- more session state to manage
- higher operational complexity
- likely higher cost

Best fit:

- polished voice-native experience

### Option B: STT -> text orchestration -> TTS

Flow:

1. transcribe user audio
2. run extractor + orchestrator + interviewer on text
3. synthesize assistant reply to speech

Pros:

- easier to reason about
- easier to log and debug
- more modular
- often easier to cost-control in v1

Cons:

- can feel slightly less fluid than full realtime

Best fit:

- practical v1 voice rollout

Recommended choice for first implementation:

- build text mode first
- then build voice using a transcript-centered pipeline
- only move to deeper realtime behavior once the interview flow itself is proven

## Cost guidance

These are rough product-planning estimates, not billing guarantees.

Text-only onboarding should usually be very cheap if prompts remain compact.

Expected rough range:

- often below one cent per user
- can rise if you resend the entire transcript every turn or run multiple large-model passes

Voice onboarding is likely meaningfully more expensive than text onboarding because it adds:

- audio transcription or realtime audio input
- audio generation or realtime audio output
- additional session complexity

For product planning, expect:

- text mode: cheap enough for aggressive experimentation
- voice mode: likely one to two orders of magnitude more expensive than text, depending on implementation and session length

Implementation rule:

- keep prompts tight
- use rolling transcript windows
- store structured state externally
- avoid duplicate extraction calls when nothing materially changed

## Persistence recommendation

This section should use the same persistence pattern as the other onboarding sections, but the saved payload will be more complex.

Recommended saved artifacts:

- selected mode
- transcript
- structured criteria
- final summary
- completion status
- timestamps

Recommended derived payload for later matching systems:

- a compact normalized profile object generated from the final criteria

That normalized profile should be separate from the full transcript so future matching logic can work with a stable schema.

## UI recommendations

Suggested UI pieces:

- mode picker:
  - "Talk by voice"
  - "Chat by text"
- conversation panel
- lightweight criteria progress indicator
- transcript view
- current listening / speaking state for voice
- summary confirmation card before finish

Tone recommendations:

- calm and human
- not too clinical
- not too playful if users are sharing sensitive preferences

## Error handling and fallback behavior

Build graceful fallback paths from the start.

Examples:

- if microphone permission is denied, switch to text mode
- if audio playback fails, show text reply immediately
- if transcript confidence is weak, ask the user to repeat or confirm
- if the model output is malformed, keep prior state and retry extraction

## Privacy and trust considerations

This section collects sensitive preference information, so the UX should make that clear.

Recommended trust features:

- show what is being saved in summary form
- allow users to correct the final summary
- avoid making strong assumptions from weak evidence
- keep transcript visibility user-friendly, especially in voice mode

## Build order

Recommended implementation order:

1. define schema and criteria constants
2. build text-mode UI and transcript persistence
3. implement extractor structured output
4. implement app-level orchestrator and completion logic
5. add final confirmation flow
6. add voice transport and transcript display
7. add voice polish such as interruptions and reconnect handling

This sequence reduces product risk and makes debugging much easier.

## Final recommendation

Section 4 should be built as a shared preference-conversation engine with:

- one interviewer model
- one extractor model
- one deterministic app orchestrator
- one durable structured profile state
- two user-facing input modes: text and voice

The safest and most maintainable design is:

- text mode first
- voice mode second
- structured persistence from day one
- explicit final confirmation before saving

This architecture should give the onboarding flow enough flexibility to feel natural while still producing reliable matching data downstream.
