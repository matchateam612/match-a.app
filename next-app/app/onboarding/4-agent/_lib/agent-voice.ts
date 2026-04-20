export function getVoiceScaffoldStatus(selectedMode: "text" | "voice" | null) {
  if (selectedMode !== "voice") {
    return "Voice mode is optional. Text and voice should share the same conversation engine.";
  }

  return "Voice mode uses OpenAI Realtime over WebRTC for microphone input and spoken playback, while still sending completed turns through the same criteria extraction and interviewer pipeline as text mode.";
}
