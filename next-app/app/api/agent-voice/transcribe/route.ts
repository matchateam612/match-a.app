import { NextResponse } from "next/server";

import { assertOpenAiApiEnv } from "@/lib/openai-realtime/env";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("file");

    if (!(audioFile instanceof File)) {
      return jsonError("A voice note file is required.");
    }

    const env = assertOpenAiApiEnv();
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", audioFile, audioFile.name || "voice-note.webm");
    upstreamFormData.append("model", "gpt-4o-transcribe");
    upstreamFormData.append("language", "en");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
      },
      body: upstreamFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return jsonError(
        `Voice transcription failed with ${response.status}: ${errorText || "Unknown upstream error."}`,
        500,
      );
    }

    const payload = (await response.json()) as { text?: string };

    if (!payload.text?.trim()) {
      return jsonError("Voice transcription returned no text.", 500);
    }

    return NextResponse.json({ text: payload.text.trim() }, { status: 200 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "The voice note could not be transcribed.",
      500,
    );
  }
}
