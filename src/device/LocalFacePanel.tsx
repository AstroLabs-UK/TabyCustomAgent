import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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

/** Cute one-shots when the user wiggles the mouse over Taby */
const CUTE_WIGGLE = [
  "blush",
  "love_01",
  "wow",
  "thumbs_up",
  "yeah",
  "flower_grow",
  "trophy",
] as const;
const WIGGLE_DISTANCE_PX = 90;
const WIGGLE_COOLDOWN_MS = 4500;

function gifSrc(id: string, token: number): string | null {
  const base = gifForAnimationId(id);
  if (!base) return null;
  return `${base}${base.includes("?") ? "&" : "?"}t=${token}`;
}

function nextIdle(current: string): string {
  const idx = IDLE_VARIANTS.indexOf(current as (typeof IDLE_VARIANTS)[number]);
  if (idx < 0) return IDLE_VARIANTS[0];
  return IDLE_VARIANTS[(idx + 1) % IDLE_VARIANTS.length];
}

/**
 * On-screen face: raw GIF rotated 270° clockwise from raw file; box = rotated bounds (no letterbox).
 * Hide this entirely when a Physical Taby is connected.
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
  const [token, setToken] = useState(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastId = useRef("");
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const travel = useRef(0);
  const lastWiggleAt = useRef(0);

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
      setFace({ ...s, connected: true });
      setToken((n) => n + 1);
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
  }, [face.animationId, token]);

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
      const pick =
        CUTE_WIGGLE[Math.floor(Math.random() * CUTE_WIGGLE.length)];
      publishFaceState({
        animationId: pick,
        label: FACE_LABELS[pick] ?? pick,
        at: now,
        connected: true,
        force: true,
      });
    }
  }

  function handleFacePointerLeave() {
    lastPointer.current = null;
    travel.current = 0;
  }

  const id = face.animationId || "idle_01_loop";
  const src = gifSrc(id, token);
  const title = FACE_LABELS[id] ?? face.label ?? id;

  return (
    <div
      className="local-face-panel"
      aria-label="Taby face"
      style={{ aspectRatio: FACE_DISPLAY_ASPECT }}
      onPointerMove={handleFacePointerMove}
      onPointerLeave={handleFacePointerLeave}
      onPointerEnter={() => {
        travel.current = 0;
        lastPointer.current = null;
      }}
    >
      <div className="local-face-frame">
        {src ? (
          <img
            key={`${id}-${token}`}
            src={src}
            alt={title}
            className="local-face-gif"
            width={FACE_NATIVE_W}
            height={FACE_NATIVE_H}
            draggable={false}
          />
        ) : (
          <div className="local-face-missing">No face GIF</div>
        )}
      </div>
    </div>
  );
}
