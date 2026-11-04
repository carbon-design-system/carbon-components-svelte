import {
  dropZone,
  EDGE_RATIO,
  previewBox,
  slotEdge,
  zonePosition,
} from "../../src/utils/dock-drag.js";

// A group 400 wide and 300 tall, whose strip ends at y = 40.
const box = { left: 100, top: 0, right: 500, bottom: 300 };
const STRIP_BOTTOM = 40;
const zone = (x: number, y: number) => dropZone(box, STRIP_BOTTOM, x, y);

describe("dropZone", () => {
  it("is the strip over the strip, however far along it", () => {
    expect(zone(110, 10)).toBe("strip");
    expect(zone(490, 39)).toBe("strip");
  });

  it("is the center in the middle of the body", () => {
    expect(zone(300, 170)).toBe("center");
  });

  it("is an edge once the point is within the edge share of it", () => {
    const body = 300 - STRIP_BOTTOM;
    expect(zone(100 + 400 * (EDGE_RATIO - 0.01), 170)).toBe("left");
    expect(zone(100 + 400 * (1 - EDGE_RATIO + 0.01), 170)).toBe("right");
    expect(zone(300, STRIP_BOTTOM + body * (EDGE_RATIO - 0.01))).toBe("top");
    expect(zone(300, STRIP_BOTTOM + body * (1 - EDGE_RATIO + 0.01))).toBe(
      "bottom",
    );
    expect(zone(100 + 400 * (EDGE_RATIO + 0.01), 170)).toBe("center");
  });

  it("takes the nearer edge in a corner", () => {
    // Close to the left edge, and less close to the top.
    expect(zone(105, 60)).toBe("left");
    expect(zone(150, 45)).toBe("top");
  });

  it("is the center of a group with no body", () => {
    expect(dropZone(box, 300, 300, 300)).toBe("center");
  });
});

describe("zonePosition", () => {
  it("maps the left and right zones to the inline start and end", () => {
    expect(zonePosition("left")).toBe("start");
    expect(zonePosition("right")).toBe("end");
  });

  it("swaps them in a right-to-left page", () => {
    expect(zonePosition("left", true)).toBe("end");
    expect(zonePosition("right", true)).toBe("start");
  });

  it("keeps top and bottom, and joins on the center and the strip", () => {
    expect(zonePosition("top", true)).toBe("top");
    expect(zonePosition("bottom")).toBe("bottom");
    expect(zonePosition("center")).toBe("center");
    expect(zonePosition("strip")).toBe("center");
  });
});

describe("previewBox", () => {
  it("is half of the group on an edge and all of it otherwise", () => {
    expect(previewBox(box, "left")).toEqual({ ...box, right: 300 });
    expect(previewBox(box, "right")).toEqual({ ...box, left: 300 });
    expect(previewBox(box, "top")).toEqual({ ...box, bottom: 150 });
    expect(previewBox(box, "bottom")).toEqual({ ...box, top: 150 });
    expect(previewBox(box, "center")).toBe(box);
    expect(previewBox(box, "strip")).toBe(box);
  });
});

describe("slotEdge", () => {
  const lefts = [0, 100, 200];
  const rights = [100, 200, 300];

  it("is where the tab at the slot starts, or the last one ends", () => {
    expect(slotEdge(lefts, rights, 0)).toBe(0);
    expect(slotEdge(lefts, rights, 1)).toBe(100);
    expect(slotEdge(lefts, rights, 3)).toBe(300);
  });

  it("reads from the right edge when the tabs run right to left", () => {
    const rtlLefts = [200, 100, 0];
    const rtlRights = [300, 200, 100];
    expect(slotEdge(rtlLefts, rtlRights, 0, true)).toBe(300);
    expect(slotEdge(rtlLefts, rtlRights, 1, true)).toBe(200);
    expect(slotEdge(rtlLefts, rtlRights, 3, true)).toBe(0);
  });

  it("is 0 with no tabs", () => {
    expect(slotEdge([], [], 0)).toBe(0);
  });
});
