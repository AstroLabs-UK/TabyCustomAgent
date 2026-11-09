import { useCallback, useEffect, useState } from "react";
import type { EdgeZone } from "../settings/types";
import { clampZone, fetchPrimaryScreenSize } from "./edgeZone";

/**
 * Full-window orange haze for the activation zone.
 * Drag horizontally along the top to move; edges can be resized later via settings sliders.
 */
export function ZoneVisualizer({
  zone,
  onChange,
  onDone,
}: {
  zone: EdgeZone;
  onChange: (z: EdgeZone) => void;
  onDone: () => void;
}) {
  const [screenW, setScreenW] = useState(
    typeof window !== "undefined" ? window.screen.width : 1920
  );
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    void fetchPrimaryScreenSize().then((s) => setScreenW(s.w));
  }, []);

  const widthPx = screenW * zone.widthFrac;
  const leftPx = screenW * zone.centerFrac - widthPx / 2;
  const depth = zone.depthPx;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;
      const frac = e.clientX / screenW;
      onChange(
        clampZone({
          ...zone,
          centerFrac: frac,
        })
      );
    },
    [dragging, onChange, screenW, zone]
  );

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, onPointerMove]);

  return (
    <div className="zone-viz-root" data-testid="zone-visualizer">
      <div
        className="zone-viz-haze"
        style={{
          left: Math.max(0, leftPx),
          width: widthPx,
          height: depth,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
      >
        <span className="zone-viz-label">
          Drag to move · {Math.round(zone.widthFrac * 100)}% wide · {depth}px deep
        </span>
      </div>
      <div className="zone-viz-toolbar">
        <label>
          Width
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(zone.widthFrac * 100)}
            onChange={(e) =>
              onChange(
                clampZone({
                  ...zone,
                  widthFrac: Number(e.target.value) / 100,
                })
              )
            }
          />
        </label>
        <label>
          Depth
          <input
            type="range"
            min={4}
            max={48}
            value={zone.depthPx}
            onChange={(e) =>
              onChange(
                clampZone({
                  ...zone,
                  depthPx: Number(e.target.value),
                })
              )
            }
          />
        </label>
        <button type="button" className="btn primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
