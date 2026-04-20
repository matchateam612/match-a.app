import { NextResponse } from "next/server";

import { assertOpenAiRealtimeEnv } from "@/lib/openai-realtime/env";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST() {
  try {
    const env = assertOpenAiRealtimeEnv();
    console.log("[agent-voice][session] Creating realtime client secret.", {
      model: env.model,
      voice: env.voice,
      hasApiKey: Boolean(env.apiKey),
    });

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: env.model,
          audio: {
            input: {
              transcription: {
                model: "gpt-4o-transcribe",
                language: "en",
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 700,
                create_response: false,
              },
            },
            output: {
              voice: env.voice,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[agent-voice][session] Failed to mint realtime client secret.", {
        status: response.status,
        errorText,
      });
      return jsonError(
        `OpenAI Realtime session request failed with ${response.status}: ${errorText || "Unknown upstream error."}`,
        500,
      );
    }

    const data = await response.json();
    console.log("[agent-voice][session] Realtime client secret created.", {
      id: typeof data?.id === "string" ? data.id : null,
      hasClientSecret: Boolean(data?.client_secret?.value),
      rawKeys: data && typeof data === "object" ? Object.keys(data) : [],
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[agent-voice][session] Failed to create realtime session.", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(
      error instanceof Error ? error.message : "Could not create realtime session.",
      500,
    );
  }
}
