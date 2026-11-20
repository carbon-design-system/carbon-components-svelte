// @vitest-environment node
import { layoutRail } from "../../src/TextAnnotations/rail-layout.js";
import {
  computeSegments,
  segmentsOfKind,
} from "../../src/TextAnnotations/segments.js";

describe("computeSegments", () => {
  it("splits overlapping spans into stretches that carry their ids", () => {
    const segments = computeSegments([
      { id: "a", start: 0, end: 10 },
      { id: "b", start: 6, end: 14 },
    ]);
    expect(segments.map((s) => [s.start, s.end, s.ids])).toEqual([
      [0, 6, ["a"]],
      [6, 10, ["a", "b"]],
      [10, 14, ["b"]],
    ]);
  });

  it("leaves gaps between spans unpainted", () => {
    const segments = computeSegments([
      { id: "a", start: 0, end: 3 },
      { id: "b", start: 8, end: 12 },
    ]);
    expect(segments.map((s) => [s.start, s.end])).toEqual([
      [0, 3],
      [8, 12],
    ]);
  });

  it("nests one span inside another", () => {
    const segments = computeSegments([
      { id: "outer", start: 0, end: 20 },
      { id: "inner", start: 5, end: 8 },
    ]);
    expect(segmentsOfKind(segments, "overlap")).toEqual([{ start: 5, end: 8 }]);
    expect(segmentsOfKind(segments, "base")).toEqual([{ start: 0, end: 20 }]);
  });

  it("marks the active annotation and the draft", () => {
    const segments = computeSegments(
      [
        { id: "a", start: 0, end: 10 },
        { id: "b", start: 6, end: 14 },
      ],
      { activeId: "b", draft: { start: 12, end: 20 } },
    );
    expect(segmentsOfKind(segments, "active")).toEqual([{ start: 6, end: 14 }]);
    expect(segmentsOfKind(segments, "draft")).toEqual([{ start: 12, end: 20 }]);
    expect(segmentsOfKind(segments, "base")).toEqual([{ start: 0, end: 20 }]);
  });

  it("ignores empty spans", () => {
    expect(computeSegments([{ id: "a", start: 4, end: 4 }])).toEqual([]);
  });

  it("joins touching spans that look alike in the base layer", () => {
    const segments = computeSegments([
      { id: "a", start: 0, end: 5 },
      { id: "b", start: 5, end: 9 },
    ]);
    expect(segmentsOfKind(segments, "base")).toEqual([{ start: 0, end: 9 }]);
  });
});

describe("layoutRail", () => {
  it("keeps cards at the top of their text when there is room", () => {
    const { tops } = layoutRail([
      { id: "a", top: 0, height: 60 },
      { id: "b", top: 200, height: 60 },
    ]);
    expect(tops).toEqual({ a: 0, b: 200 });
  });

  it("pushes a card down to clear the one above", () => {
    const { tops, height } = layoutRail(
      [
        { id: "a", top: 100, height: 80 },
        { id: "b", top: 110, height: 80 },
        { id: "c", top: 120, height: 80 },
      ],
      8,
    );
    expect(tops).toEqual({ a: 100, b: 188, c: 276 });
    expect(height).toBe(356);
  });

  it("keeps the order given, which is the order of the text", () => {
    const { tops } = layoutRail(
      [
        { id: "first", top: 50, height: 20 },
        { id: "second", top: 49, height: 20 },
        { id: "third", top: 200, height: 20 },
      ],
      4,
    );
    expect(tops).toEqual({ first: 50, second: 74, third: 200 });
  });

  it("lays out 200 cards in linear time", () => {
    const items = Array.from({ length: 200 }, (_, i) => ({
      id: `a${i}`,
      top: (i * 37) % 4000,
      height: 90,
    }));
    const started = performance.now();
    const { tops } = layoutRail(items);
    expect(performance.now() - started).toBeLessThan(20);
    for (let i = 1; i < items.length; i++) {
      expect(tops[items[i].id] - tops[items[i - 1].id]).toBeGreaterThanOrEqual(
        90,
      );
    }
  });
});
