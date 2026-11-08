/**
 * Dwell timer — fires only after continuous hover for `dwellMs`.
 * Clock is injectable so tests can use a fake clock.
 */

export type Clock = {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
};

export const realClock: Clock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

export type DwellTimerOptions = {
  dwellMs: number;
  onFire: () => void;
  clock?: Clock;
};

export class DwellTimer {
  private dwellMs: number;
  private onFire: () => void;
  private clock: Clock;
  private timerId: unknown = null;
  private hovering = false;
  private firedThisHover = false;

  constructor(opts: DwellTimerOptions) {
    this.dwellMs = opts.dwellMs;
    this.onFire = opts.onFire;
    this.clock = opts.clock ?? realClock;
  }

  setDwellMs(ms: number): void {
    this.dwellMs = Math.max(0, ms);
    // Restart if currently hovering and not yet fired
    if (this.hovering && !this.firedThisHover) {
      this.clear();
      this.start();
    }
  }

  pointerEnter(): void {
    this.hovering = true;
    this.firedThisHover = false;
    this.start();
  }

  pointerLeave(): void {
    this.hovering = false;
    this.firedThisHover = false;
    this.clear();
  }

  /** Cancel without changing hover intent (e.g. already opened). */
  cancel(): void {
    this.clear();
  }

  isHovering(): boolean {
    return this.hovering;
  }

  private start(): void {
    this.clear();
    const ms = this.dwellMs;
    this.timerId = this.clock.setTimeout(() => {
      this.timerId = null;
      if (this.hovering && !this.firedThisHover) {
        this.firedThisHover = true;
        this.onFire();
      }
    }, ms);
  }

  private clear(): void {
    if (this.timerId != null) {
      this.clock.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/** Test helper: controllable clock */
export function createFakeClock() {
  let now = 0;
  const timers = new Map<number, { fn: () => void; at: number }>();
  let nextId = 1;

  const clock: Clock = {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = nextId++;
      timers.set(id, { fn, at: now + ms });
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id as number);
    },
  };

  return {
    clock,
    advance(ms: number) {
      now += ms;
      const due = [...timers.entries()]
        .filter(([, t]) => t.at <= now)
        .sort((a, b) => a[1].at - b[1].at);
      for (const [id, t] of due) {
        timers.delete(id);
        t.fn();
      }
    },
    get now() {
      return now;
    },
  };
}
