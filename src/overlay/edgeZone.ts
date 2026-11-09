import type { EdgeZone } from "../settings/types";
import { DEFAULT_EDGE_ZONE } from "../settings/types";

export type EdgeZoneRuntime = {
  centerFrac: number;
  widthFrac: number;
  depthPx: number;
  dwellProductivityMs: number;
  dwellBrowserMs: number;
  dwellGameMs: number;
};

export function toRuntime(
  zone: EdgeZone,
  dwellMs: number,
  dwellBrowserMs: number,
  dwellGameMs: number
): EdgeZoneRuntime {
  return {
    centerFrac: zone.centerFrac,
    widthFrac: zone.widthFrac,
    depthPx: zone.depthPx,
    dwellProductivityMs: dwellMs,
    dwellBrowserMs,
    dwellGameMs,
  };
}

export async function pushEdgeZoneToRust(rt: EdgeZoneRuntime): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("update_edge_zone", {
      zone: {
        centerFrac: rt.centerFrac,
        widthFrac: rt.widthFrac,
        depthPx: rt.depthPx,
        dwellProductivityMs: rt.dwellProductivityMs,
        dwellBrowserMs: rt.dwellBrowserMs,
        dwellGameMs: rt.dwellGameMs,
      },
    });
  } catch {
    /* browser */
  }
}

export async function fetchPrimaryScreenSize(): Promise<{ w: number; h: number }> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const [w, h] = (await invoke("get_primary_screen_size")) as [number, number];
    if (w > 0 && h > 0) return { w, h };
  } catch {
    /* fall through */
  }
  return {
    w: typeof window !== "undefined" ? window.screen.width : 1920,
    h: typeof window !== "undefined" ? window.screen.height : 1080,
  };
}

export function clampZone(z: EdgeZone): EdgeZone {
  return {
    centerFrac: Math.min(1, Math.max(0, z.centerFrac)),
    widthFrac: Math.min(1, Math.max(0.05, z.widthFrac)),
    depthPx: Math.min(80, Math.max(4, Math.round(z.depthPx))),
  };
}

export { DEFAULT_EDGE_ZONE };
