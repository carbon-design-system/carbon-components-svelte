import {
  createTreeVirtualIndex,
  flattenVisibleRows,
  isExpandableNode,
} from "../../src/utils/tree-virtual-index.js";

describe("treeVirtualIndex", () => {
  const nodes = [
    { id: 0, text: "leaf-root" },
    {
      id: 1,
      text: "branch",
      nodes: [
        {
          id: 2,
          text: "nested",
          nodes: [
            { id: 3, text: "a" },
            { id: 4, text: "b" },
          ],
        },
        { id: 5, text: "sibling" },
      ],
    },
    {
      id: 6,
      text: "lazy",
      hasChildren: true,
      nodes: [],
    },
  ];

  it("isExpandableNode matches loaded children and lazy hasChildren", () => {
    expect(isExpandableNode(nodes[0])).toBe(false);
    expect(isExpandableNode(nodes[1])).toBe(true);
    expect(isExpandableNode(nodes[2])).toBe(true);
    expect(isExpandableNode({ id: 9, nodes: [] })).toBe(false);
  });

  it("flattenVisibleRows with empty expand is only roots", () => {
    const rows = flattenVisibleRows(nodes, new Set());
    expect(rows.map((r) => r.node.id)).toEqual([0, 1, 6]);
    expect(rows.map((r) => r.depth)).toEqual([0, 0, 0]);
    expect(rows[1].hasChildren).toBe(true);
    expect(rows[2].hasChildren).toBe(true);
  });

  it("flattenVisibleRows expands only loaded children when id is expanded", () => {
    const rows = flattenVisibleRows(nodes, new Set([1, 2]));
    expect(rows.map((r) => r.node.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(rows.find((r) => r.node.id === 3)).toMatchObject({
      depth: 2,
      parentId: 2,
      posInSet: 1,
      setSize: 2,
      hasChildren: false,
    });
  });

  it("lazy hasChildren parents stay leaves in flatten until nodes load", () => {
    const rows = flattenVisibleRows(nodes, new Set([6]));
    expect(rows.map((r) => r.node.id)).toEqual([0, 1, 6]);
  });

  it("createTreeVirtualIndex totalCount matches flatten length", () => {
    const expanded = new Set([1, 2]);
    const flat = flattenVisibleRows(nodes, expanded);
    const index = createTreeVirtualIndex(nodes, expanded);
    expect(index.totalCount).toBe(flat.length);
  });

  it("getRowAt matches flattenVisibleRows for every index", () => {
    const expanded = new Set([1, 2]);
    const flat = flattenVisibleRows(nodes, expanded);
    const index = createTreeVirtualIndex(nodes, expanded);
    for (let i = 0; i < flat.length; i++) {
      expect(index.getRowAt(i)).toEqual(flat[i]);
    }
    expect(index.getRowAt(-1)).toBeNull();
    expect(index.getRowAt(flat.length)).toBeNull();
  });

  it("collectRows returns only the window", () => {
    const expanded = new Set([1, 2]);
    const flat = flattenVisibleRows(nodes, expanded);
    const index = createTreeVirtualIndex(nodes, expanded);
    expect(index.collectRows(2, 5)).toEqual(flat.slice(2, 5));
  });

  it("collectRows matches flatten for every window on a wide flat tree", () => {
    const wide = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      text: `item-${i}`,
    }));
    const flat = flattenVisibleRows(wide, new Set());
    const index = createTreeVirtualIndex(wide, new Set());
    expect(index.totalCount).toBe(2000);
    expect(index.collectRows(1980, 2000).map((r) => r.node.id)).toEqual(
      flat.slice(1980, 2000).map((r) => r.node.id),
    );
    expect(index.collectRows(0, 10).map((r) => r.node.id)).toEqual(
      flat.slice(0, 10).map((r) => r.node.id),
    );
    expect(index.collectRows(500, 520)).toEqual(flat.slice(500, 520));
  });

  it("findIndexById returns visible index or -1", () => {
    const collapsed = createTreeVirtualIndex(nodes, new Set());
    expect(collapsed.findIndexById(1)).toBe(1);
    expect(collapsed.findIndexById(3)).toBe(-1);

    const expanded = createTreeVirtualIndex(nodes, new Set([1, 2]));
    expect(expanded.findIndexById(3)).toBe(3);
    expect(expanded.findIndexById(5)).toBe(5);
    expect(expanded.findIndexById(99)).toBe(-1);
  });

  it("empty expandAll-shaped set still lists roots only until parents expand", () => {
    const index = createTreeVirtualIndex(nodes, new Set());
    expect(index.totalCount).toBe(3);
    expect(index.getRowAt(0)?.node.id).toBe(0);
  });

  describe("placeholders", () => {
    const lazy = [
      { id: "a", text: "a", hasChildren: true },
      {
        id: "b",
        text: "b",
        nodes: [
          { id: "b1", text: "b1", hasChildren: true },
          { id: "b2", text: "b2" },
        ],
      },
      { id: "c", text: "c", hasChildren: true, nodes: [] },
    ];
    const expanded = new Set(["a", "b", "b1", "c"]);
    const options = { placeholders: true };

    it("adds one row under each expanded node awaiting children", () => {
      const rows = flattenVisibleRows(lazy, expanded, options);
      expect(
        rows.map((row) => `${row.placeholder ? "…" : ""}${row.node.id}`),
      ).toEqual(["a", "…a", "b", "b1", "…b1", "b2", "c", "…c"]);
      expect(rows[1]).toMatchObject({
        depth: 1,
        parentId: "a",
        hasChildren: false,
        placeholder: true,
      });
    });

    it("omits placeholders unless requested or expanded", () => {
      expect(flattenVisibleRows(lazy, expanded)).toHaveLength(5);
      expect(
        flattenVisibleRows(lazy, new Set(["b"]), options).some(
          (row) => row.placeholder,
        ),
      ).toBe(false);
    });

    it("index agrees with flattenVisibleRows for every row and window", () => {
      const flat = flattenVisibleRows(lazy, expanded, options);
      const index = createTreeVirtualIndex(lazy, expanded, options);
      expect(index.totalCount).toBe(flat.length);
      for (let i = 0; i < flat.length; i++) {
        expect(index.getRowAt(i)).toEqual(flat[i]);
        for (let end = i; end <= flat.length; end++) {
          expect(index.collectRows(i, end)).toEqual(flat.slice(i, end));
        }
      }
    });

    it("findIndexById counts placeholder rows", () => {
      const index = createTreeVirtualIndex(lazy, expanded, options);
      expect(index.findIndexById("b")).toBe(2);
      expect(index.findIndexById("b2")).toBe(5);
      expect(index.findIndexById("c")).toBe(6);
    });
  });
});
