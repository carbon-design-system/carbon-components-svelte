import { lttb } from "../../../src/viz/utils/downsample-lttb.js";

type Row = { x: number; y: number };

const x = (row: Row) => row.x;
const y = (row: Row) => row.y;

function buildSmooth(n: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) rows.push({ x: i, y: Math.sin(i / 50) });
  return rows;
}

describe("lttb", () => {
  test("output length equals threshold", () => {
    const rows = buildSmooth(1000);
    expect(lttb(rows, 100, x, y)).toHaveLength(100);
  });

  test("preserves the first and last rows", () => {
    const rows = buildSmooth(1000);
    const out = lttb(rows, 100, x, y);
    expect(out[0]).toBe(rows[0]);
    expect(out[out.length - 1]).toBe(rows[rows.length - 1]);
  });

  test("returns the same array reference when threshold >= rows.length", () => {
    const rows = buildSmooth(50);
    expect(lttb(rows, 50, x, y)).toBe(rows);
    expect(lttb(rows, 100, x, y)).toBe(rows);
  });

  test("returns the same array reference when threshold < 3", () => {
    const rows = buildSmooth(50);
    expect(lttb(rows, 2, x, y)).toBe(rows);
    expect(lttb(rows, 0, x, y)).toBe(rows);
  });

  test("preserves original row object identity", () => {
    const rows = buildSmooth(500);
    const out = lttb(rows, 50, x, y);
    for (const row of out) expect(rows).toContain(row);
  });

  test("a lone spike in 10,000 otherwise-smooth points survives downsampling to 200", () => {
    const rows = buildSmooth(10_000);
    const spikeIndex = 5000;
    rows[spikeIndex] = { x: spikeIndex, y: 1000 };
    const out = lttb(rows, 200, x, y);
    expect(out).toContain(rows[spikeIndex]);
  });

  test("output x is strictly ascending", () => {
    const rows = buildSmooth(2000);
    const out = lttb(rows, 150, x, y);
    for (let i = 1; i < out.length; i++) {
      expect(x(out[i])).toBeGreaterThan(x(out[i - 1]));
    }
  });

  test("a long run of NaN y values does not make every selected row NaN, and a spike inside it still survives", () => {
    const rows = buildSmooth(5000);
    for (let i = 1000; i < 3000; i++) rows[i] = { x: i, y: Number.NaN };
    const spikeIndex = 2000;
    rows[spikeIndex] = { x: spikeIndex, y: 50 };

    const out = lttb(rows, 200, x, y);
    expect(out).toContain(rows[spikeIndex]);
    expect(out.some((row) => Number.isFinite(row.y))).toBe(true);
  });
});
