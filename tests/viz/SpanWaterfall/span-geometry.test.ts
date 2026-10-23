import { buildSpans } from "../../../src/viz/SpanWaterfall/span-geometry.js";

type Span = {
  id: string;
  parent: string | null;
  name: string;
  service: string;
  start: number;
  ms: number;
};

const trace: Span[] = [
  {
    id: "gw",
    parent: null,
    name: "route",
    service: "gateway",
    start: 0,
    ms: 160,
  },
  {
    id: "api",
    parent: "gw",
    name: "GET /checkout",
    service: "api",
    start: 20,
    ms: 90,
  },
  {
    id: "db",
    parent: "api",
    name: "query orders",
    service: "db",
    start: 35,
    ms: 40,
  },
  {
    id: "cache",
    parent: "api",
    name: "cache get",
    service: "cache",
    start: 80,
    ms: 12,
  },
  {
    id: "auth",
    parent: "gw",
    name: "session",
    service: "auth",
    start: 22,
    ms: 28,
  },
  {
    id: "render",
    parent: "gw",
    name: "html",
    service: "api",
    start: 115,
    ms: 45,
  },
];

const options = {
  id: (row: Span) => row.id,
  parent: (row: Span) => row.parent,
  start: (row: Span) => row.start,
  duration: (row: Span) => row.ms,
  label: (row: Span) => row.name,
  group: (row: Span) => row.service,
};

describe("buildSpans", () => {
  test("orders spans depth first with their depth, and places them on the trace", () => {
    const tree = buildSpans(trace, options);
    expect(tree.domain).toEqual([0, 160]);
    expect(tree.rows.map((row) => `${row.depth}:${row.id}`)).toEqual([
      "0:gw",
      "1:api",
      "2:db",
      "2:cache",
      "1:auth",
      "1:render",
    ]);
    const api = tree.rows[1];
    expect(api.startPct).toBeCloseTo(12.5);
    expect(api.widthPct).toBeCloseTo(56.25);
    expect(api.offset).toBe(20);
    expect(api.duration).toBe(90);
    expect(api.children).toBe(2);
  });

  test("marks the critical path: from each root, the child that ends last", () => {
    const tree = buildSpans(trace, options);
    expect(
      tree.rows.filter((row) => row.critical).map((row) => row.id),
    ).toEqual(["gw", "render"]);
  });

  test("colors by group in first-seen order and lists the groups", () => {
    const tree = buildSpans(trace, { ...options, groups: { db: "warning" } });
    expect(tree.groups.map((entry) => entry.key)).toEqual([
      "gateway",
      "api",
      "db",
      "cache",
      "auth",
    ]);
    expect(tree.rows[2].color).toBe("var(--cds-viz-warning)");
    expect(tree.rows[1].color).toBe(tree.rows[5].color);
  });

  test("leaves out what is under a collapsed span but keeps its child count", () => {
    const tree = buildSpans(trace, { ...options, collapsed: ["api"] });
    expect(tree.rows.map((row) => row.id)).toEqual([
      "gw",
      "api",
      "auth",
      "render",
    ]);
    expect(tree.rows[1].collapsed).toBe(true);
    expect(tree.rows[1].children).toBe(2);
  });

  test("labels the axis with offsets, or with times when absolute", () => {
    const relative = buildSpans(trace, { ...options, locale: "en-US" });
    expect(relative.ticks[0]).toEqual({ value: 0, pct: 0, label: "0ms" });
    expect(relative.ticks.at(-1)?.label).toBe("150ms");

    const at = (ms: number) => new Date(2026, 0, 1, 9, 0, 0, ms).getTime();
    const dated = trace.map((row) => ({ ...row, start: at(row.start * 1000) }));
    const absolute = buildSpans(dated, {
      ...options,
      duration: (row: Span) => row.ms * 1000,
      absolute: true,
      locale: "en-US",
    });
    expect(absolute.ticks[0].label).toMatch(/9:00/);
    expect(absolute.ticks.length).toBeGreaterThan(1);

    // A trace shorter than a second has no times of day to show.
    const brief = buildSpans(
      trace.map((row) => ({ ...row, start: at(row.start) })),
      { ...options, absolute: true, locale: "en-US" },
    );
    expect(brief.ticks.map((tick) => tick.label)).toEqual([
      "0ms",
      "50ms",
      "100ms",
      "150ms",
    ]);
  });

  test("clips to a fixed domain and drops a span with no usable time", () => {
    const tree = buildSpans(
      [
        ...trace,
        {
          id: "bad",
          parent: "gw",
          name: "?",
          service: "x",
          start: Number.NaN,
          ms: 1,
        },
      ],
      { ...options, domain: [50, 120] },
    );
    expect(tree.rows.some((row) => row.id === "bad")).toBe(false);
    const gw = tree.rows[0];
    expect(gw.startPct).toBe(0);
    expect(gw.widthPct).toBe(100);
    expect(gw.from).toBe(0);
  });
});
