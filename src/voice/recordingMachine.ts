import type { RecordingPhase } from "./types";

export type RecordingEvent =
  | { type: "start" }
  | { type: "stop" }
  | { type: "transcript_ok" }
  | { type: "fail"; message?: string }
  | { type: "reset" };

export function reduceRecording(
  phase: RecordingPhase,
  event: RecordingEvent
): RecordingPhase {
  switch (event.type) {
    case "start":
      return phase === "idle" || phase === "error" ? "recording" : phase;
    case "stop":
      return phase === "recording" ? "processing" : phase;
    case "transcript_ok":
      return phase === "processing" ? "idle" : phase;
    case "fail":
      return "error";
    case "reset":
      return "idle";
    default:
      return phase;
  }
}
