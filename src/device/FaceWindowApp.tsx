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
import "../styles/tokens.css";
import "../App.css";

const INITIAL: FaceDisplayState = {
  animationId: "idle_01_loop",
  label: "Idle",
  at: Date.now(),
  connected: false,
};

function gifSrc(id: string, token: number): string | null {
  const base = gifForAnimationId(id);
  if (!base) return null;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}t=${token}`;
}

export function FaceWindowApp() {
  const [face, setFace] = useState<FaceDisplayState>(
    () => readFaceState() ?? INITIAL
  );
  const [token, setToken] = useState(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastId = useRef<string>("");

  useEffect(() => {
    return subscribeFaceState((s) => {
      setFace(s);
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
    if (!face.connected) return;
    if (LOOPING_ANIMATION_IDS.has(id)) return;
    if (id === "idle_01_loop" || id === "idle" || id === "idle_02_loop") return;

    const clipMs = durationMsFor(DEFAULT_ANIMATION_MAP, id);
    const extra = DEFAULT_ANIMATION_MAP.postDoneDelayMs ?? 1200;
    const ms = clipMs + extra;
    idleTimer.current = setTimeout(() => {
      if (lastId.current !== id) return;
      const idlePick =
        Math.random() < 0.5 ? "idle_01_loop" : "idle_02_loop";
      publishFaceState({
        animationId: idlePick,
        label: FACE_LABELS[idlePick] ?? "Idle",
        at: Date.now(),
        connected: true,
      });
    }, ms);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [face.animationId, face.connected, token]);

  const id = face.animationId || "idle_01_loop";
  const title = FACE_LABELS[id] ?? face.label ?? id;
  const src = gifSrc(id, token);

  return (
    <div className={`face-shell${face.connected ? " is-connected" : ""}`}>
      <header className="face-header">
        <span className="face-brand">Mock Taby</span>
        <span className={`face-conn ${face.connected ? "on" : "off"}`}>
          {face.connected ? "connected" : "offline"}
        </span>
      </header>

      <div className="face-stage" aria-live="polite">
        <div className="face-gif-frame">
          {src ? (
            <img
              key={`${id}-${token}`}
              src={src}
              alt={title}
              className="face-gif"
              draggable={false}
            />
          ) : (
            <div className="face-gif-missing">No GIF for “{id}”</div>
          )}
        </div>
        <p className="face-label">{title}</p>
        <p className="face-id">animation: {id}</p>
      </div>

      <footer className="face-footer">
        Preview GIFs from Physical Taby firmware assets (TRIIIS LABS). Keep
        identified as Taby — personal / integration use.
      </footer>
    </div>
  );
}
