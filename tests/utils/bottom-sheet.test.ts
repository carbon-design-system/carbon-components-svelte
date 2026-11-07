// @vitest-environment node
import {
  claimTouch,
  createVelocityTracker,
  dragHeight,
  resolveSnapPoints,
  rubberBand,
  settle,
} from "../../src/utils/bottom-sheet.js";

describe("resolveSnapPoints", () => {
  const measure = { available: 800, contentHeight: 300 };

  it("resolves each kind of snap point, sorted, with full below a top gap", () => {
    const resolved = resolveSnapPoints(
      ["full", "peek", "content", 500, "25%", "half"],
      measure,
    );
    expect(resolved.map((r) => r.height)).toEqual([
      120, 200, 300, 400, 500, 752,
    ]);
    expect(resolved.map((r) => r.point)).toEqual([
      "peek",
      "25%",
      "content",
      "half",
      500,
      "full",
    ]);
  });

  it("limits heights to full, and drops duplicates and junk", () => {
    const resolved = resolveSnapPoints(
      [5000, "full", "half", 400, "wat" as never, "x%" as never],
      measure,
    );
    expect(resolved.map((r) => r.height)).toEqual([400, 752]);
  });
});

describe("dragHeight", () => {
  const range = { min: 100, max: 500, dismissible: false };

  it("follows the pointer inside the range", () => {
    expect(dragHeight({ start: 300, delta: 50, ...range })).toBe(350);
  });

  it("stretches past the ends with resistance, never past 56px", () => {
    const up = dragHeight({ start: 500, delta: 300, ...range });
    expect(up).toBeGreaterThan(500);
    expect(up).toBeLessThan(556);
    const down = dragHeight({ start: 100, delta: -300, ...range });
    expect(down).toBeLessThan(100);
    expect(down).toBeGreaterThan(44);
  });

  it("follows the pointer to nothing when dismissible, and clamps in reduced motion", () => {
    expect(
      dragHeight({ start: 100, delta: -60, ...range, dismissible: true }),
    ).toBe(40);
    expect(
      dragHeight({ start: 100, delta: -500, ...range, dismissible: true }),
    ).toBe(0);
    expect(
      dragHeight({ start: 500, delta: 300, ...range, reducedMotion: true }),
    ).toBe(500);
  });

  it("starts the stretch at 1:1", () => {
    expect(rubberBand(1)).toBeGreaterThan(0.98);
    expect(rubberBand(-5)).toBe(0);
  });
});

describe("settle", () => {
  const heights = [120, 400, 700];
  const free = { heights, dismissible: false };

  it("goes to the nearest snap point when released slowly", () => {
    expect(settle({ height: 300, velocity: 0.1, ...free })).toEqual({
      index: 1,
      dismiss: false,
    });
    expect(settle({ height: 600, velocity: -0.2, ...free })).toEqual({
      index: 2,
      dismiss: false,
    });
  });

  it("a fling goes at least to the next snap point in its direction", () => {
    // Released nearer 120 than 400, flung up: 400, not back to 120.
    expect(settle({ height: 200, velocity: -0.8, ...free })).toEqual({
      index: 1,
      dismiss: false,
    });
    // Released nearer 400, flung down: 120.
    expect(settle({ height: 380, velocity: 0.8, ...free })).toEqual({
      index: 0,
      dismiss: false,
    });
  });

  it("a fast fling goes further than the next snap point", () => {
    expect(settle({ height: 130, velocity: -3, ...free })).toEqual({
      index: 2,
      dismiss: false,
    });
  });

  it("a dismissible sheet has a virtual snap point at nothing", () => {
    const closable = { heights, dismissible: true };
    expect(settle({ height: 50, velocity: 0, ...closable })).toEqual({
      index: -1,
      dismiss: true,
    });
    expect(settle({ height: 110, velocity: 0.7, ...closable })).toEqual({
      index: -1,
      dismiss: true,
    });
    // The same fling on a sheet that cannot close stays at its shortest.
    expect(settle({ height: 110, velocity: 0.7, ...free })).toEqual({
      index: 0,
      dismiss: false,
    });
  });
});

describe("createVelocityTracker", () => {
  it("measures the last 100ms, and a resting finger has no speed", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0);
    tracker.add(50, 200);
    tracker.add(80, 250);
    tracker.add(130, 300);
    // Samples older than 100ms before the last are dropped.
    expect(tracker.velocity()).toBeCloseTo((130 - 50) / 100);
    expect(tracker.velocity(310)).toBeCloseTo((130 - 50) / 100);
    expect(tracker.velocity(450)).toBe(0);
    tracker.reset();
    expect(tracker.velocity()).toBe(0);
  });
});

describe("claimTouch", () => {
  const base = { dx: 0, dy: 0, scrollTop: 0, atMax: true };

  it("waits for the finger to move", () => {
    expect(claimTouch({ ...base, dy: 2 })).toBe("undecided");
  });

  it("gives a sideways drag to the content", () => {
    expect(claimTouch({ ...base, dx: 20, dy: 5, atMax: false })).toBe(
      "content",
    );
  });

  it("gives every vertical drag to the sheet below its tallest snap point", () => {
    expect(claimTouch({ ...base, dy: -20, atMax: false, scrollTop: 90 })).toBe(
      "sheet",
    );
    expect(claimTouch({ ...base, dy: 20, atMax: false })).toBe("sheet");
  });

  it("at the tallest, gives a downward drag from the top to the sheet and the rest to the content", () => {
    expect(claimTouch({ ...base, dy: 20 })).toBe("sheet");
    expect(claimTouch({ ...base, dy: 20, scrollTop: 40 })).toBe("content");
    expect(claimTouch({ ...base, dy: -20 })).toBe("content");
  });
});
