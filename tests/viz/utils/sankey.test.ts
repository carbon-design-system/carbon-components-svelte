import { sankey } from "../../../src/viz/utils/sankey.js";

const links = [
  { source: "Organic", target: "Signup", value: 60 },
  { source: "Paid", target: "Signup", value: 40 },
  { source: "Signup", target: "Activated", value: 70 },
  { source: "Signup", target: "Churned", value: 30 },
  { source: "Activated", target: "Paying", value: 45 },
];
const size = { width: 600, height: 300 };

describe("sankey", () => {
  test("puts nodes in columns by their longest path, sinks at the far end", () => {
    const { nodes, columns } = sankey(links, size);
    const column = Object.fromEntries(nodes.map((n) => [n.id, n.column]));

    expect(columns).toBe(4);
    expect(column).toEqual({
      Organic: 0,
      Paid: 0,
      Signup: 1,
      Activated: 2,
      // Nothing flows out of Churned, so it sits with the other endings.
      Churned: 3,
      Paying: 3,
    });
  });

  test("sizes nodes by the larger of their flows, on one scale", () => {
    const { nodes } = sankey(links, size);
    const node = Object.fromEntries(nodes.map((n) => [n.id, n]));

    expect(node.Signup.value).toBe(100);
    expect(node.Activated.value).toBe(70);
    expect(node.Signup.height / node.Activated.height).toBeCloseTo(100 / 70);
    expect(node.Organic.x).toBe(0);
    expect(node.Paying.x).toBe(600 - 8);
  });

  test("keeps every node inside the box, with its padding", () => {
    const { nodes } = sankey(links, size);

    for (const n of nodes) {
      expect(n.y).toBeGreaterThanOrEqual(-1e-6);
      expect(n.y + n.height).toBeLessThanOrEqual(300 + 1e-6);
    }
    const first = nodes.filter((n) => n.column === 0).sort((a, b) => a.y - b.y);
    expect(first[1].y - (first[0].y + first[0].height)).toBeGreaterThanOrEqual(
      12 - 1e-6,
    );
  });

  test("stacks ribbons along each node without overlap", () => {
    const { links: out, nodes } = sankey(links, size);
    const signup = nodes.find((n) => n.id === "Signup");
    const leaving = signup?.sourceLinks ?? [];

    expect(leaving[0].sourceY).toBeCloseTo(signup?.y ?? Number.NaN);
    expect(leaving[1].sourceY).toBeCloseTo(
      leaving[0].sourceY + leaving[0].width,
    );
    expect(out.every((link) => link.path.startsWith("M"))).toBe(true);
    expect(out.every((link) => link.path.endsWith("Z"))).toBe(true);
    expect(out.every((link) => !link.path.includes("NaN"))).toBe(true);
  });

  test("drops a link that closes a cycle, a self link, and bad values", () => {
    const { links: out } = sankey(
      [
        ...links,
        { source: "Paying", target: "Organic", value: 5 },
        { source: "Signup", target: "Signup", value: 5 },
        { source: "Paid", target: "Churned", value: 0 },
        { source: "Paid", target: "Churned", value: Number.NaN },
      ],
      size,
    );

    expect(out).toHaveLength(5);
  });

  test("does not mutate its input and handles nothing", () => {
    const frozen = Object.freeze(
      links.map((link) => Object.freeze({ ...link })),
    );

    expect(() => sankey(frozen, size)).not.toThrow();
    expect(sankey([], size)).toEqual({ nodes: [], links: [], columns: 0 });
  });
});
