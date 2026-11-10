import { useCallback, useEffect, useState } from "react";
import type { EdgeZone } from "../settings/types";
import { clampZone, fetchPrimaryScreenSize, pushEdgeZoneToRust } from "./edgeZone";

/**
 * Orange haze matching the real activation zone (logical CSS pixels, DPI-aligned).
 */
export function ZoneVisualizer({
  zone,
  onChange,
  onDone,
  dwellMs = 500,
  dwellBrowserMs = 700,
  dwellGameMs = 1000,
}: {
  zone: EdgeZone;
  onChange: (z: EdgeZone) => void;
  onDone: () => void;
  dwellMs?: number;
  dwellBrowserMs?: number;
  dwellGameMs?: number;
}) {
  const [screenW, setScreenW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  const [dragging, setDragging] = useState(false);

  const refreshScreen = useCallback(async () => {
    const s = await fetchPrimaryScreenSize();
    // Prefer innerWidth when fullscreen scrim — matches clientX space
    const w =
      typeof window !== "undefined"
        ? Math.max(window.innerWidth, s.w)
        : s.w;
    setScreenW(w);
  }, []);

  useEffect(() => {
    void refreshScreen();
    const onResize = () => void refreshScreen();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [refreshScreen]);

  // Keep Rust hit-test in sync while editing
  useEffect(() => {
    void pushEdgeZoneToRust({
      centerFrac: zone.centerFrac,
      widthFrac: zone.widthFrac,
      depthPx: zone.depthPx,
      dwellProductivityMs: dwellMs,
      dwellBrowserMs,
      dwellGameMs,
    });
  }, [zone, dwellMs, dwellBrowserMs, dwellGameMs]);

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
          width: Math.max(8, widthPx),
          height: Math.max(4, depth),
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
      >
        <span className="zone-viz-label">
          Drag · {Math.round(zone.widthFrac * 100)}% × {depth}px (matches trigger)
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
