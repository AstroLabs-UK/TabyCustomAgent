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
  "angry_01_loop": "Angry",
  "angry_02_loop": "Angry",
  "basketball_dunk": "Dunk",
  "basketball_throw": "Basketball",
  "blush": "Blush",
  "boxing": "Boxing",
  "break_start": "Break",
  "busy_loop": "Busy",
  "calendar_in": "Calendar",
  "calendar_loop": "Calendar",
  "circle": "Home",
  "confirmation": "Done",
  "copy_paste": "Settings",
  "creating_task_loop": "Creating",
  "delete_01": "Delete",
  "disappointed": "Focus",
  "drink_water": "Water",
  "f1_car": "Sprint",
  "fishing_long": "Fishing Long",
  "fishing_short": "Fishing Short",
  "flower_grow": "Grow",
  "hello_annoyed": "Focus",
  "idle_01_loop": "Idle",
  "calm_idle_01_f000": "Idle",
  "calm_idle_01_to_f137": "Idle",
  "calm_idle_01_f137": "Idle",
  "calm_idle_01_f137_to_f177": "Idle",
  "calm_idle_01_f177": "Idle",
  "calm_idle_01_f177_to_f216": "Idle",
  "calm_idle_01_f216": "Idle",
  "calm_work_low_f000": "Working",
  "calm_work_medium_f000": "Working",
  "calm_work_high_f000": "Working",
  "idle_02_loop": "Idle",
  "idle_variation_loop": "Idle",
  "listening_in": "Listening",
  "listening_loop": "Listening",
  "listening_music_loop": "Music",
  "lockin": "Lock In",
  "love_01": "Love",
  "perfect_day_01": "Perfect Day",
  "perfect_day_01_simple": "Perfect Day",
  "perfect_day_02": "Perfect Day",
  "perfect_day_03": "Perfect Day",
  "posture_check": "Posture",
  "relaxing_01_loop": "Break",
  "relaxing_couch_in": "Relax",
  "relaxing_couch_loop": "Relax",
  "sleeping_loop": "Away",
  "square": "Habits",
  "startup": "Startup",
  "stretching": "Stretching",
  "talking_default_loop": "Talking",
  "task_completed": "Done",
  "task_created": "Created",
  "task_page": "Tasks",
  "thumbs_up": "Yes",
  "trophy": "Trophy",
  "turn_off_reddit": "Focus",
  "turn_off_scroll": "Focus",
  "turn_off_tv": "Focus",
  "waiting_01": "Waiting",
  "working_in": "Working",
  "working_loop": "Working",
  "working_laptop_in": "Working",
  "working_laptop_loop": "Working",
  "working_laptop_bored_loop": "Working",
  "working_laptop_excited_loop": "Working",
  "working_laptop_normal_loop": "Working",
  "workspaces_in": "Folder",
  "workspaces_loop": "Folder",
  "wow": "Wow",
  "codex_in": "Codex",
  "codex_loop": "Codex",
  "day_planned": "Planned",
  "hello_disappointed": "Hello",
  "claude_in": "Claude",
  "claude_loop": "Claude",
  "taby_response_ready_in": "Taby",
  "taby_response_ready_loop": "Taby",
  "yeah": "Yeah",
  "no": "No",
  "review": "Review",
  "searching_loop": "Searching"
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
