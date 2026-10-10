import { getFunnelStats } from "../../../src/viz/utils/funnel.js";

type Stage = { id: string; label: string; value: number };

function stage(id: string, value: number): Stage {
  return { id, label: id.toUpperCase(), value };
}

describe("getFunnelStats", () => {
  const standard = [
    stage("a", 10000),
    stage("b", 6000),
    stage("c", 3000),
    stage("d", 900),
  ];

  test("a standard 4-stage funnel computes pct, stepRate, overallRate, and dropAbs", () => {
    const result = getFunnelStats(standard);
    expect(result.rows.map((row) => row.stats.pct)).toEqual([100, 60, 30, 9]);
    expect(result.rows.map((row) => row.stats.stepRate)).toEqual([
      null,
      0.6,
      0.5,
      0.3,
    ]);
    expect(result.rows.map((row) => row.stats.overallRate)).toEqual([
      1, 0.6, 0.3, 0.09,
    ]);
    expect(result.rows.map((row) => row.stats.dropAbs)).toEqual([
      null,
      4000,
      3000,
      2100,
    ]);
    expect(result.largestDropIndex).toBe(1);
    expect(result.overallRate).toBeCloseTo(0.09);
  });

  test("previousPct chains from the prior row's pct, 0 for the first stage", () => {
    const result = getFunnelStats(standard);
    expect(result.rows.map((row) => row.stats.previousPct)).toEqual([
      0, 100, 60, 30,
    ]);
  });

  test("a non-monotonic funnel scales to the max stage", () => {
    const stages = [
      stage("a", 100),
      stage("b", 50),
      stage("c", 200),
      stage("d", 20),
    ];
    const result = getFunnelStats(stages);
    expect(result.max).toBe(200);
    expect(result.rows.map((row) => row.stats.pct)).toEqual([50, 25, 100, 10]);

    const risingStage = result.rows[2];
    expect(risingStage.stats.stepRate).toBeGreaterThan(1);
    expect(risingStage.stats.dropAbs).toBeLessThan(0);
    expect(risingStage.stats.isLargestDrop).toBe(false);

    // The biggest absolute loss is still the largest drop, even though a
    // later stage rose above an earlier one.
    expect(result.largestDropIndex).toBe(3);
  });

  test("ties in dropAbs resolve to the earliest stage", () => {
    const stages = [
      stage("a", 100),
      stage("b", 80),
      stage("c", 80),
      stage("d", 60),
    ];
    const result = getFunnelStats(stages);
    expect(result.rows[1].stats.dropAbs).toBe(20);
    expect(result.rows[3].stats.dropAbs).toBe(20);
    expect(result.largestDropIndex).toBe(1);
    expect(result.rows[1].stats.isLargestDrop).toBe(true);
    expect(result.rows[3].stats.isLargestDrop).toBe(false);
  });

  test("negative and NaN values count as 0", () => {
    const stages = [stage("a", -5), stage("b", Number.NaN), stage("c", 10)];
    const result = getFunnelStats(stages);
    expect(result.rows.map((row) => row.stats.value)).toEqual([0, 0, 10]);
    expect(result.total).toBe(0);
  });

  test("empty input returns no rows, a null overallRate, and largestDropIndex -1", () => {
    const result = getFunnelStats([]);
    expect(result.rows).toEqual([]);
    expect(result.overallRate).toBeNull();
    expect(result.largestDropIndex).toBe(-1);
  });

  test("a zero first stage makes overallRate null for every row", () => {
    const stages = [stage("a", 0), stage("b", 5), stage("c", 3)];
    const result = getFunnelStats(stages);
    expect(result.rows.every((row) => row.stats.overallRate === null)).toBe(
      true,
    );
    expect(result.overallRate).toBeNull();
  });

  test("scale: 'sqrt' scales pct by the square root of value and max", () => {
    const result = getFunnelStats(standard, { scale: "sqrt" });
    expect(result.rows[0].stats.pct).toBeCloseTo(100);
    expect(result.rows[1].stats.pct).toBeCloseTo(
      (Math.sqrt(6000) / Math.sqrt(10000)) * 100,
    );
    expect(result.rows[3].stats.pct).toBeCloseTo(30);
  });

  test("does not mutate the input", () => {
    const stages = [stage("a", 100), stage("b", 50)];
    const snapshot = JSON.parse(JSON.stringify(stages));
    getFunnelStats(stages);
    expect(stages).toEqual(snapshot);
  });
});
