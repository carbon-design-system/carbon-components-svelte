import { buildPack } from "../../../src/viz/CirclePackChart/pack-geometry.js";

type Row = { team: string; repo: string; commits: number };

const rows: Row[] = [
  { team: "Platform", repo: "gateway", commits: 400 },
  { team: "Platform", repo: "scheduler", commits: 100 },
  { team: "Platform", repo: "scheduler", commits: 125 },
  { team: "Data", repo: "warehouse", commits: 225 },
  { team: "Data", repo: "etl", commits: 25 },
  { team: "Data", repo: "empty", commits: 0 },
];
const base = {
  value: (row: Row) => row.commits,
  label: (row: Row) => row.repo,
  size: 400,
};

describe("buildPack", () => {
  test("groups leaves, sums shared labels, and sorts largest first", () => {
    const pack = buildPack(rows, { ...base, group: (row: Row) => row.team });

    expect(pack.total).toBe(875);
    expect(pack.groups.map((g) => [g.key, g.value])).toEqual([
      ["Platform", 625],
      ["Data", 250],
    ]);
    expect(pack.groups[0].leaves.map((l) => [l.key, l.value])).toEqual([
      ["gateway", 400],
      ["scheduler", 225],
    ]);
    expect(pack.groups[1].leaves.map((l) => l.key)).toEqual([
      "warehouse",
      "etl",
    ]);
  });

  test("makes a circle's area follow its value", () => {
    const pack = buildPack(rows, { ...base, group: (row: Row) => row.team });
    const [gateway, scheduler] = pack.groups[0].leaves;

    expect((gateway.r / scheduler.r) ** 2).toBeCloseTo(400 / 225);
  });

  test("fits the square, holds leaves inside their group, and never overlaps", () => {
    const pack = buildPack(rows, { ...base, group: (row: Row) => row.team });

    for (const g of pack.groups) {
      expect(g.cx - g.r).toBeGreaterThanOrEqual(-1e-6);
      expect(g.cx + g.r).toBeLessThanOrEqual(400 + 1e-6);
      for (const leaf of g.leaves) {
        expect(
          Math.hypot(leaf.cx - g.cx, leaf.cy - g.cy) + leaf.r,
        ).toBeLessThanOrEqual(g.r + 1e-6);
      }
    }
    const leaves = pack.groups.flatMap((g) => g.leaves);
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const gap =
          Math.hypot(leaves[i].cx - leaves[j].cx, leaves[i].cy - leaves[j].cy) -
          leaves[i].r -
          leaves[j].r;
        expect(gap).toBeGreaterThanOrEqual(-1e-6);
      }
    }
  });

  test("labels a circle only when it can hold one, shortening to fit", () => {
    const pack = buildPack(
      [
        { team: "a", repo: "a-very-long-repository-name", commits: 900 },
        { team: "a", repo: "tiny", commits: 1 },
      ],
      { ...base, size: 120 },
    );
    const [big, small] = pack.groups[0].leaves;

    expect(big.label.endsWith("…")).toBe(true);
    expect(big.label.length).toBeLessThan("a-very-long-repository-name".length);
    expect(small.label).toBe("");
  });

  test("puts every leaf in one unnamed group without a group accessor", () => {
    const pack = buildPack(rows, base);

    expect(pack.grouped).toBe(false);
    expect(pack.groups.map((g) => g.key)).toEqual([""]);
    expect(pack.groups[0].leaves).toHaveLength(4);
  });

  test("is empty for no rows", () => {
    expect(buildPack([], base)).toEqual({
      total: 0,
      grouped: false,
      groups: [],
    });
  });
});
