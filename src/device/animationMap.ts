/**
 * Animation map generated from firmware-taby amoled-1.64 catalog.json
 * Pack version: 0.3.3
 */

export type FaceState = "listening" | "busy" | "done" | "error" | "idle";

export type AnimationMap = {
  version: number;
  states: Record<FaceState, string>;
  alternatives: Partial<Record<FaceState, string[]>>;
  knownAnimationIds: string[];
  durationsMs: Record<string, number>;
  postDoneDelayMs: number;
};

export const CATALOG_ANIMATION_IDS = [
  "angry_01_loop",
  "angry_02_loop",
  "basketball_dunk",
  "basketball_throw",
  "blush",
  "boxing",
  "break_start",
  "busy_loop",
  "calendar_in",
  "calendar_loop",
  "circle",
  "confirmation",
  "copy_paste",
  "creating_task_loop",
  "delete_01",
  "disappointed",
  "drink_water",
  "f1_car",
  "fishing_long",
  "fishing_short",
  "flower_grow",
  "hello_annoyed",
  "idle_01_loop",
  "calm_idle_01_f000",
  "calm_idle_01_to_f137",
  "calm_idle_01_f137",
  "calm_idle_01_f137_to_f177",
  "calm_idle_01_f177",
  "calm_idle_01_f177_to_f216",
  "calm_idle_01_f216",
  "calm_work_low_f000",
  "calm_work_medium_f000",
  "calm_work_high_f000",
  "idle_02_loop",
  "idle_variation_loop",
  "listening_in",
  "listening_loop",
  "listening_music_loop",
  "lockin",
  "love_01",
  "perfect_day_01",
  "perfect_day_01_simple",
  "perfect_day_02",
  "perfect_day_03",
  "posture_check",
  "relaxing_01_loop",
  "relaxing_couch_in",
  "relaxing_couch_loop",
  "sleeping_loop",
  "square",
  "startup",
  "stretching",
  "talking_default_loop",
  "task_completed",
  "task_created",
  "task_page",
  "thumbs_up",
  "trophy",
  "turn_off_reddit",
  "turn_off_scroll",
  "turn_off_tv",
  "waiting_01",
  "working_in",
  "working_loop",
  "working_laptop_in",
  "working_laptop_loop",
  "working_laptop_bored_loop",
  "working_laptop_excited_loop",
  "working_laptop_normal_loop",
  "workspaces_in",
  "workspaces_loop",
  "wow",
  "codex_in",
  "codex_loop",
  "day_planned",
  "hello_disappointed",
  "claude_in",
  "claude_loop",
  "taby_response_ready_in",
  "taby_response_ready_loop",
  "yeah",
  "no",
  "review",
  "searching_loop"
] as const;

export type CatalogAnimationId = (typeof CATALOG_ANIMATION_IDS)[number] | string;

export const DEFAULT_ANIMATION_MAP: AnimationMap = {
  version: 10,
  states: {
    listening: "listening_loop",
    busy: "working_loop",
    done: "confirmation",
    error: "disappointed",
    idle: "idle_01_loop",
  },
  alternatives: {
    listening: ["listening_loop", "listening_in", "listening_music_loop"],
    busy: ["working_loop", "working_laptop_loop", "searching_loop", "creating_task_loop"],
    done: ["confirmation", "thumbs_up", "yeah", "task_completed", "trophy", "wow"],
    error: ["disappointed", "hello_disappointed", "no", "angry_01_loop"],
    idle: ["idle_01_loop", "idle_02_loop", "idle_variation_loop", "relaxing_01_loop"],
  },
  knownAnimationIds: [
    "listening_loop",
    "listening_in",
    "busy_loop",
    "working_loop",
    "confirmation",
    "thumbs_up",
    "yeah",
    "task_completed",
    "disappointed",
    "hello_disappointed",
    "idle_01_loop",
    "idle_02_loop",
    "listening",
    "thinking",
    "error",
    "idle",
    // Wellness / break cues (stock firmware IDs; mock maps to closest GIF)
    "drink_water",
    "posture_check",
    "break_start",
  ],
  durationsMs: {
    listening_loop: 2667,
    listening_in: 2000,
    busy_loop: 3500,
    working_loop: 1333,
    confirmation: 1958,
    thumbs_up: 3167,
    yeah: 2333,
    task_completed: 3125,
    disappointed: 2792,
    hello_disappointed: 4250,
    idle_01_loop: 9042,
    idle_02_loop: 7875,
    drink_water: 2800,
    posture_check: 2800,
    break_start: 2500,
  },
  /** Extra dwell after done/error one-shot before idle */
  postDoneDelayMs: 1200,
};

