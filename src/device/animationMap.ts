/**
 * Animation ID map + validation (Stage 5).
 * Stock firmware animation names — extend as firmware docs grow.
 */

export type FaceState = "listening" | "busy" | "done" | "error" | "idle";

export type AnimationMap = {
  version: number;
  states: Record<FaceState, string>;
  knownAnimationIds: string[];
};

export const DEFAULT_ANIMATION_MAP: AnimationMap = {
  version: 1,
  states: {
    listening: "listening",
    busy: "thinking",
    done: "confirmation",
    error: "error",
    idle: "idle",
  },
  knownAnimationIds: [
    "listening",
    "thinking",
    "confirmation",
    "error",
    "idle",
    "happy",
    "sad",
    "wave",
  ],
};

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

/**
 * Validate play target. Returns null if OK, else error message.
 * Unknown IDs are allowed with a warning flag for callers — orchestrator
 * still attempts play but tests assert unsupported handling.
 */
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
