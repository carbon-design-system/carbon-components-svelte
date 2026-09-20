import {
  buildGroups,
  buildScales,
  resolveDomain,
  sameDomain,
} from "../../../src/viz/Chart/model.js";

type Row = { d: Date; r: string; v: number };

function makeRows(): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 5; i++) {
    rows.push({ d: new Date(2026, 0, 1 + i), r: "a", v: i * 10 });
    rows.push({ d: new Date(2026, 0, 1 + i), r: "b", v: 100 - i * 5 });
  }
  return rows;
}

const accessors = {
  x: (row: Row) => row.d,
  y: (row: Row) => row.v,
  series: (row: Row) => row.r,
};

describe("buildGroups", () => {
  test("groups rows by series in first-seen order and keeps the row objects", () => {
    const rows = makeRows();
    const built = buildGroups(rows, accessors);

    expect(built.groups.map((group) => group.key)).toEqual(["a", "b"]);
    expect(built.groups[0].rows[0]).toBe(rows[0]);
    expect(built.groups[0].ys).toEqual([0, 10, 20, 30, 40]);
    expect(built.kind).toBe("time");
    expect(built.yExtent).toEqual([0, 100]);
  });

  test("assigns a prescribed color group, overridden per key", () => {
    expect(
      buildGroups(makeRows(), accessors).groups.map((group) => group.color),
    ).toEqual(["var(--cds-viz-group-2-1-1)", "var(--cds-viz-group-2-1-2)"]);

    const custom = buildGroups(makeRows(), {
      ...accessors,
      palette: 2,
      colors: { b: "success" },
    });
    expect(custom.groups.map((group) => group.color)).toEqual([
      "var(--cds-viz-group-2-2-1)",
      "var(--cds-viz-success)",
    ]);
  });

  test("leaves a hidden series out of the extents but keeps the group", () => {
    const built = buildGroups(makeRows(), { ...accessors, hidden: ["b"] });

    expect(built.groups).toHaveLength(2);
    expect(built.groups[1].hidden).toBe(true);
    expect(built.yExtent).toEqual([0, 40]);
  });

  test("treats string x as categories, in first-seen order", () => {
    const built = buildGroups(
      [
        { q: "Q1", v: 3 },
        { q: "Q2", v: 5 },
        { q: "Q1", v: 4 },
      ],
      { x: (row) => row.q, y: (row) => row.v, series: () => "s" },
    );

    expect(built.kind).toBe("category");
    expect(built.categories).toEqual(["Q1", "Q2"]);
    expect(built.groups[0].xs).toEqual([0, 1, 0]);
  });

  test("ignores a missing y in the extent but keeps its slot", () => {
    const built = buildGroups(
      [
        { x: 0, v: 1 },
        { x: 1, v: null },
        { x: 2, v: 3 },
      ],
      { x: (row) => row.x, y: (row) => row.v, series: () => "s" },
    );

    expect(built.yExtent).toEqual([1, 3]);
    expect(built.groups[0].ys).toHaveLength(3);
  });

  test("has no extents for empty data", () => {
    const built = buildGroups([], accessors);

    expect(built.groups).toEqual([]);
    expect(built.xExtent).toBeNull();
    expect(built.yExtent).toBeNull();
  });
});

describe("resolveDomain", () => {
  const built = buildGroups(makeRows(), accessors);

  test("includes zero and rounds out by default", () => {
    const high = buildGroups(
      [
        { x: 0, v: 43 },
        { x: 1, v: 97 },
      ],
      { x: (row) => row.x, y: (row) => row.v, series: () => "s" },
    );

    expect(resolveDomain(high, {}).y).toEqual([0, 100]);
    expect(resolveDomain(high, { zero: false, yDomain: "auto" }).y).toEqual([
      43, 97,
    ]);
  });

  test("honors fixed bounds and values marks asked to include", () => {
    expect(resolveDomain(built, { yDomain: [10, 50] }).y).toEqual([10, 50]);
    expect(resolveDomain(built, { include: [250] }).y).toEqual([0, 250]);
    expect(resolveDomain(built, { include: [Number.NaN] }).y).toEqual([0, 100]);
  });

  test("never yields a non-finite domain for empty data", () => {
    const domain = resolveDomain(buildGroups([], accessors), {});

    expect(domain.x).toEqual([0, 1]);
    expect(domain.y).toEqual([0, 1]);
  });
});