export const FACE_GIF_BY_ID: Record<string, string> = {
  listening_loop: "/taby-faces/listening_loop.gif",
  listening_in: "/taby-faces/listening_in.gif",
  listening_music_loop: "/taby-faces/listening_music_loop.gif",
  busy_loop: "/taby-faces/busy_loop.gif",
  working_loop: "/taby-faces/working_loop.gif",
  working_laptop_loop: "/taby-faces/working_laptop_loop.gif",
  working_laptop_bored_loop: "/taby-faces/working_laptop_bored_loop.gif",
  working_laptop_excited_loop: "/taby-faces/working_laptop_excited_loop.gif",
  working_laptop_normal_loop: "/taby-faces/working_laptop_normal_loop.gif",
  confirmation: "/taby-faces/confirmation.gif",
  thumbs_up: "/taby-faces/thumbs_up.gif",
  yeah: "/taby-faces/yeah.gif",
  task_completed: "/taby-faces/task_completed.gif",
  task_created: "/taby-faces/task_created.gif",
  disappointed: "/taby-faces/disappointed.gif",
  hello_disappointed: "/taby-faces/hello_disappointed.gif",
  idle_01_loop: "/taby-faces/idle_01_loop.gif",
  idle_02_loop: "/taby-faces/idle_02_loop.gif",
  idle_variation_loop: "/taby-faces/idle_variation_loop.gif",
  listening: "/taby-faces/listening_loop.gif",
  thinking: "/taby-faces/working_loop.gif",
  error: "/taby-faces/disappointed.gif",
  idle: "/taby-faces/idle_01_loop.gif",
  drink_water: "/taby-faces/drink_water.gif",
  posture_check: "/taby-faces/posture_check.gif",
  break_start: "/taby-faces/break_start.gif",
  copy_paste: "/taby-faces/copy_paste.gif",
  fishing_short: "/taby-faces/fishing_short.gif",
  fishing_long: "/taby-faces/fishing_long.gif",
  stretching: "/taby-faces/stretching.gif",
  basketball_dunk: "/taby-faces/basketball_dunk.gif",
  basketball_throw: "/taby-faces/basketball_throw.gif",
  f1_car: "/taby-faces/f1_car.gif",
  boxing: "/taby-faces/boxing.gif",
  circle: "/taby-faces/circle.gif",
  square: "/taby-faces/square.gif",
  blush: "/taby-faces/blush.gif",
  love_01: "/taby-faces/love_01.gif",
  wow: "/taby-faces/wow.gif",
  flower_grow: "/taby-faces/flower_grow.gif",
  trophy: "/taby-faces/trophy.gif",
  angry_01_loop: "/taby-faces/angry_01_loop.gif",
  angry_02_loop: "/taby-faces/angry_02_loop.gif",
  relaxing_01_loop: "/taby-faces/relaxing_01_loop.gif",
  sleeping_loop: "/taby-faces/sleeping_loop.gif",
  creating_task_loop: "/taby-faces/creating_task_loop.gif",
  searching_loop: "/taby-faces/searching_loop.gif",
  lockin: "/taby-faces/lockin.gif",
  delete_01: "/taby-faces/delete_01.gif",
};

/** Prefer semantic name; hash path also shipped under public/taby-faces/a/ */
/** @deprecated alias — tools/registry still imports GIF_PATHS */
export const GIF_PATHS: Record<string, string> = FACE_GIF_BY_ID;

export function gifForAnimationId(id: string): string | null {
  if (GIF_PATHS[id]) return GIF_PATHS[id];
  // alias common shorts
  const aliases: Record<string, string> = {
    idle: "idle_01_loop",
    thinking: "working_loop",
    done: "confirmation",
    yes: "thumbs_up",
  };
  const a = aliases[id];
  return a && GIF_PATHS[a] ? GIF_PATHS[a] : null;
}

export function durationMsFor(
  map: AnimationMap,
  id: string,
  fallback = 2000
): number {
  return map.durationsMs[id] ?? fallback;
}

export const LOOPING_ANIMATION_IDS = new Set<string>(["angry_01_loop", "angry_02_loop", "busy_loop", "calendar_loop", "calm_idle_01_f000", "calm_idle_01_f137", "calm_idle_01_f177", "calm_idle_01_f216", "calm_work_high_f000", "calm_work_low_f000", "calm_work_medium_f000", "claude_loop", "codex_loop", "creating_task_loop", "idle_01_loop", "idle_02_loop", "idle_variation_loop", "listening_loop", "listening_music_loop", "relaxing_01_loop", "relaxing_couch_loop", "searching_loop", "sleeping_loop", "taby_response_ready_loop", "talking_default_loop", "working_laptop_bored_loop", "working_laptop_excited_loop", "working_laptop_loop", "working_laptop_normal_loop", "working_loop", "workspaces_loop"]);

export function resolveAnimation(
  map: AnimationMap,
  state: FaceState
): { id: string } {
  const alts = map.alternatives[state];
  if (alts && alts.length > 1 && Math.random() < 0.35) {
    return { id: alts[Math.floor(Math.random() * alts.length)] };
  }
  if (alts && alts.length === 1) return { id: alts[0] };
  return { id: map.states[state] };
}

/** Fun reactions the AI can force */
export const REACTION_PRESETS: Record<string, string[]> = {
  celebrate: ["yeah", "trophy", "task_completed", "basketball_dunk", "wow"],
  happy: ["yeah", "thumbs_up", "blush", "love_01"],
  sad: ["disappointed", "hello_disappointed", "no"],
  angry: ["angry_01_loop", "angry_02_loop", "hello_annoyed"],
  focus: ["lockin", "turn_off_scroll", "turn_off_reddit", "turn_off_tv"],
  fun: ["f1_car", "basketball_dunk", "basketball_throw", "boxing", "fishing_short"],
  chill: ["relaxing_couch_loop", "drink_water", "stretching", "sleeping_loop"],
  love: ["love_01", "blush", "flower_grow"],
  thinking: ["working_loop", "searching_loop", "busy_loop"],
  greeting: ["startup", "yeah", "thumbs_up"],
};


export type ValidateAnimationResult =
  | { ok: true; id: string }
  | { ok: false; reason: string };

/** Accept catalog ids and common aliases used by the mock/device layer. */
export function validateAnimationId(
  map: AnimationMap,
  animationId: string
): ValidateAnimationResult {
  const id = (animationId || "").trim();
  if (!id) return { ok: false, reason: "empty animation id" };
  if (map.knownAnimationIds.includes(id)) return { ok: true, id };
  if (gifForAnimationId(id)) return { ok: true, id };
  // Allow aliases that resolve via gifForAnimationId path map
  const aliases = ["idle", "thinking", "done", "yes"];
  if (aliases.includes(id)) return { ok: true, id };
  return {
    ok: false,
    reason: `unsupported animation: ${id}`,
  };
}
