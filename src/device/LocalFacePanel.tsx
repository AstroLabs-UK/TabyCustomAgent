import { useEffect, useRef, useState } from "react";
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

const IDLE_VARIANTS = ["idle_01_loop", "idle_02_loop"] as const;
const IDLE_STILL_PAUSE_MS = 900;

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
 * On-screen face (no Physical Taby). Dark rounded frame above the prompt.
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

  useEffect(() => {
    // Local face always treats itself as "connected" for animations
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

  const id = face.animationId || "idle_01_loop";
  const src = gifSrc(id, token);
  const title = FACE_LABELS[id] ?? face.label ?? id;

  return (
    <div className="local-face-panel" aria-label="Taby face">
      <div className="local-face-frame">
        {src ? (
          <img
            key={`${id}-${token}`}
            src={src}
            alt={title}
            className="local-face-gif"
            draggable={false}
          />
        ) : (
          <div className="local-face-missing">No face GIF</div>
        )}
      </div>
    </div>
  );
}
