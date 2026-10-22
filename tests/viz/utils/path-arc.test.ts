import {
  arcCentroid,
  pathArc,
  pieAngles,
} from "../../../src/viz/utils/path-arc.js";

describe("pathArc", () => {
  test("quarter annulus", () => {
    expect(
      pathArc({
        outerRadius: 50,
        innerRadius: 30,
        startAngle: 0,
        endAngle: Math.PI / 2,
      }),
    ).toBe("M0,-50A50,50,0,0,1,50,0L30,0A30,30,0,0,0,0,-30Z");
  });

  test("a pie wedge (innerRadius 0) ends with L0,0Z", () => {
    expect(
      pathArc({
        outerRadius: 50,
        innerRadius: 0,
        startAngle: 0,
        endAngle: Math.PI / 2,
      }),
    ).toBe("M0,-50A50,50,0,0,1,50,0L0,0Z");
  });

  test("a span greater than pi sets the large-arc flag", () => {
    const path = pathArc({
      outerRadius: 50,
      innerRadius: 0,
      startAngle: 0,
      endAngle: Math.PI * 1.5,
    });
    expect(path).toBe("M0,-50A50,50,0,1,1,-50,0L0,0Z");
  });

  test("a full circle renders two arcs per ring, the inner ring with the opposite sweep", () => {
    expect(
      pathArc({
        outerRadius: 50,
        innerRadius: 30,
        startAngle: 0,
        endAngle: Math.PI * 2,
      }),
    ).toBe(
      "M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z" +
        "M0,-30A30,30,0,1,0,0,30A30,30,0,1,0,0,-30Z",
    );
  });

  test("zero or negative outerRadius returns an empty string", () => {
    expect(
      pathArc({ outerRadius: 0, innerRadius: 0, startAngle: 0, endAngle: 1 }),
    ).toBe("");
    expect(
      pathArc({ outerRadius: -10, innerRadius: 0, startAngle: 0, endAngle: 1 }),
    ).toBe("");
  });

  test("swapped start/end angles give the same path", () => {
    const forward = pathArc({
      outerRadius: 50,
      startAngle: 0,
      endAngle: Math.PI / 2,
    });
    const swapped = pathArc({
      outerRadius: 50,
      startAngle: Math.PI / 2,
      endAngle: 0,
    });
    expect(swapped).toBe(forward);
  });

  test("padAngle shrinks both ends", () => {
    expect(
      pathArc({
        outerRadius: 50,
        innerRadius: 0,
        startAngle: 0,
        endAngle: Math.PI / 2,
        padAngle: 0.2,
      }),
    ).toBe("M4.99,-49.75A50,50,0,0,1,49.75,-4.99L0,0Z");
  });

  test("cx/cy offset the whole arc", () => {
    expect(
      pathArc({
        cx: 10,
        cy: 20,
        outerRadius: 50,
        innerRadius: 0,
        startAngle: 0,
        endAngle: Math.PI / 2,
      }),
    ).toBe("M10,-30A50,50,0,0,1,60,20L10,20Z");
  });
});

describe("arcCentroid", () => {
  test("returns the midpoint of the arc", () => {
    const centroid = arcCentroid({
      outerRadius: 100,
      innerRadius: 0,
      startAngle: 0,
      endAngle: Math.PI,
    });
    expect(centroid.x).toBeCloseTo(50);
    expect(centroid.y).toBeCloseTo(0);
  });
});

describe("pieAngles", () => {
  test("divides the span proportionally and sums to the span", () => {
    const slices = pieAngles([1, 3]);
    expect(slices[0].startAngle).toBe(0);
    expect(slices[0].endAngle).toBeCloseTo(Math.PI / 2);
    expect(slices[1].startAngle).toBeCloseTo(Math.PI / 2);
    expect(slices[1].endAngle).toBeCloseTo(Math.PI * 2);
    const span = slices.reduce(
      (sum, slice) => sum + (slice.endAngle - slice.startAngle),
      0,
    );
    expect(span).toBeCloseTo(Math.PI * 2);
  });

  test("an all-zero series yields zero-width slices, not NaN", () => {
    const slices = pieAngles([0, 0]);
    for (const slice of slices) {
      expect(slice.startAngle).toBe(slice.endAngle);
      expect(Number.isNaN(slice.startAngle)).toBe(false);
      expect(Number.isNaN(slice.endAngle)).toBe(false);
    }
  });

  test("negative and NaN values count as zero", () => {
    const slices = pieAngles([-5, Number.NaN, 10]);
    expect(slices[0].value).toBe(0);
    expect(slices[1].value).toBe(0);
    expect(slices[2].value).toBe(10);
    expect(slices[2].endAngle - slices[2].startAngle).toBeCloseTo(Math.PI * 2);
  });

  test("sort: true lays out the largest value first but keeps input order in the output", () => {
    const slices = pieAngles([1, 5, 2], { sort: true });
    expect(slices.map((slice) => slice.index)).toEqual([0, 1, 2]);
    expect(slices[1].startAngle).toBe(0);
    expect(slices[1].startAngle).toBeLessThan(slices[2].startAngle);
    expect(slices[2].startAngle).toBeLessThan(slices[0].startAngle);
  });

  test("accepts a custom start/end span", () => {
    const slices = pieAngles([1, 1], { startAngle: 0.5, endAngle: 1.5 });
    expect(slices[0].startAngle).toBeCloseTo(0.5);
    expect(slices[1].endAngle).toBeCloseTo(1.5);
  });
});
