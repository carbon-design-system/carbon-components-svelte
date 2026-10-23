import { buildChord } from "../../../src/viz/ChordDiagram/chord-geometry.js";

type Row = { from: string; to: string; n: number };
const rows: Row[] = [
  { from: "Eng", to: "Design", n: 12 },
  { from: "Eng", to: "Sales", n: 4 },
  { from: "Design", to: "Eng", n: 8 },
  { from: "Sales", to: "Support", n: 3 },
  { from: "Support", to: "Eng", n: 2 },
  { from: "Support", to: "Support", n: 1 },
];
const options = {
  source: (row: Row) => row.from,
  target: (row: Row) => row.to,
  value: (row: Row) => row.n,
  radius: 100,
  thickness: 10,
  padAngle: 0,
};

describe("buildChord", () => {
  test("sizes each group by what it sends, in first-seen order around the circle", () => {
    const chord = buildChord(rows, options);
    expect(chord.groups.map((g) => g.key)).toEqual([
      "Eng",
      "Design",
      "Sales",
      "Support",
    ]);
    expect(chord.groups.map((g) => g.total)).toEqual([16, 8, 3, 3]);
    expect(chord.groups[0]).toMatchObject({ out: 16, in: 10, startAngle: 0 });
    expect(chord.groups[3]).toMatchObject({ out: 3, in: 4 });
    // 30 in all, so Eng spans 16/30 of the turn.
    expect(chord.groups[0].endAngle).toBeCloseTo((16 / 30) * Math.PI * 2);
    expect(chord.groups[3].endAngle).toBeCloseTo(Math.PI * 2);
    expect(chord.groups[0].d).toMatch(/^M/);
    expect(chord.total).toBe(30);
  });

  test("draws one ribbon per pair, the heavier direction as source, and a loop for a self flow", () => {
    const chord = buildChord(rows, options);
    expect(chord.ribbons.map((r) => `${r.source}>${r.target}`)).toEqual([
      "Eng>Design",
      "Eng>Sales",
      "Support>Eng",
      "Sales>Support",
      "Support>Support",
    ]);
    const engDesign = chord.ribbons[0];
    expect(engDesign).toMatchObject({ forward: 12, backward: 8, value: 20 });
    expect(engDesign.color).toBe(chord.groups[0].color);
    expect(engDesign.rows).toHaveLength(2);
    expect(engDesign.d).toMatch(
      /^M[\d.-]+,[\d.-]+A90,90,0,0,1,.*Q0,0 .*Q0,0 .*Z$/,
    );
    // A loop runs along its own sub-arc and curves straight back.
    expect(chord.ribbons[4].rows).toHaveLength(1);
    expect(chord.ribbons[4].d.match(/A90/g)).toHaveLength(1);
    expect(chord.ribbons[4].d.match(/Q0,0/g)).toHaveLength(1);
  });

  test("orders by size when asked, keeps the given node order otherwise, and takes fixed colors", () => {
    const sorted = buildChord(rows, { ...options, sort: "value" });
    expect(sorted.groups.map((g) => g.key)).toEqual([
      "Eng",
      "Design",
      "Sales",
      "Support",
    ]);
    const given = buildChord(rows, {
      ...options,
      nodes: ["Support", "Sales", "Design", "Eng"],
      colors: { Eng: "success" },
    });
    expect(given.groups.map((g) => g.key)).toEqual([
      "Support",
      "Sales",
      "Design",
      "Eng",
    ]);
    expect(given.groups[3].color).toBe("var(--cds-viz-success)");
    expect(given.groups[3].flip).toBe(true);
  });

  test("pads between groups and drops flows that are not positive", () => {
    const chord = buildChord(
      [
        ...rows,
        { from: "Eng", to: "Sales", n: -3 },
        { from: "Eng", to: "Ops", n: 0 },
      ],
      { ...options, padAngle: 0.1 },
    );
    expect(chord.groups.map((g) => g.key)).not.toContain("Ops");
    expect(chord.groups[1].startAngle - chord.groups[0].endAngle).toBeCloseTo(
      0.1,
    );
    expect(chord.groups[3].endAngle).toBeCloseTo(Math.PI * 2 - 0.1);
  });
});
