import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  FACE_LABELS,
  publishFaceState,
  readFaceState,
  subscribeFaceState,
  type FaceDisplayState,
} from "./faceBus";
import {
  DEFAULT_ANIMATION_MAP,
  durationMsFor,
  gifForAnimationId,
  LOOPING_ANIMATION_IDS,
} from "./animationMap";

/** Raw firmware GIF size (portrait for the device screen). */
export const FACE_NATIVE_W = 280;
export const FACE_NATIVE_H = 456;
/** After rotate 270° CW: long edge is horizontal (along the bottom). */
export const FACE_DISPLAY_ASPECT = `${FACE_NATIVE_H} / ${FACE_NATIVE_W}`; // 456 / 280

const IDLE_VARIANTS = ["idle_01_loop", "idle_02_loop"] as const;
const IDLE_STILL_PAUSE_MS = 900;

/** Cute one-shots when the user pets / wiggles Taby — only ids with real GIF files */
const CUTE_CANDIDATES = [
  "blush",
  "love_01",
  "wow",
  "thumbs_up",
  "yeah",
  "flower_grow",
  "trophy",
  "confirmation",
  "task_completed",
] as const;

const CUTE_WIGGLE = CUTE_CANDIDATES.filter((id) => Boolean(gifForAnimationId(id)));

const WIGGLE_DISTANCE_PX = 110;
const WIGGLE_COOLDOWN_MS = 5000;

function resolveGif(id: string): { id: string; src: string } {
  const preferred = (id || "idle_01_loop").trim();
  const path =
    gifForAnimationId(preferred) ||
    gifForAnimationId("idle_01_loop") ||
    "/taby-faces/idle_01_loop.gif";
  const resolvedId = gifForAnimationId(preferred) ? preferred : "idle_01_loop";
  return { id: resolvedId, src: path };
}

function nextIdle(current: string): string {
  const idx = IDLE_VARIANTS.indexOf(current as (typeof IDLE_VARIANTS)[number]);
  if (idx < 0) return IDLE_VARIANTS[0];
  return IDLE_VARIANTS[(idx + 1) % IDLE_VARIANTS.length];
}

/**
 * On-screen face — no outline box; pet/wiggle for a random cute reaction.
 */
export function LocalFacePanel() {
  const [face, setFace] = useState<FaceDisplayState>(
    () =>
      readFaceState() ?? {
        animationId: "idle_01_loop",
        label: "Idle",
        at: Date.now(),
        connected: true,
      }
  );
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastId = useRef("idle_01_loop");
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const travel = useRef(0);
  const lastWiggleAt = useRef(0);
  /** Keep last good src so we never flash “No face GIF”. */
  const lastSrc = useRef(resolveGif("idle_01_loop").src);

  useEffect(() => {
    publishFaceState({
      ...(readFaceState() ?? {
        animationId: "idle_01_loop",
        label: "Idle",
        at: Date.now(),
      }),
      connected: true,
    });
    return subscribeFaceState((s) => {
      const nextId = s.animationId || "idle_01_loop";
      // Only update when the animation actually changes — avoids reload flicker on hover
      if (nextId === lastId.current && !s.force) {
        return;
      }
      lastId.current = nextId;
      setFace({ ...s, connected: true, animationId: nextId });
    });
  }, []);

  useEffect(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    const id = face.animationId || "idle_01_loop";
    lastId.current = id;
    const isIdle =
      id === "idle_01_loop" || id === "idle_02_loop" || id === "idle";

    if (!LOOPING_ANIMATION_IDS.has(id) && !isIdle) {
      const ms =
        durationMsFor(DEFAULT_ANIMATION_MAP, id) +
        (DEFAULT_ANIMATION_MAP.postDoneDelayMs ?? 1200);
      idleTimer.current = setTimeout(() => {
        if (lastId.current !== id) return;
        const pick =
          IDLE_VARIANTS[Math.floor(Math.random() * IDLE_VARIANTS.length)];
        publishFaceState({
          animationId: pick,
          label: FACE_LABELS[pick] ?? "Idle",
          at: Date.now(),
          connected: true,
        });
      }, ms);
    } else if (isIdle) {
      const clipMs = durationMsFor(DEFAULT_ANIMATION_MAP, id, 8000);
      idleTimer.current = setTimeout(() => {
        if (lastId.current !== id) return;
        const nxt = nextIdle(id === "idle" ? "idle_01_loop" : id);
        publishFaceState({
          animationId: nxt,
          label: FACE_LABELS[nxt] ?? "Idle",
          at: Date.now(),
          connected: true,
        });
      }, clipMs + IDLE_STILL_PAUSE_MS);
    }

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [face.animationId]);

  function handleFacePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const prev = lastPointer.current;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    travel.current += Math.hypot(dx, dy);
    const now = Date.now();
    if (
      travel.current >= WIGGLE_DISTANCE_PX &&
      now - lastWiggleAt.current >= WIGGLE_COOLDOWN_MS
    ) {
      travel.current = 0;
      lastWiggleAt.current = now;
      const pool = CUTE_WIGGLE.length
        ? CUTE_WIGGLE
        : (["yeah", "thumbs_up"] as const);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      // Only publish if we can resolve a real file
      const resolved = resolveGif(pick);
      publishFaceState({
        animationId: resolved.id,
        label: FACE_LABELS[resolved.id] ?? resolved.id,
        at: now,
        connected: true,
        force: true,
      });
    }
  }

  function handleFacePointerLeave() {
    lastPointer.current = null;
    // keep travel so a short leave doesn't fully reset petting progress
  }

  const id = face.animationId || "idle_01_loop";
  const resolved = resolveGif(id);
  lastSrc.current = resolved.src;
  const title = FACE_LABELS[resolved.id] ?? face.label ?? resolved.id;

  return (
    <div
      className="local-face-panel"
      aria-label="Taby face"
      title="Pet me"
      style={{ aspectRatio: FACE_DISPLAY_ASPECT }}
      onPointerMove={handleFacePointerMove}
      onPointerLeave={handleFacePointerLeave}
      onPointerEnter={(e) => {
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <div className="local-face-frame">
        <img
          src={lastSrc.current}
          alt={title}
          className="local-face-gif"
          width={FACE_NATIVE_W}
          height={FACE_NATIVE_H}
          draggable={false}
          onError={(ev) => {
            // Hard fallback — never leave a broken image
            const img = ev.currentTarget;
            const fb = resolveGif("idle_01_loop").src;
            if (img.src !== fb) {
              img.src = fb;
              lastSrc.current = fb;
            }
          }}
        />
      </div>
    </div>
  );
}
