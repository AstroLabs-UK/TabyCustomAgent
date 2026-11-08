import { describe, it, expect } from "vitest";
import { DwellTimer, createFakeClock } from "../hud/dwellTimer";

describe("DwellTimer", () => {
  it("does not fire before dwellMs", () => {
    const fake = createFakeClock();
    let fired = 0;
    const t = new DwellTimer({
      dwellMs: 500,
      onFire: () => {
        fired += 1;
      },
      clock: fake.clock,
    });
    t.pointerEnter();
    fake.advance(499);
    expect(fired).toBe(0);
  });

  it("fires only after configured ms with continuous hover", () => {
    const fake = createFakeClock();
    let fired = 0;
    const t = new DwellTimer({
      dwellMs: 500,
      onFire: () => {
        fired += 1;
      },
      clock: fake.clock,
    });
    t.pointerEnter();
    fake.advance(500);
    expect(fired).toBe(1);
  });

  it("does not fire if pointer leaves early", () => {
    const fake = createFakeClock();
    let fired = 0;
    const t = new DwellTimer({
      dwellMs: 500,
      onFire: () => {
        fired += 1;
      },
      clock: fake.clock,
    });
    t.pointerEnter();
    fake.advance(200);
    t.pointerLeave();
    fake.advance(500);
    expect(fired).toBe(0);
  });

  it("fires only once per hover", () => {
    const fake = createFakeClock();
    let fired = 0;
    const t = new DwellTimer({
      dwellMs: 300,
      onFire: () => {
        fired += 1;
      },
      clock: fake.clock,
    });
    t.pointerEnter();
    fake.advance(300);
    fake.advance(300);
    expect(fired).toBe(1);
  });

  it("respects updated dwellMs", () => {
    const fake = createFakeClock();
    let fired = 0;
    const t = new DwellTimer({
      dwellMs: 500,
      onFire: () => {
        fired += 1;
      },
      clock: fake.clock,
    });
    t.setDwellMs(200);
    t.pointerEnter();
    fake.advance(199);
    expect(fired).toBe(0);
    fake.advance(1);
    expect(fired).toBe(1);
  });
});
