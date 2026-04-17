import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const prompt = formData.get("prompt");

  if (!(image instanceof File)) {
    return jsonError("An image file is required.");
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return jsonError("A prompt is required.");
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Image-Transform": "original",
      },
    });
  }

  const upstreamFormData = new FormData();
  upstreamFormData.append("model", "gpt-image-1.5");
  upstreamFormData.append("image", new Blob([imageBuffer], { type: image.type || "image/jpeg" }), image.name);
  upstreamFormData.append("prompt", prompt);
  upstreamFormData.append("size", "1024x1024");
  upstreamFormData.append("quality", "medium");
  upstreamFormData.append("output_format", "jpeg");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstreamFormData,
  });

  if (!response.ok) {
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Image-Transform": "fallback-original",
      },
    });
  }

  const result = (await response.json()) as {
    data?: Array<{
      b64_json?: string;
    }>;
  };
  const generatedBase64 = result.data?.[0]?.b64_json;

  if (!generatedBase64) {
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Image-Transform": "fallback-original",
      },
    });
  }

  const generatedBuffer = Buffer.from(generatedBase64, "base64");

  return new NextResponse(generatedBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
      "X-Image-Transform": "generated",
    },
  });
}
