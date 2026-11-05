import {
  cellAt,
  closestEdge,
  edgeScrollSpeed,
  indexToSlot,
  insertionSlot,
  keyIntent,
  nearestBox,
  slotToIndex,
  stepIndex,
  treePosition,
} from "../../src/utils/dnd-math.js";

describe("insertionSlot", () => {
  // Three 10px rows: midpoints 5, 15, 25.
  const midpoint = (index: number) => index * 10 + 5;

  it("finds the gap by comparing with item midpoints", () => {
    expect(insertionSlot(3, midpoint, -50)).toBe(0);
    expect(insertionSlot(3, midpoint, 4)).toBe(0);
    expect(insertionSlot(3, midpoint, 6)).toBe(1);
    expect(insertionSlot(3, midpoint, 26)).toBe(3);
    expect(insertionSlot(3, midpoint, 500)).toBe(3);
  });

  it("is zero for an empty list", () => {
    expect(insertionSlot(0, midpoint, 10)).toBe(0);
  });

  it("probes a 1,000 item list about ten times", () => {
    const probe = vi.fn(midpoint);
    expect(insertionSlot(1000, probe, 4995)).toBe(500);
    expect(probe.mock.calls.length).toBeLessThanOrEqual(11);
  });
});

describe("slots and indexes", () => {
  it("shifts the slots after the dragged item in its own list", () => {
    expect(slotToIndex(3, 1, true)).toBe(2);
    expect(slotToIndex(1, 1, true)).toBe(1);
    expect(slotToIndex(2, 1, true)).toBe(1);
    expect(slotToIndex(0, 1, true)).toBe(0);
  });

  it("does not shift slots of another list", () => {
    expect(slotToIndex(3, 1, false)).toBe(3);
  });

  it("round-trips through indexToSlot", () => {
    for (const oldIndex of [0, 2, 4]) {
      for (const index of [0, 1, 3, 4]) {
        expect(
          slotToIndex(indexToSlot(index, oldIndex, true), oldIndex, true),
        ).toBe(index);
      }
    }
  });
});

describe("edgeScrollSpeed", () => {
  const area = { start: 0, end: 300, zone: 50, maxSpeed: 1000 };

  it("is zero away from the edges", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 150 })).toBe(0);
    expect(edgeScrollSpeed({ ...area, pointer: 50 })).toBe(0);
  });

  it("scrolls toward the edge the pointer presses on", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 0 })).toBe(-1000);
    expect(edgeScrollSpeed({ ...area, pointer: 300 })).toBe(1000);
    expect(edgeScrollSpeed({ ...area, pointer: 275 })).toBe(500);
  });

  it("keeps going, capped, when the pointer is past the edge", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 900 })).toBe(1500);
  });

  it("ramps up while the pointer stays in a zone", () => {
    const speed = (held: number) =>
      edgeScrollSpeed({ ...area, pointer: 300, held });
    expect(speed(0)).toBeCloseTo(150);
    expect(speed(200)).toBeGreaterThan(speed(0));
    expect(speed(400)).toBe(1000);
    expect(speed(4000)).toBe(1000);
  });

  it("leaves the middle third of a small area alone", () => {
    const small = { start: 0, end: 60, zone: 50 };
    expect(edgeScrollSpeed({ ...small, pointer: 30 })).toBe(0);
    expect(edgeScrollSpeed({ ...small, pointer: 15 })).toBeLessThan(0);
  });
});

