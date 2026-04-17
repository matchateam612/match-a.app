export function getVoiceScaffoldStatus(selectedMode: "text" | "voice" | null) {
  if (selectedMode !== "voice") {
    return "Voice mode is optional. Text and voice should share the same conversation engine.";
  }

  return "Voice transport is scaffolded next to the same shared state. Realtime audio wiring can be added here later.";
}
