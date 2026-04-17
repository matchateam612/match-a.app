const defaultBaseUrl = "https://api.openai.com/v1";
const defaultInterviewerModel = "gpt-4.1-mini";
const defaultExtractorModel = "gpt-4.1-mini";

function readEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    return "";
  }

  return value.trim();
}

export function getLlmEnv() {
  return {
    provider: readEnv("LLM_PROVIDER") || "openai-compatible",
    apiKey: readEnv("LLM_API_KEY"),
    baseUrl: readEnv("LLM_BASE_URL") || defaultBaseUrl,
    interviewerModel: readEnv("LLM_INTERVIEWER_MODEL") || defaultInterviewerModel,
    extractorModel: readEnv("LLM_EXTRACTOR_MODEL") || defaultExtractorModel,
  };
}

export function assertLlmConfigured() {
  const env = getLlmEnv();

  if (!env.apiKey) {
    throw new Error("Missing LLM_API_KEY.");
  }

  return env;
}