describe("keyIntent", () => {
  it("moves along a vertical list with Up and Down", () => {
    expect(keyIntent("ArrowUp", "vertical", false)).toBe("back");
    expect(keyIntent("ArrowDown", "vertical", false)).toBe("forward");
  });

  it("hands over to the neighbor zone with the cross-axis arrows", () => {
    expect(keyIntent("ArrowLeft", "vertical", false)).toBe("prevZone");
    expect(keyIntent("ArrowRight", "vertical", false)).toBe("nextZone");
    expect(keyIntent("ArrowUp", "horizontal", false)).toBe("prevZone");
    expect(keyIntent("ArrowDown", "horizontal", false)).toBe("nextZone");
  });

  it("swaps the inline arrows in RTL", () => {
    expect(keyIntent("ArrowRight", "horizontal", false)).toBe("forward");
    expect(keyIntent("ArrowRight", "horizontal", true)).toBe("back");
    expect(keyIntent("ArrowLeft", "horizontal", true)).toBe("forward");
    expect(keyIntent("ArrowLeft", "vertical", true)).toBe("nextZone");
    expect(keyIntent("ArrowDown", "vertical", true)).toBe("forward");
  });

  it("steps a wrapping grid along both axes", () => {
    expect(keyIntent("ArrowRight", "grid", false)).toBe("forward");
    expect(keyIntent("ArrowRight", "grid", true)).toBe("back");
    expect(keyIntent("ArrowUp", "grid", false)).toBe("up");
    expect(keyIntent("ArrowDown", "grid", true)).toBe("down");
  });

  it("jumps with Home, End and the page keys in any orientation", () => {
    expect(keyIntent("Home", "grid", false)).toBe("start");
    expect(keyIntent("End", "horizontal", true)).toBe("end");
    expect(keyIntent("PageDown", "vertical", false)).toBe("pageForward");
  });

  it("ignores other keys", () => {
    expect(keyIntent("a", "vertical", false)).toBeNull();
  });
});

describe("stepIndex", () => {
  it("steps and clamps", () => {
    expect(stepIndex(2, "back", 5)).toBe(1);
    expect(stepIndex(5, "forward", 5)).toBe(5);
    expect(stepIndex(2, "start", 5)).toBe(0);
    expect(stepIndex(2, "end", 5)).toBe(5);
    expect(stepIndex(3, "pageBack", 20)).toBe(0);
    expect(stepIndex(3, "pageForward", 20)).toBe(13);
  });
});

describe("nearestBox", () => {
  // A wrapping grid of 10px boxes, three to a row.
  const boxes = [0, 1, 2, 3, 4].map((i) => ({
    left: (i % 3) * 10,
    top: Math.floor(i / 3) * 10,
    right: (i % 3) * 10 + 10,
    bottom: Math.floor(i / 3) * 10 + 10,
  }));

  it("finds the box under the pointer and the side it is on", () => {
    expect(nearestBox(boxes, 7, 5)).toEqual({ index: 0, after: true });
    expect(nearestBox(boxes, 3, 5)).toEqual({ index: 0, after: false });
    expect(nearestBox(boxes, 15, 15)).toEqual({ index: 4, after: false });
  });

  it("flips the side in RTL", () => {
    expect(nearestBox(boxes, 7, 5, true)).toEqual({ index: 0, after: false });
  });

  it("is null for no boxes", () => {
    expect(nearestBox([], 0, 0)).toBeNull();
  });
});

describe("closestEdge", () => {
  const box = { left: 0, top: 0, right: 100, bottom: 60 };
  it("picks the nearest side", () => {
    expect(closestEdge(box, 4, 30)).toBe("left");
    expect(closestEdge(box, 96, 30)).toBe("right");
    expect(closestEdge(box, 50, 3)).toBe("top");
    expect(closestEdge(box, 50, 58)).toBe("bottom");
  });
});

describe("treePosition", () => {
  it("splits a row into thirds", () => {
    expect(treePosition(0, 30, 5)).toBe("before");
    expect(treePosition(0, 30, 15)).toBe("inside");
    expect(treePosition(0, 30, 25)).toBe("after");
  });

  it("splits a row that cannot take a child into halves", () => {
    expect(treePosition(0, 30, 14, false)).toBe("before");
    expect(treePosition(0, 30, 16, false)).toBe("after");
  });
});

describe("cellAt", () => {
  it("rounds to the nearest cell and clamps", () => {
    expect(cellAt(0, 100, 4)).toBe(0);
    expect(cellAt(160, 100, 4)).toBe(2);
    expect(cellAt(-50, 100, 4)).toBe(0);
    expect(cellAt(900, 100, 4)).toBe(3);
    expect(cellAt(900, 100, Number.POSITIVE_INFINITY)).toBe(9);
  });
});