describe("sameDomain", () => {
  test("is true when an appended row stays inside the domain", () => {
    const rows = makeRows();
    const before = resolveDomain(buildGroups(rows, accessors), {});
    const inRange = [...rows, { d: new Date(2026, 0, 3), r: "a", v: 55 }];

    expect(
      sameDomain(before, resolveDomain(buildGroups(inRange, accessors), {})),
    ).toBe(true);
  });

  test("is false when x or y grows, the kind changes, or categories differ", () => {
    const rows = makeRows();
    const before = resolveDomain(buildGroups(rows, accessors), {});
    const taller = [...rows, { d: new Date(2026, 0, 3), r: "a", v: 500 }];
    const longer = [...rows, { d: new Date(2026, 0, 9), r: "a", v: 5 }];

    expect(
      sameDomain(before, resolveDomain(buildGroups(taller, accessors), {})),
    ).toBe(false);
    expect(
      sameDomain(before, resolveDomain(buildGroups(longer, accessors), {})),
    ).toBe(false);
    expect(sameDomain(null, before)).toBe(false);
    expect(
      sameDomain(
        { ...before, kind: "category", categories: ["a"] },
        { ...before, kind: "category", categories: ["b"] },
      ),
    ).toBe(false);
  });
});

describe("buildScales", () => {
  const domain = resolveDomain(buildGroups(makeRows(), accessors), {});

  test("sizes the left margin from the formatted tick labels, with no measurement", () => {
    const compact = buildScales(domain, { width: 640, height: 288 });
    const wide = buildScales(
      domain,
      { width: 640, height: 288 },
      {
        yFormat: {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        },
      },
    );

    expect(wide.margin.left).toBeGreaterThan(compact.margin.left);
    expect(compact.plot.x0).toBe(compact.margin.left);
    expect(
      buildScales(domain, { width: 640, height: 288 }, { margin: { left: 80 } })
        .margin.left,
    ).toBe(80);
  });

  test("maps the domain onto the plot box, with y inverted", () => {
    const scales = buildScales(domain, { width: 640, height: 288 });

    expect(scales.x.map(domain.x[0])).toBe(scales.plot.x0);
    expect(scales.x.map(domain.x[1])).toBe(scales.plot.x1);
    expect(scales.y.map(0)).toBe(scales.plot.y1);
    expect(scales.y.map(100)).toBe(scales.plot.y0);
    expect(scales.x.invert(scales.x.map(domain.x[0]))).toBe(domain.x[0]);
  });

  test("shows fewer x ticks in a narrower plot", () => {
    const wide = buildScales(domain, { width: 900, height: 288 });
    const narrow = buildScales(domain, { width: 260, height: 288 });

    expect(narrow.xTicks.length).toBeLessThan(wide.xTicks.length);
  });

  test("gives a full-precision x label separate from the tick format", () => {
    const scales = buildScales(
      domain,
      { width: 640, height: 288 },
      { locale: "en-US" },
    );

    expect(scales.xLabel(new Date(2026, 0, 3).getTime())).toBe("Jan 3, 2026");
    expect(
      buildScales(
        domain,
        { width: 640, height: 288 },
        { xLabelFormat: () => "custom" },
      ).xLabel(0),
    ).toBe("custom");
  });

  test("labels midnight ticks with the date when sub-day ticks span several days", () => {
    const rows = [
      { d: new Date(2026, 0, 1), r: "a", v: 1 },
      { d: new Date(2026, 0, 4), r: "a", v: 2 },
    ];
    const scales = buildScales(
      resolveDomain(buildGroups(rows, accessors), {}),
      { width: 900, height: 288 },
      { locale: "en-US" },
    );
    const labels = scales.xTicks.map(scales.xFormat);

    expect(labels[0]).toBe("Jan 1");
    expect(labels).toContain("Jan 2");
    expect(labels.some((label) => /PM/.test(label))).toBe(true);
  });

  test("places categories on a point scale and inverts to the nearest index", () => {
    const built = buildGroups(
      [
        { q: "Q1", v: 3 },
        { q: "Q2", v: 5 },
        { q: "Q3", v: 4 },
      ],
      { x: (row) => row.q, y: (row) => row.v, series: () => "s" },
    );
    const scales = buildScales(resolveDomain(built, {}), {
      width: 400,
      height: 200,
    });

    expect(scales.xTicks.map(scales.xFormat)).toEqual(["Q1", "Q2", "Q3"]);
    const positions = scales.xTicks.map((tick) => scales.x.map(tick));
    expect(positions[1] - positions[0]).toBeCloseTo(
      positions[2] - positions[1],
    );
    expect(scales.x.invert(positions[1] + 3)).toBe(1);
    expect(scales.x.invert(-1000)).toBe(0);
    expect(scales.x.invert(1e6)).toBe(2);
  });

  test("never produces NaN for an empty chart", () => {
    const scales = buildScales(resolveDomain(buildGroups([], accessors), {}), {
      width: 640,
      height: 288,
    });

    expect(Number.isFinite(scales.x.map(0.5))).toBe(true);
    expect(Number.isFinite(scales.y.map(0.5))).toBe(true);
  });
});
