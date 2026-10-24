// @vitest-environment node
import {
  GROWTH_LIMIT,
  growthLimit,
  judge,
  parseAllowance,
  suggestAllowance,
} from "../../scripts/lib/css-size";

// all.css on master, 2026-10-24.
const BASE = { min: 791_899, gzip: 92_231 };

describe("judge", () => {
  it("passes a feature PR's growth", () => {
    // #4083, the CSS Grid module.
    const head = { min: BASE.min + 18_700, gzip: BASE.gzip + 2_100 };
    expect(judge("all", BASE, head, GROWTH_LIMIT).over).toEqual([]);
  });

  it("fails a revert of the legacy-selector pruning", () => {
    // 7e301af6f, measured on its parent and itself.
    const head = { min: BASE.min + 34_134, gzip: BASE.gzip + 3_326 };
    expect(judge("all", BASE, head, GROWTH_LIMIT).over).toEqual([
      "min",
      "gzip",
    ]);
  });

  it("fails a bulk regression on each metric it exceeds", () => {
    const head = { min: BASE.min + 50_000, gzip: BASE.gzip + 6_000 };
    expect(judge("all", BASE, head, GROWTH_LIMIT)).toMatchObject({
      delta: { min: 50_000, gzip: 6_000 },
      over: ["min", "gzip"],
    });
  });

  it("passes a sheet that shrinks", () => {
    const head = { min: BASE.min - 100_000, gzip: BASE.gzip - 9_000 };
    expect(judge("all", BASE, head, GROWTH_LIMIT).over).toEqual([]);
  });
});

describe("parseAllowance", () => {
  it("reads the limits and the reason", () => {
    expect(
      parseAllowance("9 kB gzip, 70.5 kB min; adds the v11 chart styles"),
    ).toEqual({
      limit: { gzip: 9_000, min: 70_500 },
      reason: "adds the v11 chart styles",
    });
    expect(parseAllowance("12 KB GZIP; vendors a module")).toEqual({
      limit: { gzip: 12_000 },
      reason: "vendors a module",
    });
  });

  it("rejects a trailer without an amount or a reason", () => {
    expect(parseAllowance("adds the v11 chart styles")).toHaveProperty("error");
    expect(parseAllowance("9 kB gzip")).toHaveProperty("error");
    expect(parseAllowance("9 kB gzip;  ")).toHaveProperty("error");
    expect(parseAllowance("9 kB gzip; <why this PR needs it>")).toHaveProperty(
      "error",
    );
  });
});

describe("growthLimit", () => {
  it("raises each metric to the largest allowance, never lowers it", () => {
    const allowances = [
      { limit: { gzip: 9_000 }, reason: "a" },
      { limit: { gzip: 7_000, min: 10_000 }, reason: "b" },
    ];
    expect(growthLimit(allowances)).toEqual({
      min: GROWTH_LIMIT.min,
      gzip: 9_000,
    });
    expect(growthLimit([])).toEqual(GROWTH_LIMIT);
  });

  it("lets an allowance pass the growth it names", () => {
    const head = { min: BASE.min + 50_000, gzip: BASE.gzip + 6_000 };
    const allowance = parseAllowance(
      suggestAllowance([judge("all", BASE, head, GROWTH_LIMIT)]).replace(
        "<why this PR needs it>",
        "vendors a module",
      ),
    );
    if ("error" in allowance) throw new Error(allowance.error);
    expect(allowance.limit).toEqual({ min: 50_000, gzip: 6_000 });
    expect(judge("all", BASE, head, growthLimit([allowance])).over).toEqual([]);
  });
});

describe("suggestAllowance", () => {
  it("names only the metrics over the limit, rounded up to whole kB", () => {
    const head = { min: BASE.min + 20_000, gzip: BASE.gzip + 5_400 };
    expect(suggestAllowance([judge("all", BASE, head, GROWTH_LIMIT)])).toBe(
      "CSS-Size-Growth: 6 kB gzip; <why this PR needs it>",
    );
  });
});
