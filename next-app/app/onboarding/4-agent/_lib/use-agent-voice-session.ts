"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CreateInitialVoiceTurnContextRequest,
  CreateVoiceTurnContextResponse,
  ResolveAgentTurnExtractionResponse,
  SubmitAgentTurnResponse,
} from "./agent-api-types";
import type { CreateRealtimeSessionResponse } from "./agent-voice-types";
import type {
  AgentConversationStatus,
  AgentCriterionDefinition,
  AgentCriterionState,
  AgentPromptSettings,
  AgentTranscriptItem,
  AgentVoiceConnectionStatus,
} from "./agent-types";

type UseAgentVoiceSessionOptions = {
  enabled: boolean;
  transcript: AgentTranscriptItem[];
  criteria: AgentCriterionState[];
  criteriaDefinitions: AgentCriterionDefinition[];
  promptSettings: AgentPromptSettings;
  onUserTranscript: (message: AgentTranscriptItem) => void;
  onAssistantTurn: (payload: SubmitAgentTurnResponse) => void;
  onStatusChange?: (status: AgentConversationStatus) => void;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
};

type InitialVoiceTurnContextOptions = CreateInitialVoiceTurnContextRequest;

type RealtimeServerEvent = {
  type?: string;
  transcript?: string;
  delta?: string;
  text?: string;
  response?: { status?: string };
};

function isCreateRealtimeSessionResponse(
  payload: CreateRealtimeSessionResponse | { error?: string },
): payload is CreateRealtimeSessionResponse {
  return "client_secret" in payload || "value" in payload;
}

function getRealtimeEphemeralKey(payload: CreateRealtimeSessionResponse) {
  if (typeof payload.value === "string" && payload.value.trim()) {
    return payload.value;
  }

  if (typeof payload.client_secret?.value === "string" && payload.client_secret.value.trim()) {
    return payload.client_secret.value;
  }

  return "";
}

function isCreateVoiceTurnContextResponse(
  payload: CreateVoiceTurnContextResponse | { error?: string },
): payload is CreateVoiceTurnContextResponse {
  return "instructions" in payload && "inputText" in payload && "status" in payload;
}

function isResolveAgentTurnExtractionResponse(
  payload: ResolveAgentTurnExtractionResponse | { error?: string },
): payload is ResolveAgentTurnExtractionResponse {
  return "criteria" in payload && "draftSummary" in payload && "status" in payload;
}

