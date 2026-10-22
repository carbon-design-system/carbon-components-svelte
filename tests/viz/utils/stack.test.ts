import { stack } from "../../../src/viz/utils/stack.js";

type Row = { x: string; s: string; v: number | undefined };

const opts = {
  x: (row: Row) => row.x,
  y: (row: Row) => row.v,
  series: (row: Row) => row.s,
};

describe("stack", () => {
  test('"none" stacks in first-seen series order and returns rows in input order', () => {
    const rows: Row[] = [
      { x: "a", s: "y1", v: 1 },
      { x: "a", s: "y2", v: 2 },
      { x: "b", s: "y1", v: 3 },
      { x: "b", s: "y2", v: 4 },
    ];
    const result = stack(rows, opts);
    expect(result.map((row) => row.datum)).toEqual(rows);
    expect(result.map((row) => [row.y0, row.y1])).toEqual([
      [0, 1],
      [1, 3],
      [0, 3],
      [3, 7],
    ]);
  });

  test("order changes the stacking order", () => {
    const rows: Row[] = [
      { x: "a", s: "y1", v: 1 },
      { x: "a", s: "y2", v: 2 },
    ];
    const result = stack(rows, { ...opts, order: ["y2", "y1"] });
    expect(result.map((row) => [row.series, row.y0, row.y1])).toEqual([
      ["y1", 2, 3],
      ["y2", 0, 2],
    ]);
  });

  test('"diverging" sends negatives below zero', () => {
    const rows: Row[] = [
      { x: "a", s: "y1", v: 5 },
      { x: "a", s: "y2", v: -3 },
      { x: "a", s: "y3", v: 2 },
      { x: "a", s: "y4", v: -1 },
    ];
    const result = stack(rows, { ...opts, offset: "diverging" });
    expect(result.map((row) => [row.y0, row.y1])).toEqual([
      [0, 5],
      [0, -3],
      [5, 7],
      [-3, -4],
    ]);
  });

  test('"normalize" sums to 1 per x and treats negatives as zero', () => {
    const rows: Row[] = [
      { x: "a", s: "y1", v: 1 },
      { x: "a", s: "y2", v: 1 },
      { x: "a", s: "y3", v: 2 },
    ];
    const result = stack(rows, { ...opts, offset: "normalize" });
    expect(result[result.length - 1].y1).toBeCloseTo(1, 9);
    expect(result.map((row) => [row.y0, row.y1])).toEqual([
      [0, 0.25],
      [0.25, 0.5],
      [0.5, 1],
    ]);

    const withNegative = stack(
      [
        { x: "a", s: "y1", v: 1 },
        { x: "a", s: "y2", v: -5 },
      ],
      { ...opts, offset: "normalize" },
    );
    expect(withNegative[1].y0).toBe(withNegative[1].y1);
  });

  test('"normalize" keeps an all-zero column at zero, not NaN', () => {
    const result = stack(
      [
        { x: "a", s: "y1", v: 0 },
        { x: "a", s: "y2", v: 0 },
      ],
      { ...opts, offset: "normalize" },
    );
    for (const row of result) {
      expect(row.y0).toBe(0);
      expect(row.y1).toBe(0);
    }
  });

  test('"stream" centers each column on zero', () => {
    const result = stack(
      [
        { x: "a", s: "y1", v: 2 },
        { x: "a", s: "y2", v: 4 },
      ],
      { ...opts, offset: "stream" },
    );
    const lowest = Math.min(...result.map((row) => row.y0));
    const highest = Math.max(...result.map((row) => row.y1));
    expect(lowest + highest).toBeCloseTo(0, 9);
  });

  test("Date x values with equal time but different identity land in the same column", () => {
    const a = new Date(2020, 0, 1);
    const b = new Date(2020, 0, 1);
    expect(a).not.toBe(b);
    const result = stack(
      [
        { x: a, s: "y1", v: 1 },
        { x: b, s: "y2", v: 2 },
      ],
      {
        x: (row) => row.x,
        y: (row) => row.v,
        series: (row) => row.s,
      },
    );
    expect(result.map((row) => [row.y0, row.y1])).toEqual([
      [0, 1],
      [1, 3],
    ]);
  });

  test("missing or NaN y counts as 0", () => {
    const result = stack(
      [
        { x: "a", s: "y1", v: undefined },
        { x: "a", s: "y2", v: Number.NaN },
        { x: "a", s: "y3", v: 5 },
      ],
      opts,
    );
    expect(result[0].value).toBe(0);
    expect(result[1].value).toBe(0);
    expect(result.map((row) => [row.y0, row.y1])).toEqual([
      [0, 0],
      [0, 0],
      [0, 5],
    ]);
  });

  test("does not mutate the input array", () => {
    const rows: Row[] = [
      { x: "a", s: "y1", v: 1 },
      { x: "a", s: "y2", v: 2 },
    ];
    const snapshot = JSON.stringify(rows);
    stack(rows, opts);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
