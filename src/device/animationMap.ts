/**
 * Animation ID map + validation (Stage 5–6).
 * IDs match Physical Taby stock firmware (amoled-1.64 pack).
 *
 * Chat turn mapping:
 *   listening → listening_loop
 *   busy/thinking (AI) → busy_loop  (thinking / “magic wand” energy — NOT working_loop)
 *   done → confirmation
 *   error → disappointed
 *   idle → idle_01_loop
 *
 * working_loop / working_laptop_* are for “user is working” (Focus), not AI thinking.
 */

export type FaceState = "listening" | "busy" | "done" | "error" | "idle";

export type AnimationMap = {
  version: number;
  states: Record<FaceState, string>;
  knownAnimationIds: string[];
};

export const DEFAULT_ANIMATION_MAP: AnimationMap = {
  version: 3,
  states: {
    listening: "listening_loop",
    /** AI thinking — busy_loop (not working_loop) */
    busy: "busy_loop",
    done: "confirmation",
    error: "disappointed",
    idle: "idle_01_loop",
  },
  knownAnimationIds: [
    "listening_loop",
    "listening_in",
    "busy_loop",
    "confirmation",
    "disappointed",
    "idle_01_loop",
    "working_loop",
    "searching_loop",
    // aliases
    "listening",
    "thinking",
    "error",
    "idle",
  ],
};

/** Local GIF path for mock face window (public/taby-faces). */
export const FACE_GIF_BY_ID: Record<string, string> = {
  listening_loop: "/taby-faces/listening_loop.gif",
  listening_in: "/taby-faces/listening_in.gif",
  busy_loop: "/taby-faces/busy_loop.gif",
  confirmation: "/taby-faces/confirmation.gif",
  disappointed: "/taby-faces/disappointed.gif",
  idle_01_loop: "/taby-faces/idle_01_loop.gif",
  working_loop: "/taby-faces/working_loop.gif",
  // aliases → correct stock clips
  listening: "/taby-faces/listening_loop.gif",
  thinking: "/taby-faces/busy_loop.gif",
  error: "/taby-faces/disappointed.gif",
  idle: "/taby-faces/idle_01_loop.gif",
};

export function gifForAnimationId(id: string): string | null {
  return FACE_GIF_BY_ID[id] ?? null;
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
