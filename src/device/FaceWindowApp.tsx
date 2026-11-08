import { useEffect, useState } from "react";
import {
  FACE_LABELS,
  readFaceState,
  subscribeFaceState,
  type FaceDisplayState,
} from "./faceBus";
import "../styles/tokens.css";

const INITIAL: FaceDisplayState = {
  animationId: "idle",
  label: "Idle",
  at: Date.now(),
  connected: false,
};

export function FaceWindowApp() {
  const [face, setFace] = useState<FaceDisplayState>(
    () => readFaceState() ?? INITIAL
  );

  useEffect(() => {
    return subscribeFaceState((s) => setFace(s));
  }, []);

  const id = face.animationId || "idle";
  const title = FACE_LABELS[id] ?? face.label ?? id;

  return (
    <div className={`face-shell face-shell--${cssSafe(id)}${face.connected ? " is-connected" : ""}`}>
      <header className="face-header">
        <span className="face-brand">Mock Taby</span>
        <span className={`face-conn ${face.connected ? "on" : "off"}`}>
          {face.connected ? "connected" : "offline"}
        </span>
      </header>

      <div className="face-stage" aria-live="polite">
        <div className={`face-circle face-anim--${cssSafe(id)}`}>
          <div className="face-eyes">
            <span className="face-eye" />
            <span className="face-eye" />
          </div>
          <div className={`face-mouth face-mouth--${cssSafe(id)}`} />
        </div>
        <p className="face-label">{title}</p>
        <p className="face-id">animation: {id}</p>
      </div>

      <footer className="face-footer">
        Simulator only · mirrors mock device <code>play()</code>
      </footer>
    </div>
  );
}

function cssSafe(id: string): string {
  return id.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
}
