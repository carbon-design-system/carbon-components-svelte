import { buildSlope } from "../../../src/viz/SlopeChart/slope-geometry.js";

type Row = { year: number; team: string; score: number | null };
const rows: Row[] = [
  { year: 2024, team: "A", score: 62 },
  { year: 2024, team: "B", score: 58 },
  { year: 2024, team: "C", score: 41 },
  { year: 2024, team: "D", score: 30 },
  { year: 2025, team: "A", score: 71 },
  { year: 2025, team: "B", score: 39 },
  { year: 2025, team: "C", score: 60 },
  { year: 2025, team: "D", score: null },
];
const options = {
  x: (row: Row) => row.year,
  y: (row: Row) => row.score,
  series: (row: Row) => row.team,
  width: 400,
  height: 200,
  labelWidth: 100,
};

describe("buildSlope", () => {
  test("pairs each series across the first two periods and drops one missing a value", () => {
    const slope = buildSlope(rows, options);
    expect(slope.periods).toEqual(["2024", "2025"]);
    expect(slope.lines.map((line) => line.key)).toEqual(["A", "B", "C"]);
    expect(slope.lines[0]).toMatchObject({
      from: 62,
      to: 71,
      change: 9,
      direction: "up",
    });
    expect(slope.lines[1].direction).toBe("down");
    expect(slope.x0).toBe(100);
    expect(slope.x1).toBe(300);
  });

  test("maps values onto a nice domain, the largest at the top", () => {
    const slope = buildSlope(rows, options);
    expect(slope.domain).toEqual([30, 80]);
    expect(slope.lines[0].y2).toBeCloseTo(200 - ((71 - 30) / 50) * 200);
    expect(slope.lines[2].y1).toBeGreaterThan(slope.lines[1].y1);
  });

  test("spreads end labels that would collide", () => {
    const close: Row[] = [
      { year: 2024, team: "A", score: 50 },
      { year: 2024, team: "B", score: 51 },
      { year: 2025, team: "A", score: 60 },
      { year: 2025, team: "B", score: 40 },
    ];
    const slope = buildSlope(close, options);
    expect(
      Math.abs(slope.lines[0].leftY - slope.lines[1].leftY),
    ).toBeGreaterThanOrEqual(16);
    expect(slope.lines[0].rightY).toBeCloseTo(slope.lines[0].y2);
  });

  test("honors an explicit period pair and fixed colors", () => {
    const slope = buildSlope(rows, {
      ...options,
      periods: [2025, 2024],
      colors: { A: "success" },
    });
    expect(slope.periods).toEqual(["2025", "2024"]);
    expect(slope.lines[0]).toMatchObject({
      from: 71,
      to: 62,
      direction: "down",
    });
    expect(slope.lines[0].color).toBe("var(--cds-viz-success)");
    expect(slope.lines[1].color).not.toBe(slope.lines[2].color);
  });

  test("is empty with fewer than two periods", () => {
    expect(buildSlope(rows.slice(0, 2), options).lines).toEqual([]);
  });
});
