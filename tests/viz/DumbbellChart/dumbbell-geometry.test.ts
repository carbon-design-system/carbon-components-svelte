import { buildDumbbells } from "../../../src/viz/Chart/dumbbell-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

type Row = { team: string; year: string; score: number | null };

const rows: Row[] = [
  { team: "Web", year: "2025", score: 62 },
  { team: "Web", year: "2026", score: 78 },
  { team: "Data", year: "2025", score: 71 },
  { team: "Data", year: "2026", score: 65 },
  { team: "Ops", year: "2025", score: 50 },
  { team: "Ops", year: "2026", score: null },
  { team: "Sales", year: "2025", score: 40 },
];

function setup(hidden: string[] = []) {
  const built = buildGroups(rows, {
    x: (row) => row.team,
    y: (row) => row.score,
    series: (row) => row.year,
    hidden,
  });
  const scales = buildScales(
    resolveDomain(built, { zero: false }),
    { width: 640, height: 300 },
    { orientation: "horizontal" },
  );
  return { groups: built.groups, scales };
}

describe("buildDumbbells", () => {
  test("pairs the first two series by slot and skips incomplete slots", () => {
    const { groups, scales } = setup();
    const pairs = buildDumbbells(groups, scales);

    expect(
      pairs.map((pair) => [pair.slot, pair.from, pair.to, pair.change]),
    ).toEqual([
      [0, 62, 78, 16],
      [1, 71, 65, -6],
    ]);
    expect(pairs[0].start).toBeCloseTo(scales.y.map(62));
    expect(pairs[0].end).toBeCloseTo(scales.y.map(78));
    expect(pairs[0].along).toBeCloseTo(scales.x.map(0));
    expect(pairs[0].fromColor).not.toBe(pairs[0].toColor);
  });

  test("takes named series in either order", () => {
    const { groups, scales } = setup();
    const pairs = buildDumbbells(groups, scales, { from: "2026", to: "2025" });

    expect(pairs[0]).toMatchObject({ from: 78, to: 62, change: -16 });
  });

  test("draws nothing with one series, or an unknown name", () => {
    const { groups, scales } = setup(["2026"]);

    expect(buildDumbbells(groups, scales)).toEqual([]);
    expect(buildDumbbells(setup().groups, scales, { to: "2027" })).toEqual([]);
  });
});
