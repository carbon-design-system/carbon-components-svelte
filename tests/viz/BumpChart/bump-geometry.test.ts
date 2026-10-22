import { buildBump } from "../../../src/viz/BumpChart/bump-geometry.js";

type Row = { week: string; team: string; rank?: number; points?: number };
const ranked: Row[] = [
  { week: "W1", team: "A", rank: 1 },
  { week: "W1", team: "B", rank: 2 },
  { week: "W1", team: "C", rank: 3 },
  { week: "W2", team: "A", rank: 2 },
  { week: "W2", team: "B", rank: 1 },
  { week: "W2", team: "C", rank: 3 },
  { week: "W3", team: "A", rank: 3 },
  { week: "W3", team: "B", rank: 1 },
  { week: "W3", team: "C", rank: 2 },
];
const options = {
  x: (row: Row) => row.week,
  series: (row: Row) => row.team,
  width: 400,
  height: 90,
  labelWidth: 50,
};

describe("buildBump", () => {
  test("lays a line per series through its ranks, rank one on top", () => {
    const bump = buildBump(ranked, { ...options, rank: (row) => row.rank });
    expect(bump.periods.map((p) => p.key)).toEqual(["W1", "W2", "W3"]);
    expect(bump.periods.map((p) => p.x)).toEqual([50, 200, 350]);
    expect(bump.ranks.map((r) => r.y)).toEqual([15, 45, 75]);
    const a = bump.lines[0];
    expect(a.points.map((p) => p.rank)).toEqual([1, 2, 3]);
    expect(a.points.map((p) => p.y)).toEqual([15, 45, 75]);
    expect(a).toMatchObject({ start: 1, end: 3, change: -2 });
    expect(bump.lines[1].change).toBe(1);
    expect(a.d).toBe("M50,15C125,15 125,45 200,45C275,45 275,75 350,75");
  });

  test("ranks by value when no rank is given, the largest first", () => {
    const scored: Row[] = [
      { week: "W1", team: "A", points: 10 },
      { week: "W1", team: "B", points: 30 },
      { week: "W2", team: "A", points: 40 },
      { week: "W2", team: "B", points: 20 },
    ];
    const bump = buildBump(scored, { ...options, y: (row) => row.points });
    expect(bump.lines[0].points.map((p) => p.rank)).toEqual([2, 1]);
    expect(bump.lines[1].points.map((p) => p.rank)).toEqual([1, 2]);
    expect(bump.lines[0].points[0].value).toBe(10);
  });

  test("breaks a line at a missing period", () => {
    const gappy = ranked.filter(
      (row) => !(row.week === "W2" && row.team === "C"),
    );
    const bump = buildBump(gappy, { ...options, rank: (row) => row.rank });
    const c = bump.lines[2];
    expect(c.points.map((p) => p.period)).toEqual(["W1", "W3"]);
    expect(c.d).toBe("M50,75M350,45");
  });

  test("spreads end labels and takes fixed colors", () => {
    const bump = buildBump(ranked, {
      ...options,
      rank: (row) => row.rank,
      height: 30,
      colors: { B: "warning" },
    });
    const lefts = bump.lines.map((line) => line.leftY).sort((a, b) => a - b);
    expect(lefts[1] - lefts[0]).toBeGreaterThanOrEqual(16);
    expect(bump.lines[1].color).toBe("var(--cds-viz-warning)");
  });
});
