import { matchTreeNodes } from "../../src/utils/matchTreeNodes.js";

const nodes = [
  {
    id: "1",
    text: "Analytics",
    nodes: [
      {
        id: "1-1",
        text: "Engines",
        nodes: [{ id: "1-1-1", text: "Apache Spark" }],
      },
      {
        id: "1-2",
        text: "Warehouse",
        nodes: [{ id: "1-2-1", text: "Db2 Warehouse" }],
      },
    ],
  },
  {
    id: "2",
    text: "Storage",
    nodes: [
      { id: "2-1", text: "Object Storage" },
      { id: "2-2", text: "Block Volume" },
    ],
  },
];

describe("matchTreeNodes", () => {
  test("matches a substring case-insensitively", () => {
    const result = matchTreeNodes(nodes, "APACHE");

    expect([...result.matchedIds]).toEqual(["1-1-1"]);
    expect(result.matches.get("1-1-1")).toEqual([0, 6]);
  });

  test("reports match offsets into the original text", () => {
    const result = matchTreeNodes(nodes, "spark");

    expect(result.matches.get("1-1-1")).toEqual([7, 12]);
  });

  test("returns empty sets for an empty filter", () => {
    const result = matchTreeNodes(nodes, "");

    expect(result.matchedIds.size).toBe(0);
    expect(result.ancestorIds.size).toBe(0);
    expect(result.visibleIds.size).toBe(0);
    expect(result.matches.size).toBe(0);
  });

  test("returns empty sets for a whitespace-only filter", () => {
    const result = matchTreeNodes(nodes, "   ");

    expect(result.visibleIds.size).toBe(0);
    expect(result.matches.size).toBe(0);
  });

  test("returns empty sets when nothing matches", () => {
    const result = matchTreeNodes(nodes, "kubernetes");

    expect(result.matchedIds.size).toBe(0);
    expect(result.ancestorIds.size).toBe(0);
    expect(result.visibleIds.size).toBe(0);
  });

  test("keeps every ancestor of a match visible", () => {
    const result = matchTreeNodes(nodes, "spark");

    expect([...result.ancestorIds].sort()).toEqual(["1", "1-1"]);
    expect([...result.visibleIds].sort()).toEqual(["1", "1-1", "1-1-1"]);
  });

  test("keeps the descendants of a matching branch visible", () => {
    const result = matchTreeNodes(nodes, "storage");

    // "Block Volume" does not match, but its parent branch does.
    expect([...result.visibleIds].sort()).toEqual(["2", "2-1", "2-2"]);
    expect(result.ancestorIds.size).toBe(0);
  });

  test("matches disabled nodes", () => {
    const result = matchTreeNodes(
      [{ id: "a", text: "Archive", disabled: true }],
      "archive",
    );

    expect([...result.matchedIds]).toEqual(["a"]);
    expect([...result.visibleIds]).toEqual(["a"]);
  });

  test("skips nodes whose text is not a string", () => {
    const result = matchTreeNodes(
      [
        { id: "a", text: undefined },
        { id: "b", text: 42 },
        { id: "c", text: "42 apples" },
      ],
      "42",
    );

    expect([...result.matchedIds]).toEqual(["c"]);
  });

  test("walks the tree in place without mutating it", () => {
    const snapshot = structuredClone(nodes);
    matchTreeNodes(nodes, "storage");

    expect(nodes).toEqual(snapshot);
  });
});
