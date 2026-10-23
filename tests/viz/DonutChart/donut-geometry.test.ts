import { buildDonut } from "../../../src/viz/DonutChart/donut-geometry.js";

type Row = { device: string; sessions: number };

const rows: Row[] = [
  { device: "Tablet", sessions: 11 },
  { device: "Desktop", sessions: 40 },
  { device: "Mobile", sessions: 31 },
  { device: "Desktop", sessions: 12 },
  { device: "TV", sessions: 4 },
  { device: "Watch", sessions: 2 },
];
const base = {
  value: (row: Row) => row.sessions,
  category: (row: Row) => row.device,
  diameter: 200,
};

describe("buildDonut", () => {
  test("sums rows by category and puts the largest first", () => {
    const donut = buildDonut(rows, base);

    expect(donut.total).toBe(100);
    expect(donut.slices.map((s) => [s.id, s.value])).toEqual([
      ["Desktop", 52],
      ["Mobile", 31],
      ["Tablet", 11],
      ["TV", 4],
      ["Watch", 2],
    ]);
    expect(donut.slices[0].rows).toEqual([rows[1], rows[3]]);
    expect(donut.slices[0].share).toBe(0.52);
  });

  test("keeps first-seen order with sort off", () => {
    const donut = buildDonut(rows, { ...base, sort: false });

    expect(donut.slices.map((s) => s.id)).toEqual([
      "Tablet",
      "Desktop",
      "Mobile",
      "TV",
      "Watch",
    ]);
  });

  test("folds the smallest into a neutral slice that keeps their rows", () => {
    const donut = buildDonut(rows, {
      ...base,
      maxSlices: 3,
      otherLabel: "Rest",
    });
    const other = donut.slices[2];

    expect(donut.slices).toHaveLength(3);
    expect(other).toMatchObject({
      id: "other",
      label: "Rest",
      value: 17,
      other: true,
      color: "var(--cds-viz-neutral)",
    });
    expect(other.rows).toEqual([rows[0], rows[4], rows[5]]);
  });

  test("draws a path for each slice, a full ring for a lone one, and none for zero", () => {
    expect(
      buildDonut(rows, base).slices.every((s) => s.d.startsWith("M")),
    ).toBe(true);

    const lone = buildDonut(
      [
        { device: "a", sessions: 5 },
        { device: "b", sessions: 0 },
      ],
      base,
    );
    expect(lone.slices[0].d.match(/A/g)).toHaveLength(4);
    expect(lone.slices[1].d).toBe("");
  });

  test("makes a pie with no hole", () => {
    const pie = buildDonut(rows, { ...base, innerRadius: 0 });

    // A wedge comes back to the center instead of tracing an inner arc.
    expect(pie.slices[0].d).toContain("L100,100");
  });

  test("assigns distinct palette colors, overridden per category", () => {
    const donut = buildDonut(rows, { ...base, colors: { Mobile: "success" } });
    const colors = donut.slices.map((s) => s.color);

    expect(colors[1]).toBe("var(--cds-viz-success)");
    expect(new Set(colors).size).toBe(5);
  });

  test("counts bad values as zero and survives no rows", () => {
    expect(
      buildDonut([{ device: "a", sessions: Number.NaN }], base).total,
    ).toBe(0);
    expect(buildDonut([], base)).toEqual({ total: 0, slices: [] });
  });
});
