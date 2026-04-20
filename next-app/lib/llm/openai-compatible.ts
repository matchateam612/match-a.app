import { assertLlmConfigured } from "./env";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type ChatCompletionStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    finish_reason?: string | null;
  }>;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function extractTextContent(content: ChatCompletionResponse["choices"]) {
  const rawContent = choicesFirst(content)?.message?.content;

  if (typeof rawContent === "string") {
    return rawContent;
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function choicesFirst(choices: ChatCompletionResponse["choices"]) {
  return Array.isArray(choices) ? choices[0] : undefined;
}

function extractDeltaTextContent(content: ChatCompletionStreamChunk["choices"]) {
  const rawContent = Array.isArray(content) ? content[0]?.delta?.content : undefined;

  if (typeof rawContent === "string") {
    return rawContent;
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("");
  }

  return "";
}

export async function createOpenAiCompatibleChatCompletion({
  model,
  messages,
  temperature = 0.7,
}: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}) {
  const env = assertLlmConfigured();
  const endpoint = `${normalizeBaseUrl(env.baseUrl)}/chat/completions`;

  console.log("[agent-turn][llm] Sending OpenAI-compatible chat completion request.", {
    provider: env.provider,
    baseUrl: env.baseUrl,
    endpoint,
    model,
    temperature,
    messageCount: messages.length,
  });

  const response = await fetch(`${normalizeBaseUrl(env.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[agent-turn][llm] Upstream LLM request failed.", {
      provider: env.provider,
      baseUrl: env.baseUrl,
      model,
      status: response.status,
      errorText,
    });
    throw new Error(
      `LLM request failed with ${response.status}: ${errorText || "Unknown upstream error."}`,
    );
  }

  const result = (await response.json()) as ChatCompletionResponse;
  const text = extractTextContent(result.choices);

  if (!text) {
    console.error("[agent-turn][llm] Upstream LLM response had no text content.", {
      provider: env.provider,
      baseUrl: env.baseUrl,
      model,
      result,
    });
    throw new Error("LLM response did not include message content.");
  }

  console.log("[agent-turn][llm] Received OpenAI-compatible chat completion response.", {
    provider: env.provider,
    model,
    contentLength: text.length,
  });

  return text;
}

export async function* createOpenAiCompatibleChatCompletionStream({
  model,
  messages,
  temperature = 0.7,
}: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}) {
  const env = assertLlmConfigured();
  const endpoint = `${normalizeBaseUrl(env.baseUrl)}/chat/completions`;

  console.log("[agent-turn][llm] Sending OpenAI-compatible streaming chat completion request.", {
    provider: env.provider,
    baseUrl: env.baseUrl,
    endpoint,
    model,
    temperature,
    messageCount: messages.length,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      stream: true,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[agent-turn][llm] Upstream streaming LLM request failed.", {
      provider: env.provider,
      baseUrl: env.baseUrl,
      model,
      status: response.status,
      errorText,
    });
    throw new Error(
      `LLM streaming request failed with ${response.status}: ${errorText || "Unknown upstream error."}`,
    );
  }

  if (!response.body) {
    throw new Error("LLM streaming response did not include a body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("data:"));

      for (const line of lines) {
        const data = line.slice("data:".length).trim();

        if (!data || data === "[DONE]") {
          continue;
        }

        const parsed = JSON.parse(data) as ChatCompletionStreamChunk;
        const textDelta = extractDeltaTextContent(parsed.choices);

        if (textDelta) {
          yield textDelta;
        }
      }
    }
  }

  if (buffer.trim()) {
    const lines = buffer
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"));

    for (const line of lines) {
      const data = line.slice("data:".length).trim();

      if (!data || data === "[DONE]") {
        continue;
      }

      const parsed = JSON.parse(data) as ChatCompletionStreamChunk;
      const textDelta = extractDeltaTextContent(parsed.choices);

      if (textDelta) {
        yield textDelta;
      }
    }
  }
}
