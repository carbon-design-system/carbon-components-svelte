import { buildOrg } from "../../../src/viz/OrgChart/org-geometry.js";

type Row = {
  id: string;
  manager: string | null;
  name: string;
  title: string;
  team?: string;
};

const people: Row[] = [
  { id: "vp", manager: null, name: "A. Rivera", title: "VP Engineering" },
  {
    id: "plat",
    manager: "vp",
    name: "K. Chen",
    title: "Director, Platform",
    team: "Platform",
  },
  {
    id: "prod",
    manager: "vp",
    name: "J. Patel",
    title: "Director, Product",
    team: "Product",
  },
  {
    id: "obs",
    manager: "plat",
    name: "M. Lee",
    title: "Observability",
    team: "Platform",
  },
  {
    id: "infra",
    manager: "plat",
    name: "S. Okafor",
    title: "Infrastructure",
    team: "Platform",
  },
  {
    id: "checkout",
    manager: "prod",
    name: "S. Ng",
    title: "Checkout",
    team: "Product",
  },
];
const options = {
  id: (row: Row) => row.id,
  parent: (row: Row) => row.manager,
  label: (row: Row) => row.name,
  sublabel: (row: Row) => row.title,
  group: (row: Row) => row.team,
  nodeWidth: 100,
  nodeHeight: 40,
  rankGap: 30,
  nodeGap: 20,
};

describe("buildOrg", () => {
  test("puts the root on top and each level in a row, parents centered over children", () => {
    const org = buildOrg(people, options);
    const by = Object.fromEntries(org.nodes.map((node) => [node.id, node]));
    expect(org.nodes.map((node) => node.id)).toEqual([
      "vp",
      "plat",
      "obs",
      "infra",
      "prod",
      "checkout",
    ]);
    expect(by.vp.y).toBe(0);
    expect(by.plat.y).toBe(70);
    expect(by.obs.y).toBe(140);
    expect(org.height).toBe(180);
    // Three leaves across.
    expect(org.width).toBe(340);
    expect(by.obs.x).toBe(0);
    expect(by.infra.x).toBe(120);
    expect(by.checkout.x).toBe(240);
    expect(by.plat.x).toBe(60);
    expect(by.vp.x).toBeCloseTo((by.plat.x + by.prod.x) / 2);
    expect(by.vp.sublabel).toBe("VP Engineering");
  });

  test("links each parent to its children with an elbow", () => {
    const org = buildOrg(people, options);
    expect(org.links).toHaveLength(5);
    // Root bottom center, half way down the gap, across, then into the
    // first child's top center.
    expect(org.links[0].id).toBe("vp/plat");
    expect(org.links[0].d).toBe("M200,40V55H110V70");
  });

  test("colors cards by group and lists the groups", () => {
    const org = buildOrg(people, options);
    const by = Object.fromEntries(org.nodes.map((node) => [node.id, node]));
    expect(by.vp.color).toBeUndefined();
    expect(by.plat.color).toBe(by.obs.color);
    expect(by.plat.color).not.toBe(by.prod.color);
    expect(org.groups.map((entry) => entry.key)).toEqual([
      "Platform",
      "Product",
    ]);
  });

  test("folds a branch away and counts what it hides", () => {
    const org = buildOrg(people, { ...options, collapsed: ["plat"] });
    expect(org.nodes.map((node) => node.id)).toEqual([
      "vp",
      "plat",
      "prod",
      "checkout",
    ]);
    const plat = org.nodes.find((node) => node.id === "plat");
    expect(plat?.collapsed).toBe(true);
    expect(plat?.hidden).toBe(2);
    expect(plat?.childCount).toBe(2);
    expect(org.width).toBe(220);
  });

  test("handles a single node", () => {
    const org = buildOrg([people[0]], options);
    expect(org.nodes[0]).toMatchObject({ x: 0, y: 0, branch: false });
    expect(org.width).toBe(100);
    expect(org.height).toBe(40);
  });
});
