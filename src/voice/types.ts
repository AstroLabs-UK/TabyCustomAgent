export type RecordingPhase = "idle" | "recording" | "processing" | "error";

export type SttResult = {
  transcript: string;
  confidence?: number;
};

export interface SttProvider {
  readonly name: string;
  transcribe(blob: Blob): Promise<SttResult>;
}
