import { buildTimeline } from "../../../src/viz/StateTimeline/timeline-geometry.js";

type Row = { service: string; status: string; from: Date; to: Date };

const at = (hour: number) => new Date(2026, 0, 1, hour);
const rows: Row[] = [
  { service: "api", status: "ok", from: at(0), to: at(6) },
  { service: "api", status: "down", from: at(6), to: at(7) },
  { service: "api", status: "ok", from: at(7), to: at(12) },
  { service: "worker", status: "degraded", from: at(3), to: at(12) },
  { service: "worker", status: "ok", from: at(0), to: at(3) },
];
const base = {
  row: (row: Row) => row.service,
  state: (row: Row) => row.status,
  start: (row: Row) => row.from,
  end: (row: Row) => row.to,
  locale: "en-US",
};

describe("buildTimeline", () => {
  test("groups spans into rows and places them on a shared scale", () => {
    const timeline = buildTimeline(rows, base);

    expect(timeline.domain).toEqual([at(0).getTime(), at(12).getTime()]);
    expect(timeline.rows.map((row) => row.key)).toEqual(["api", "worker"]);
    expect(
      timeline.rows[0].segments.map((s) => [s.state, s.startPct, s.widthPct]),
    ).toEqual([
      ["ok", 0, 50],
      ["down", 50, (1 / 12) * 100],
      ["ok", (7 / 12) * 100, (5 / 12) * 100],
    ]);
    // Sorted by start, whatever the input order.
    expect(timeline.rows[1].segments.map((s) => s.state)).toEqual([
      "ok",
      "degraded",
    ]);
    expect(timeline.rows[0].segments[1].duration).toBe(3_600_000);
  });

  test("colors states in first-seen order, or by the states map", () => {
    const plain = buildTimeline(rows, base);
    expect(plain.states.map((s) => s.key)).toEqual(["ok", "down", "degraded"]);
    expect(new Set(plain.states.map((s) => s.color)).size).toBe(3);

    const named = buildTimeline(rows, {
      ...base,
      states: { ok: "success", down: "error", degraded: "#f1c21b" },
    });
    expect(named.states.map((s) => s.color)).toEqual([
      "var(--cds-viz-success)",
      "var(--cds-viz-error)",
      "#f1c21b",
    ]);
  });

  test("clips to a fixed domain and drops what lies outside it", () => {
    const timeline = buildTimeline(rows, { ...base, domain: [at(5), at(8)] });
    const api = timeline.rows[0].segments;

    expect(api.map((s) => s.state)).toEqual(["ok", "down", "ok"]);
    expect(api[0].startPct).toBe(0);
    expect(api[0].widthPct).toBeCloseTo((1 / 3) * 100);
    // The clipped span still reports its real bounds.
    expect(api[0].from).toBe(at(0).getTime());
    const worker = timeline.rows[1].segments;
    expect(worker.map((s) => s.state)).toEqual(["degraded"]);
  });

  test("puts ticks on calendar boundaries with labels", () => {
    const timeline = buildTimeline(rows, base);

    expect(timeline.ticks.length).toBeGreaterThan(2);
    expect(timeline.ticks[0]).toMatchObject({ pct: 0 });
    expect(timeline.ticks.every((tick) => tick.label.length > 0)).toBe(true);
  });

  test("skips spans with bad or reversed times, and survives nothing", () => {
    const timeline = buildTimeline(
      [
        { service: "a", status: "ok", from: at(2), to: at(1) },
        { service: "a", status: "ok", from: new Date("x"), to: at(1) },
      ],
      base,
    );

    expect(timeline.rows).toEqual([]);
    expect(timeline.domain).toEqual([0, 1]);
  });
});
