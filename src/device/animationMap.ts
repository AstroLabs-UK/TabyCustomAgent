/**
 * Animation ID map + validation (Stage 5–6).
 * IDs match Physical Taby stock firmware (amoled-1.64 pack).
 *
 * Chat turn mapping:
 *   listening → listening_loop (+alts random)
 *   busy / AI loading → working_loop (ff09215b) primary
 *   done → confirmation (+alts), then idle after duration + extra delay
 *   error → disappointed (+alts), then idle
 *   idle → idle_01_loop (+alts)
 */

export type FaceState = "listening" | "busy" | "done" | "error" | "idle";

export type AnimationMap = {
  version: number;
  states: Record<FaceState, string>;
  /** Optional alternates per state — resolveAnimation may pick at random */
  alternatives: Partial<Record<FaceState, string[]>>;
  knownAnimationIds: string[];
  durationsMs: Record<string, number>;
  /** Extra hold after one-shot before idle (ms) */
  postDoneDelayMs: number;
};

export const DEFAULT_ANIMATION_MAP: AnimationMap = {
  version: 5,
  states: {
    listening: "listening_loop",
    busy: "working_loop",
    done: "confirmation",
    error: "disappointed",
    idle: "idle_01_loop",
  },
  alternatives: {
    listening: ["listening_loop", "listening_in"],
    busy: ["working_loop"], // keep AI load on working_loop; room for more later
    done: ["confirmation", "thumbs_up", "yeah", "task_completed"],
    error: ["disappointed", "hello_disappointed"],
    idle: ["idle_01_loop", "idle_02_loop"],
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
  },
  /** Extra dwell after done/error one-shot before idle */
  postDoneDelayMs: 1200,
};

export const FACE_GIF_BY_ID: Record<string, string> = {
  listening_loop: "/taby-faces/listening_loop.gif",
  listening_in: "/taby-faces/listening_in.gif",
  busy_loop: "/taby-faces/busy_loop.gif",
  working_loop: "/taby-faces/working_loop.gif",
  confirmation: "/taby-faces/confirmation.gif",
  thumbs_up: "/taby-faces/thumbs_up.gif",
  yeah: "/taby-faces/yeah.gif",
  task_completed: "/taby-faces/task_completed.gif",
  disappointed: "/taby-faces/disappointed.gif",
  hello_disappointed: "/taby-faces/hello_disappointed.gif",
  idle_01_loop: "/taby-faces/idle_01_loop.gif",
  idle_02_loop: "/taby-faces/idle_02_loop.gif",
  listening: "/taby-faces/listening_loop.gif",
  thinking: "/taby-faces/working_loop.gif",
  error: "/taby-faces/disappointed.gif",
  idle: "/taby-faces/idle_01_loop.gif",
};

export const LOOPING_ANIMATION_IDS = new Set([
  "listening_loop",
  "busy_loop",
  "working_loop",
  "idle_01_loop",
  "idle_02_loop",
  "searching_loop",
]);

export function gifForAnimationId(id: string): string | null {
  return FACE_GIF_BY_ID[id] ?? null;
}

export function durationMsFor(
  map: AnimationMap,
  id: string,
  fallback = 2000
): number {
  return map.durationsMs[id] ?? fallback;
}

function pickRandom(ids: string[]): string {
  return ids[Math.floor(Math.random() * ids.length)] ?? ids[0];
}

/**
 * Resolve state → animation id.
 * When alternatives exist, picks randomly among primary + alts (unique).
 */
export function resolveAnimation(
  map: AnimationMap,
  state: FaceState,
  opts?: { random?: boolean }
): { id: string; known: boolean } {
  const primary = map.states[state];
  const alts = map.alternatives[state] ?? [];
  const pool = Array.from(new Set([primary, ...alts].filter(Boolean)));
  const useRandom = opts?.random !== false && pool.length > 1;
  const id = useRandom ? pickRandom(pool) : primary;
  return { id, known: isKnownAnimationId(map, id) };
}

export function parseAnimationMap(raw: unknown): AnimationMap {
  if (!raw || typeof raw !== "object") {
    throw new Error("animation map must be an object");
  }
  const obj = raw as Record<string, unknown>;
  const states = obj.states;
  if (!states || typeof states !== "object") {
    throw new Error("animation map missing states");
  }
  const known = Array.isArray(obj.knownAnimationIds)
    ? (obj.knownAnimationIds as string[]).filter((x) => typeof x === "string")
    : [...DEFAULT_ANIMATION_MAP.knownAnimationIds];

  const s = states as Record<string, string>;
  const required: FaceState[] = ["listening", "busy", "done", "error", "idle"];
  for (const key of required) {
    if (typeof s[key] !== "string" || !s[key]) {
      throw new Error(`animation map missing state: ${key}`);
    }
  }

  const durationsMs = {
    ...DEFAULT_ANIMATION_MAP.durationsMs,
    ...((obj.durationsMs as Record<string, number>) || {}),
  };

  const alternatives = {
    ...DEFAULT_ANIMATION_MAP.alternatives,
    ...((obj.alternatives as AnimationMap["alternatives"]) || {}),
  };

  const postDoneDelayMs =
    typeof obj.postDoneDelayMs === "number"
      ? obj.postDoneDelayMs
      : DEFAULT_ANIMATION_MAP.postDoneDelayMs;

  return {
    version: typeof obj.version === "number" ? obj.version : 1,
    states: {
      listening: s.listening,
      busy: s.busy,
      done: s.done,
      error: s.error,
      idle: s.idle,
    },
    alternatives,
    knownAnimationIds: known,
    durationsMs,
    postDoneDelayMs,
  };
}

export function isKnownAnimationId(map: AnimationMap, id: string): boolean {
  return map.knownAnimationIds.includes(id);
}

export function validateAnimationId(
  map: AnimationMap,
  id: string
): { ok: true } | { ok: false; reason: string } {
  if (!id || !id.trim()) {
    return { ok: false, reason: "empty animation id" };
  }
  if (!isKnownAnimationId(map, id)) {
    return { ok: false, reason: `unsupported animation id: ${id}` };
  }
  return { ok: true };
}
