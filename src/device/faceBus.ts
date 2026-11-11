/**
 * Cross-window bus for mock face animation state.
 * Main window publishes on play(); face window subscribes.
 */

export type FaceDisplayState = {
  /** When true, UI should interrupt and switch immediately */
  force?: boolean;
  animationId: string;
  label: string;
  at: number;
  connected: boolean;
};

const CHANNEL = "taby-mock-face";
const STORAGE_KEY = "taby-mock-face-state";

export const FACE_LABELS: Record<string, string> = {
  listening: "Listening",
  listening_loop: "Listening",
  listening_in: "Listening",
  listening_music_loop: "Vibing",
  thinking: "Thinking",
  searching_loop: "Searching",
  busy_loop: "Busy",
  working_loop: "Thinking",
  creating_task_loop: "On it",
  confirmation: "Done!",
  error: "Oops",
  disappointed: "Oops",
  idle: "Idle",
  idle_01_loop: "Idle",
  idle_02_loop: "Idle",
  idle_variation_loop: "Idle",
  happy: "Happy",
  sad: "Sad",
  wave: "Wave",
  thumbs_up: "Yes!",
  yeah: "Yeah!",
  task_completed: "Done!",
  task_created: "Task added",
  hello_disappointed: "Oops",
  drink_water: "Drink water",
  posture_check: "Sit up straight",
  break_start: "Take a break",
  copy_paste: "Paste!",
  fishing_short: "Fishing",
  fishing_long: "Still fishing",
  stretching: "Stretch",
  basketball_dunk: "Dunk!",
  basketball_throw: "Shoot!",
  f1_car: "Vroom",
  boxing: "Pow",
  blush: "Blush",
  love_01: "Love",
  wow: "Wow",
  flower_grow: "Grow",
  trophy: "Trophy",
  angry_01_loop: "Grr",
  relaxing_01_loop: "Chill",
  sleeping_loop: "Zzz",
  lockin: "Lock in",
  delete_01: "Deleted",
  READY: "Ready",
};

export function publishFaceState(state: FaceDisplayState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage(state);
    ch.close();
  } catch {
    /* ignore */
  }
  // Same-window listeners
  window.dispatchEvent(new CustomEvent("taby-face", { detail: state }));
}

export function readFaceState(): FaceDisplayState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FaceDisplayState;
  } catch {
    return null;
  }
}

export function subscribeFaceState(
  handler: (state: FaceDisplayState) => void
): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        handler(JSON.parse(e.newValue) as FaceDisplayState);
      } catch {
        /* ignore */
      }
    }
  };
  const onCustom = (e: Event) => {
    handler((e as CustomEvent<FaceDisplayState>).detail);
  };
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (ev) => handler(ev.data as FaceDisplayState);
  } catch {
    ch = null;
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("taby-face", onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("taby-face", onCustom);
    ch?.close();
  };
}
