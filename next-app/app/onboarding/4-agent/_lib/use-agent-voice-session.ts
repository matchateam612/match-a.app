"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SubmitAgentTurnResponse } from "./agent-api-types";
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

type RealtimeServerEvent = {
  type?: string;
  transcript?: string;
  response?: { status?: string };
};

function isSubmitAgentTurnResponse(
  payload: SubmitAgentTurnResponse | { error?: string },
): payload is SubmitAgentTurnResponse {
  return (
    "criteria" in payload &&
    "assistantMessage" in payload &&
    "draftSummary" in payload &&
    "status" in payload
  );
}

function isCreateRealtimeSessionResponse(
  payload: CreateRealtimeSessionResponse | { error?: string },
): payload is CreateRealtimeSessionResponse {
  return "client_secret" in payload;
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
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const criteriaRef = useRef(criteria);
  const transcriptRef = useRef(transcript);
  const promptSettingsRef = useRef(promptSettings);
  const criteriaDefinitionsRef = useRef(criteriaDefinitions);

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

  const disconnect = useCallback(() => {
    setConnectionStatus("disconnecting");
    setLiveTranscript("");

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
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
    }
  }, [disconnect, enabled]);

  useEffect(() => disconnect, [disconnect]);

  const speakAssistantMessage = useCallback((assistantMessage: string) => {
    const channel = dataChannelRef.current;

    if (!channel || channel.readyState !== "open") {
      return;
    }

    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          conversation: "none",
          output_modalities: ["audio"],
          instructions:
            "Speak the following dating-app onboarding reply naturally and clearly. Preserve the meaning and stay concise.",
          input: [
            {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: assistantMessage,
                },
              ],
            },
          ],
          metadata: {
            response_purpose: "voice_playback",
          },
        },
      }),
    );
  }, []);

  const processVoiceTurn = useCallback(
    async (userMessage: string) => {
      const normalizedMessage = userMessage.trim();

      if (!normalizedMessage) {
        return;
      }

      const userTranscriptItem = createVoiceTranscriptItem(normalizedMessage, "user");
      const requestTranscript = [...transcriptRef.current, userTranscriptItem];

      onUserTranscript(userTranscriptItem);

      const response = await fetch("/api/agent-turn", {
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

      const payload = (await response.json()) as SubmitAgentTurnResponse | { error?: string };

      if (!response.ok || !isSubmitAgentTurnResponse(payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Voice turn processing failed.",
        );
      }

      onAssistantTurn(payload);
      onStatusChange?.(payload.status);

      if (payload.status !== "complete") {
        speakAssistantMessage(payload.assistantMessage);
      }
    },
    [onAssistantTurn, onError, onStatusChange, onUserTranscript, speakAssistantMessage],
  );

  const connect = useCallback(async () => {
    if (!enabled || connectionStatus === "connecting" || connectionStatus === "connected") {
      return;
    }

    try {
      setConnectionStatus("requesting-permission");
      setLiveTranscript("");

      const tokenResponse = await fetch("/api/agent-voice/session", {
        method: "POST",
      });
      const tokenPayload = (await tokenResponse.json()) as
        | CreateRealtimeSessionResponse
        | { error?: string };

      if (!tokenResponse.ok || !isCreateRealtimeSessionResponse(tokenPayload) || !tokenPayload.client_secret?.value) {
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

      setConnectionStatus("connecting");

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
        onInfo("Voice connection ready. Speak naturally and the same agent logic will process each completed turn.");
      });

      dataChannel.addEventListener("message", async (event) => {
        try {
          const serverEvent = JSON.parse(event.data) as RealtimeServerEvent;

          if (serverEvent.type === "conversation.item.input_audio_transcription.completed") {
            setLiveTranscript("");
            await processVoiceTurn(serverEvent.transcript ?? "");
            return;
          }

          if (serverEvent.type === "conversation.item.input_audio_transcription.delta") {
            setLiveTranscript((current) => `${current}${serverEvent.transcript ?? ""}`);
            return;
          }
        } catch (error) {
          console.error("[agent-voice] Failed to handle realtime data channel event.", error);
        }
      });

      dataChannel.addEventListener("close", () => {
        setConnectionStatus("idle");
      });

      dataChannel.addEventListener("error", () => {
        setConnectionStatus("error");
        onError("The OpenAI Realtime voice data channel encountered an error.");
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${tokenPayload.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Realtime SDP exchange failed with status ${sdpResponse.status}.`);
      }

      const answerSdp = await sdpResponse.text();

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    } catch (error) {
      console.error("[agent-voice] Failed to connect voice session.", error);
      disconnect();
      setConnectionStatus("error");
      onError(
        error instanceof Error ? error.message : "Could not connect the OpenAI Realtime voice session.",
      );
    }
  }, [connectionStatus, disconnect, enabled, onError, onInfo, processVoiceTurn]);

  return {
    connectionStatus,
    liveTranscript,
    connect,
    disconnect,
  };
}
