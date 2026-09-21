import { buildTreemap } from "../../../src/viz/TreemapChart/treemap-geometry.js";

type Row = { team: string; service: string; cost: number };

const rows: Row[] = [
  { team: "Platform", service: "compute", cost: 40 },
  { team: "Platform", service: "storage", cost: 20 },
  { team: "Data", service: "warehouse", cost: 30 },
  { team: "Data", service: "warehouse", cost: 5 },
  { team: "Web", service: "cdn", cost: 5 },
  { team: "Web", service: "free", cost: 0 },
];
const base = {
  value: (row: Row) => row.cost,
  label: (row: Row) => row.service,
};

describe("buildTreemap", () => {
  test("groups leaves, sums shared labels, and sorts largest first", () => {
    const map = buildTreemap(rows, { ...base, group: (row: Row) => row.team });

    expect(map.total).toBe(100);
    expect(map.grouped).toBe(true);
    expect(map.groups.map((g) => [g.key, g.value])).toEqual([
      ["Platform", 60],
      ["Data", 35],
      ["Web", 5],
    ]);
    expect(map.groups[1].leaves[0]).toMatchObject({
      id: "Data/warehouse",
      value: 35,
      share: 0.35,
    });
    expect(map.groups[1].leaves[0].rows).toHaveLength(2);
    // A zero value has no area, so it is left out.
    expect(map.groups[2].leaves.map((leaf) => leaf.key)).toEqual(["cdn"]);
  });

  test("gives each group a share of the box, and each leaf a share of its group", () => {
    const map = buildTreemap(rows, { ...base, group: (row: Row) => row.team });
    const area = (r: { width: number; height: number }) =>
      (r.width * r.height) / 100;

    expect(area(map.groups[0].rect)).toBeCloseTo(60);
    expect(area(map.groups[1].rect)).toBeCloseTo(35);
    const [compute, storage] = map.groups[0].leaves;
    expect(area(compute.rect)).toBeCloseTo((40 / 60) * 100);
    expect(area(storage.rect)).toBeCloseTo((20 / 60) * 100);
    // `span` is a leaf's size as a share of the whole box.
    expect(compute.span.width * compute.span.height).toBeCloseTo(0.4);
    // The lone leaf of a group fills it.
    expect(map.groups[1].leaves[0].rect).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  test("makes every leaf its own group without a group accessor", () => {
    const map = buildTreemap(rows, base);

    expect(map.grouped).toBe(false);
    expect(map.groups.map((g) => g.key)).toEqual([
      "compute",
      "warehouse",
      "storage",
      "cdn",
    ]);
    expect(new Set(map.groups.map((g) => g.color)).size).toBe(4);
  });

  test("overrides a group's color", () => {
    const map = buildTreemap(rows, {
      ...base,
      group: (row: Row) => row.team,
      colors: { Data: "success" },
    });

    expect(map.groups[1].color).toBe("var(--cds-viz-success)");
  });

  test("is empty for no rows", () => {
    expect(buildTreemap([], base)).toEqual({
      total: 0,
      grouped: false,
      groups: [],
    });
  });
});
