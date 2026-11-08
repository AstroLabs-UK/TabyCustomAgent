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

/**
 * Force GIF replay from frame 0 by cache-busting the URL.
 * Same path alone often freezes on the last frame in WebView.
 */
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
      // Always bump token so the <img> reloads and the GIF restarts
      setToken((n) => n + 1);
    });
  }, []);

  // After one-shot clips, cleanly return to idle
  useEffect(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    const id = face.animationId || "idle_01_loop";
    lastId.current = id;
    if (!face.connected) return;
    if (LOOPING_ANIMATION_IDS.has(id)) return;
    if (id === "idle_01_loop" || id === "idle") return;

    const ms = durationMsFor(DEFAULT_ANIMATION_MAP, id) + 80;
    idleTimer.current = setTimeout(() => {
      // Only return if we haven't been interrupted
      if (lastId.current !== id) return;
      publishFaceState({
        animationId: "idle_01_loop",
        label: FACE_LABELS["idle_01_loop"] ?? "Idle",
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