function createVoiceTranscriptItem(text: string, role: "assistant" | "user"): AgentTranscriptItem {
  return {
    id: `${role}-voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    modality: "voice",
    text,
    createdAt: new Date().toISOString(),
  };
}

export function useAgentVoiceSession({
  enabled,
  transcript,
  criteria,
  criteriaDefinitions,
  promptSettings,
  onUserTranscript,
  onAssistantTurn,
  onStatusChange,
  onError,
  onInfo,
}: UseAgentVoiceSessionOptions) {
  const [connectionStatus, setConnectionStatus] = useState<AgentVoiceConnectionStatus>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [activityLabel, setActivityLabel] = useState("Waiting to connect");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const criteriaRef = useRef(criteria);
  const transcriptRef = useRef(transcript);
  const promptSettingsRef = useRef(promptSettings);
  const criteriaDefinitionsRef = useRef(criteriaDefinitions);
  const onAssistantTurnRef = useRef(onAssistantTurn);
  const onStatusChangeRef = useRef(onStatusChange);
  const initialVoiceTurnContextRef = useRef<InitialVoiceTurnContextOptions | null>(null);
  const pendingAssistantTranscriptRef = useRef("");
  const pendingVoiceAssistantTextRef = useRef<Promise<string | null> | null>(null);
  const pendingVoiceShouldPersistAssistantRef = useRef(false);
  const pendingVoiceTurnResolutionRef = useRef<Promise<ResolveAgentTurnExtractionResponse> | null>(null);
  const pendingVoiceTurnSnapshotRef = useRef<{
    draftSummary: string;
    status: AgentConversationStatus;
    lastAskedCriterionId: string | null;
  } | null>(null);

  useEffect(() => {
    criteriaRef.current = criteria;
  }, [criteria]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    promptSettingsRef.current = promptSettings;
  }, [promptSettings]);

  useEffect(() => {
    criteriaDefinitionsRef.current = criteriaDefinitions;
  }, [criteriaDefinitions]);

  useEffect(() => {
    onAssistantTurnRef.current = onAssistantTurn;
  }, [onAssistantTurn]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const disconnect = useCallback(() => {
    setConnectionStatus("disconnecting");
    setLiveTranscript("");
    setActivityLabel("Disconnecting");

    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current.pause();
    }

    setConnectionStatus("idle");
    setActivityLabel("Waiting to connect");
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
    }
  }, [disconnect, enabled]);

  useEffect(() => disconnect, [disconnect]);

  const requestRealtimeResponse = useCallback(({
    instructions,
    inputText,
  }: {
    instructions: string;
    inputText: string;
  }) => {
    const channel = dataChannelRef.current;

    if (!channel || channel.readyState !== "open") {
      return;
    }

    pendingAssistantTranscriptRef.current = "";
    setActivityLabel("Responding");

    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          conversation: "none",
          output_modalities: ["audio", "text"],
          instructions,
          input: [
            {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: inputText,
                },
              ],
            },
          ],
          metadata: {
            response_purpose: "voice_turn_response",
          },
        },
      }),
    );
  }, []);

  const queueInitialVoiceTurnContext = useCallback((options: InitialVoiceTurnContextOptions | null) => {
    initialVoiceTurnContextRef.current = options;
  }, []);

  const requestInitialVoiceTurn = useCallback(async () => {
    const pendingContext = initialVoiceTurnContextRef.current;

    if (!pendingContext) {
      return;
    }

    const response = await fetch("/api/agent-turn/initial-voice-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pendingContext),
    });

    const payload = (await response.json()) as CreateVoiceTurnContextResponse | { error?: string };

    if (!response.ok || !isCreateVoiceTurnContextResponse(payload)) {
      throw new Error(
        "error" in payload && payload.error
          ? payload.error
          : "Initial voice turn context preparation failed.",
      );
    }

    initialVoiceTurnContextRef.current = null;
    pendingVoiceShouldPersistAssistantRef.current = true;
    pendingVoiceAssistantTextRef.current = null;
    pendingVoiceTurnResolutionRef.current = null;
    pendingVoiceTurnSnapshotRef.current = {
      draftSummary: payload.draftSummary,
      status: payload.status,
      lastAskedCriterionId: payload.lastAskedCriterionId,
    };
    onStatusChangeRef.current?.(payload.status);
    setActivityLabel("Responding");
    requestRealtimeResponse({
      instructions: payload.instructions,
      inputText: payload.inputText,
    });
  }, [requestRealtimeResponse]);

  const processVoiceTurn = useCallback(
    async (userMessage: string) => {
      const normalizedMessage = userMessage.trim();

      if (!normalizedMessage) {
        return;
      }

      const userTranscriptItem = createVoiceTranscriptItem(normalizedMessage, "user");
      const requestTranscript = [...transcriptRef.current, userTranscriptItem];

      onUserTranscript(userTranscriptItem);
      const voiceContextResponse = await fetch("/api/agent-turn/voice-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedMode: "voice",
          userMessage: normalizedMessage,
          transcript: requestTranscript,
          criteriaDefinitions: criteriaDefinitionsRef.current,
          criteria: criteriaRef.current,
          interviewerSystemPrompt: promptSettingsRef.current.interviewerSystemPrompt,
        }),
      });

      const voiceContextPayload = (await voiceContextResponse.json()) as
        | CreateVoiceTurnContextResponse
        | { error?: string };

      if (!voiceContextResponse.ok || !isCreateVoiceTurnContextResponse(voiceContextPayload)) {
        throw new Error(
          "error" in voiceContextPayload && voiceContextPayload.error
            ? voiceContextPayload.error
            : "Voice turn context preparation failed.",
        );
      }

      pendingVoiceTurnSnapshotRef.current = {
        draftSummary: voiceContextPayload.draftSummary,
        status: voiceContextPayload.status,
        lastAskedCriterionId: voiceContextPayload.lastAskedCriterionId,
      };
      pendingVoiceShouldPersistAssistantRef.current = true;

      pendingVoiceTurnResolutionRef.current = fetch("/api/agent-turn/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedMode: "voice",
          userMessage: normalizedMessage,
          transcript: requestTranscript,
          criteriaDefinitions: criteriaDefinitionsRef.current,
          criteria: criteriaRef.current,
          interviewerSystemPrompt: promptSettingsRef.current.interviewerSystemPrompt,
        }),
      })
        .then(async (response) => {
          const payload = (await response.json()) as
            | ResolveAgentTurnExtractionResponse
            | { error?: string };

          if (!response.ok || !isResolveAgentTurnExtractionResponse(payload)) {
            throw new Error(
              "error" in payload && payload.error
                ? payload.error
                : "Voice extraction update failed.",
            );
          }

          return payload;
        });

      pendingVoiceAssistantTextRef.current = fetch("/api/agent-turn/voice-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedMode: "voice",
          userMessage: normalizedMessage,
          transcript: requestTranscript,
          criteriaDefinitions: criteriaDefinitionsRef.current,
          criteria: criteriaRef.current,
          interviewerSystemPrompt: promptSettingsRef.current.interviewerSystemPrompt,
        }),
      })
        .then(async (response) => {
          const payload = (await response.json()) as SubmitAgentTurnResponse | { error?: string };

          if (
            !response.ok ||
            !("assistantMessage" in payload && typeof payload.assistantMessage === "string")
          ) {
            throw new Error(
              "error" in payload && payload.error
                ? payload.error
                : "Voice assistant transcript failed.",
            );
          }

          return payload.assistantMessage;
        });

      onStatusChangeRef.current?.(voiceContextPayload.status);
      setActivityLabel("Responding");
      requestRealtimeResponse({
        instructions: voiceContextPayload.instructions,
        inputText: voiceContextPayload.inputText,
      });
    },
    [onUserTranscript, requestRealtimeResponse],
  );

  const connect = useCallback(async () => {
    if (!enabled || connectionStatus === "connecting" || connectionStatus === "connected") {
      return;
    }

    try {
      setConnectionStatus("requesting-permission");
      setLiveTranscript("");
      setActivityLabel("Preparing voice");
      console.log("[agent-voice] Starting voice connection flow.");

      const tokenResponse = await fetch("/api/agent-voice/session", {
        method: "POST",
      });
      const tokenPayload = (await tokenResponse.json()) as
        | CreateRealtimeSessionResponse
        | { error?: string };
      const ephemeralKey = isCreateRealtimeSessionResponse(tokenPayload)
        ? getRealtimeEphemeralKey(tokenPayload)
        : "";
      console.log("[agent-voice] Realtime session response received.", {
        ok: tokenResponse.ok,
        status: tokenResponse.status,
        payload: tokenPayload,
        hasEphemeralKey: Boolean(ephemeralKey),
      });

      if (!tokenResponse.ok || !isCreateRealtimeSessionResponse(tokenPayload) || !ephemeralKey) {
        throw new Error(
          "error" in tokenPayload && tokenPayload.error
            ? tokenPayload.error
            : "Could not create an OpenAI Realtime session.",
        );
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = mediaStream;
      console.log("[agent-voice] Microphone access granted.", {
        trackCount: mediaStream.getAudioTracks().length,
      });

      setConnectionStatus("connecting");
      setActivityLabel("Connecting to voice");

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElementRef.current = audioElement;

      peerConnection.ontrack = (event) => {
        audioElement.srcObject = event.streams[0];
      };

      mediaStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, mediaStream);
      });

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", () => {
        setConnectionStatus("connected");
        setActivityLabel("Listening");
        console.log("[agent-voice] Realtime data channel opened.");
        onInfo("Voice connection ready. Speak naturally and the app will keep the conversation state in sync.");

        if (initialVoiceTurnContextRef.current) {
          void requestInitialVoiceTurn().catch((error) => {
            console.error("[agent-voice] Failed to request initial voice turn.", error);
            onError(
              error instanceof Error ? error.message : "The initial voice turn could not be started.",
            );
          });
        }
      });

      dataChannel.addEventListener("message", async (event) => {
        try {
          const serverEvent = JSON.parse(event.data) as RealtimeServerEvent;
          console.log("[agent-voice] Realtime event received.", serverEvent);

          if (serverEvent.type === "conversation.item.input_audio_transcription.completed") {
            setLiveTranscript("");
            setActivityLabel("Thinking through your reply");
            await processVoiceTurn(serverEvent.transcript ?? "");
            return;
          }

          if (serverEvent.type === "conversation.item.input_audio_transcription.delta") {
            setActivityLabel("Listening");
            setLiveTranscript((current) => `${current}${serverEvent.transcript ?? ""}`);
            return;
          }

          if (
            serverEvent.type === "response.audio_transcript.delta" ||
            serverEvent.type === "response.text.delta"
          ) {
            const nextDelta = serverEvent.delta ?? serverEvent.transcript ?? serverEvent.text ?? "";

            if (nextDelta) {
              pendingAssistantTranscriptRef.current += nextDelta;
            }
            return;
          }

          if (
            serverEvent.type === "response.audio_transcript.done" ||
            serverEvent.type === "response.output_text.done"
          ) {
            const finalText = serverEvent.transcript ?? serverEvent.text ?? "";

            if (
              finalText &&
              !pendingAssistantTranscriptRef.current.includes(finalText)
            ) {
              pendingAssistantTranscriptRef.current += finalText;
            }
            return;
          }

          if (serverEvent.type === "response.done") {
            const shouldPersistAssistant = pendingVoiceShouldPersistAssistantRef.current;
            const assistantMessageFromApp = pendingVoiceAssistantTextRef.current
              ? await pendingVoiceAssistantTextRef.current.catch((error) => {
                  console.error("[agent-voice] Voice assistant transcript generation failed.", error);
                  return null;
                })
              : null;
            const assistantMessage =
              assistantMessageFromApp?.trim() || pendingAssistantTranscriptRef.current.trim();
            const extractionResult = pendingVoiceTurnResolutionRef.current
              ? await pendingVoiceTurnResolutionRef.current.catch((error) => {
                  console.error("[agent-voice] Voice extraction resolution failed.", error);
                  return null;
                })
              : null;
            const snapshot = pendingVoiceTurnSnapshotRef.current;

            pendingVoiceTurnResolutionRef.current = null;
            pendingVoiceTurnSnapshotRef.current = null;
            pendingVoiceAssistantTextRef.current = null;
            pendingVoiceShouldPersistAssistantRef.current = false;
            pendingAssistantTranscriptRef.current = "";

            if (!shouldPersistAssistant) {
              setActivityLabel("Listening");
              return;
            }

            if (!assistantMessage) {
              setActivityLabel("Listening");
              return;
            }

            onAssistantTurnRef.current({
              criteria: extractionResult?.criteria ?? criteriaRef.current,
              assistantMessage,
              draftSummary: extractionResult?.draftSummary ?? snapshot?.draftSummary ?? "",
              status: extractionResult?.status ?? snapshot?.status ?? "collecting",
              lastAskedCriterionId:
                extractionResult?.lastAskedCriterionId ?? snapshot?.lastAskedCriterionId ?? null,
              extractorRawOutput: extractionResult?.extractorRawOutput ?? "",
            });
            onStatusChangeRef.current?.(extractionResult?.status ?? snapshot?.status ?? "collecting");
            setActivityLabel("Listening");
            return;
          }
        } catch (error) {
          console.error("[agent-voice] Failed to handle realtime data channel event.", error);
        }
      });

      dataChannel.addEventListener("close", () => {
        setConnectionStatus("idle");
        setActivityLabel("Waiting to connect");
      });

      dataChannel.addEventListener("error", () => {
        setConnectionStatus("error");
        setActivityLabel("Voice session error");
        onError("The OpenAI Realtime voice data channel encountered an error.");
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("[agent-voice] Created local WebRTC offer.", {
        sdpLength: offer.sdp?.length ?? 0,
      });

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("[agent-voice] Realtime SDP exchange failed.", {
          status: sdpResponse.status,
          errorText,
        });
        throw new Error(
          `Realtime SDP exchange failed with status ${sdpResponse.status}: ${errorText || "Unknown upstream error."}`,
        );
      }

      const answerSdp = await sdpResponse.text();
      console.log("[agent-voice] Received remote WebRTC answer.", {
        sdpLength: answerSdp.length,
      });

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
      console.log("[agent-voice] Remote description set successfully.");
    } catch (error) {
      console.error("[agent-voice] Failed to connect voice session.", error);
      disconnect();
      setConnectionStatus("error");
      setActivityLabel("Voice session error");
      onError(
        error instanceof Error ? error.message : "Could not connect the OpenAI Realtime voice session.",
      );
    }
  }, [connectionStatus, disconnect, enabled, onError, onInfo, processVoiceTurn, requestInitialVoiceTurn]);

  return {
    connectionStatus,
    activityLabel,
    liveTranscript,
    connect,
    disconnect,
    queueInitialVoiceTurnContext,
  };
}
