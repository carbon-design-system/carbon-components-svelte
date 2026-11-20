import {
  buildColumns,
  checkedPaths,
  childKey,
  pathKey,
  resolvePath,
  searchPaths,
  toSelectionTree,
} from "../../src/Cascader/cascader-model.js";
import { places } from "./nodes";

const none = new Map();

describe("cascader-model", () => {
  it("keys a path by its ids, so a reused id stays apart", () => {
    expect(pathKey(["eu", "de", "paris"])).not.toBe(
      pathKey(["eu", "fr", "paris"]),
    );
    expect(childKey(pathKey(["eu", "fr"]), "paris")).toBe(
      pathKey(["eu", "fr", "paris"]),
    );
  });

  it("stops at the first lazy parent that has not loaded", () => {
    const roots = [{ id: "a", text: "A", hasChildren: true }];
    expect(resolvePath(roots, none, ["a", "b"])).toEqual({
      nodes: [roots[0]],
      complete: false,
    });
    const loaded = new Map([["a", [{ id: "b", text: "B" }]]]);
    expect(resolvePath(roots, loaded, ["a", "b"]).complete).toBe(true);
  });

  it("builds a column per open node, and a pending one for a lazy node", () => {
    const roots = [
      { id: "a", text: "A", hasChildren: true },
      { id: "b", text: "B", nodes: [{ id: "c", text: "C" }] },
    ];
    const { columns } = buildColumns(roots, none, ["a"], new Map());
    expect(columns.map((column) => column.entries.length)).toEqual([2, 0]);
    expect(columns[1].status).toBe("loading");

    const open = buildColumns(roots, none, ["b"], new Map());
    expect(open.columns[1].entries.map((entry) => entry.ids)).toEqual([
      ["b", "c"],
    ]);
    expect(open.columns[0].entries[1].branch).toBe(true);
  });

  it("matches every word against the joined path", () => {
    const { results } = searchPaths(places, none, "fra par");
    expect(results.map((result) => result.text)).toEqual([
      "Europe / France / Paris",
    ]);
    expect(results[0].ranges.length).toBeGreaterThan(0);
  });

  it("stops at the limit and says so", () => {
    const { results, truncated } = searchPaths(places, none, "e", { limit: 2 });
    expect(results).toHaveLength(2);
    expect(truncated).toBe(true);
  });

  it("searches branches too when asked", () => {
    const { results } = searchPaths(places, none, "japan", { leafOnly: false });
    expect(results.map((result) => result.ids)).toEqual([
      ["as", "jp"],
      ["as", "jp", "tokyo"],
      ["as", "jp", "osaka"],
    ]);
  });

  it("mirrors the tree under path keys for the selection model", () => {
    const tree = toSelectionTree(places, none);
    expect(tree[0].id).toBe("eu");
    expect(tree[0].nodes?.[1].nodes?.[1].id).toBe(
      pathKey(["eu", "de", "paris"]),
    );
    expect(tree[1].nodes?.[0].nodes?.[1]).toEqual({
      id: pathKey(["as", "jp", "osaka"]),
      disabled: true,
    });
  });

  it("reports a checked branch as itself, or as its leaves", () => {
    const checked = new Set([
      pathKey(["eu", "fr"]),
      pathKey(["eu", "fr", "paris"]),
      pathKey(["eu", "fr", "lyon"]),
    ]);
    expect(checkedPaths(places, none, checked)).toEqual([["eu", "fr"]]);
    expect(checkedPaths(places, none, checked, "leaf")).toEqual([
      ["eu", "fr", "paris"],
      ["eu", "fr", "lyon"],
    ]);
  });

  it("reports a checked branch with nothing loaded below it as itself", () => {
    const roots = [{ id: "a", text: "A", hasChildren: true }];
    expect(checkedPaths(roots, none, new Set(["a"]), "leaf")).toEqual([["a"]]);
  });
});
