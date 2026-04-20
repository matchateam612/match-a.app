const defaultRealtimeModel = "gpt-realtime";
const defaultRealtimeVoice = "marin";

function readEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    return "";
  }

  return value.trim();
}

export function getOpenAiRealtimeEnv() {
  return {
    apiKey: readEnv("OPENAI_API_KEY"),
    model: readEnv("OPENAI_REALTIME_MODEL") || defaultRealtimeModel,
    voice: readEnv("OPENAI_REALTIME_VOICE") || defaultRealtimeVoice,
  };
}

export function assertOpenAiRealtimeEnv() {
  const env = getOpenAiRealtimeEnv();

  if (!env.apiKey) {
    throw new Error("Missing OPENAI_API_KEY for OpenAI Realtime voice.");
  }

  return env;
}
