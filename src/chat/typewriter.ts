/**
 * Smooth typewriter: reveals text character-by-character toward `target`.
 * Returns dispose function.
 */
export function typewriterToward(
  target: string,
  onUpdate: (visible: string) => void,
  opts?: { cps?: number }
): { sync: (next: string) => void; flush: () => void; dispose: () => void } {
  const cps = opts?.cps ?? 48; // chars per second
  let visible = "";
  let desired = target;
  let timer: ReturnType<typeof setInterval> | null = null;

  function tick() {
    if (visible.length >= desired.length) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return;
    }
    // Catch up faster if far behind stream
    const lag = desired.length - visible.length;
    const step = lag > 24 ? 3 : lag > 8 ? 2 : 1;
    visible = desired.slice(0, visible.length + step);
    onUpdate(visible);
  }

  function ensureTimer() {
    if (!timer) {
      timer = setInterval(tick, Math.max(12, Math.round(1000 / cps)));
    }
  }

  function sync(next: string) {
    desired = next;
    if (visible.length > desired.length) {
      // rare shrink
      visible = desired;
      onUpdate(visible);
    }
    ensureTimer();
  }

  function flush() {
    visible = desired;
    onUpdate(visible);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function dispose() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  ensureTimer();
  return { sync, flush, dispose };
}
