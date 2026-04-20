export function getVoiceScaffoldStatus(selectedMode: "text" | "voice" | null) {
  if (selectedMode !== "voice") {
    return "Voice mode is optional. Text and voice share the same conversation engine and profile state.";
  }

  return "Voice mode uses OpenAI Realtime for live microphone input and spoken replies while the app keeps prompt construction, turn snapshots, and profile updates consistent with text mode.";
}
