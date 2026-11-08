/**
 * Animation ID map + validation (Stage 5–6).
 * IDs match Physical Taby stock firmware (amoled-1.64 pack).
 *
 * Chat turn mapping (user-tuned Stage 6):
 *   listening → listening_loop
 *   busy / AI loading → working_loop  (ff09215b.gif)
 *   done → confirmation, then return to idle_01_loop
 *   error → disappointed, then idle
 *   idle → idle_01_loop
 */

export type FaceState = "listening" | "busy" | "done" | "error" | "idle";

export type AnimationMap = {
  version: number;
  states: Record<FaceState, string>;
  knownAnimationIds: string[];
  /** Approximate clip lengths for one-shot → idle handoff (ms). */
  durationsMs: Record<string, number>;
};

export const DEFAULT_ANIMATION_MAP: AnimationMap = {
  version: 4,
  states: {
    listening: "listening_loop",
    /** AI loading — working_loop (ff09215b) per Stage 6 review */
    busy: "working_loop",
    done: "confirmation",
    error: "disappointed",
    idle: "idle_01_loop",
  },
  knownAnimationIds: [
    "listening_loop",
    "listening_in",
    "busy_loop",
    "working_loop",
    "confirmation",
    "disappointed",
    "idle_01_loop",
    "searching_loop",
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
    disappointed: 2792,
    idle_01_loop: 9042,
  },
};

/** Local GIF path for mock face window (public/taby-faces). */
export const FACE_GIF_BY_ID: Record<string, string> = {
  listening_loop: "/taby-faces/listening_loop.gif",
  listening_in: "/taby-faces/listening_in.gif",
  busy_loop: "/taby-faces/busy_loop.gif",
  working_loop: "/taby-faces/working_loop.gif",
  confirmation: "/taby-faces/confirmation.gif",
  disappointed: "/taby-faces/disappointed.gif",
  idle_01_loop: "/taby-faces/idle_01_loop.gif",
  listening: "/taby-faces/listening_loop.gif",
  thinking: "/taby-faces/working_loop.gif",
  error: "/taby-faces/disappointed.gif",
  idle: "/taby-faces/idle_01_loop.gif",
};

/** Looping clips stay until replaced; one-shots return to idle after duration. */
export const LOOPING_ANIMATION_IDS = new Set([
  "listening_loop",
  "busy_loop",
  "working_loop",
  "idle_01_loop",
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

  return {
    version: typeof obj.version === "number" ? obj.version : 1,
    states: {
      listening: s.listening,
      busy: s.busy,
      done: s.done,
      error: s.error,
      idle: s.idle,
    },
    knownAnimationIds: known,
    durationsMs,
  };
}

export function isKnownAnimationId(map: AnimationMap, id: string): boolean {
  return map.knownAnimationIds.includes(id);
}

export function resolveAnimation(
  map: AnimationMap,
  state: FaceState
): { id: string; known: boolean } {
  const id = map.states[state];
  return { id, known: isKnownAnimationId(map, id) };
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
