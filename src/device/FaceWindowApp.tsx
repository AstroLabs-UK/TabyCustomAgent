import { useEffect, useState } from "react";
import {
  FACE_LABELS,
  readFaceState,
  subscribeFaceState,
  type FaceDisplayState,
} from "./faceBus";
import { gifForAnimationId } from "./animationMap";
import "../styles/tokens.css";
import "../App.css";

const INITIAL: FaceDisplayState = {
  animationId: "idle_01_loop",
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

  const id = face.animationId || "idle_01_loop";
  const title = FACE_LABELS[id] ?? face.label ?? id;
  const gif = gifForAnimationId(id);

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
          {gif ? (
            <img
              key={id}
              src={gif}
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
