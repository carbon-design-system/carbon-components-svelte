import { upset } from "../../../src/viz/utils/upset.js";

type Row = { id: number; tags: string[] };

const rows: Row[] = [
  { id: 1, tags: ["a", "b", "c"] },
  { id: 2, tags: ["a", "b", "c"] },
  { id: 3, tags: ["a", "b"] },
  { id: 4, tags: ["a", "b"] },
  { id: 5, tags: ["a", "b"] },
  { id: 6, tags: ["a"] },
  { id: 7, tags: ["c", "zzz"] },
  { id: 8, tags: [] },
];
const sets = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c" },
];
const options = { sets, membership: (row: Row) => row.tags };

describe("upset", () => {
  test("counts each row once, in its exact combination, largest first", () => {
    const result = upset(rows, options);
    expect(result.combinations.map((entry) => [entry.key, entry.size])).toEqual(
      [
        ["a+b", 3],
        ["a+b+c", 2],
        ["a", 1],
        ["c", 1],
      ],
    );
    expect(result.combinations[0].pct).toBe(100);
    expect(result.combinations[1].pct).toBeCloseTo(66.667, 2);
    expect(result.combinations[0].share).toBeCloseTo(3 / 8);
    expect(result.combinations[0].rows.map((row) => row.id)).toEqual([3, 4, 5]);
    expect(result.counted).toBe(8);
  });

  test("totals each set over every row in it and ignores unknown sets", () => {
    const result = upset(rows, options);
    expect(result.sets).toEqual([
      { id: "a", label: "Alpha", total: 6, pct: 100 },
      { id: "b", label: "Beta", total: 5, pct: (5 / 6) * 100 },
      { id: "c", label: "c", total: 3, pct: 50 },
    ]);
  });

  test("sorts by degree, shows empty combinations, and caps the list", () => {
    const byDegree = upset(rows, { ...options, sort: "degree" });
    expect(byDegree.combinations.map((entry) => entry.key)).toEqual([
      "a",
      "c",
      "a+b",
      "a+b+c",
    ]);
    const all = upset(rows, { ...options, showEmpty: true });
    expect(all.combinations).toHaveLength(7);
    expect(all.combinations.at(-1)).toMatchObject({ size: 0, pct: 0 });
    expect(
      upset(rows, { ...options, maxCombinations: 2 }).combinations,
    ).toHaveLength(2);
  });

  test("handles no rows and rows in no set", () => {
    const empty = upset([], options);
    expect(empty.combinations).toEqual([]);
    expect(empty.sets.map((set) => set.total)).toEqual([0, 0, 0]);
    expect(empty.counted).toBe(0);
  });
});
