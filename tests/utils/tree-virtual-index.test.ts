import {
  createTreeVirtualIndex,
  isExpandableNode,
} from "../../src/utils/tree-virtual-index.js";

type Node = {
  id: number;
  text: string;
  nodes?: Node[];
  hasChildren?: boolean;
};

/**
 * Reference walk the index is compared against: every visible row in
 * order, descending only into expanded parents with loaded children.
 */
function flattenVisibleRows(nodes: Node[], expandedIds: Set<number>) {
  const rows: Array<{
    node: Node;
    depth: number;
    parentId: number | null;
    posInSet: number;
    setSize: number;
    hasChildren: boolean;
  }> = [];
  const walk = (list: Node[], depth: number, parentId: number | null) => {
    list.forEach((node, i) => {
      const loaded = Array.isArray(node.nodes) && node.nodes.length > 0;
      rows.push({
        node,
        depth,
        parentId,
        posInSet: i + 1,
        setSize: list.length,
        hasChildren: loaded || node.hasChildren === true,
      });
      if (loaded && expandedIds.has(node.id)) {
        walk(node.nodes as Node[], depth + 1, node.id);
      }
    });
  };
  walk(nodes, 0, null);
  return rows;
}

describe("treeVirtualIndex", () => {
  const nodes: Node[] = [
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

  it("lists only the roots when nothing is expanded", () => {
    const index = createTreeVirtualIndex(nodes, new Set());
    const rows = index.collectRows(0, index.totalCount);
    expect(rows.map((r) => r.node.id)).toEqual([0, 1, 6]);
    expect(rows.map((r) => r.depth)).toEqual([0, 0, 0]);
    expect(rows[1].hasChildren).toBe(true);
    expect(rows[2].hasChildren).toBe(true);
  });

  it("expands only loaded children when an id is expanded", () => {
    const index = createTreeVirtualIndex(nodes, new Set([1, 2]));
    const rows = index.collectRows(0, index.totalCount);
    expect(rows.map((r) => r.node.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(rows.find((r) => r.node.id === 3)).toMatchObject({
      depth: 2,
      parentId: 2,
      posInSet: 1,
      setSize: 2,
      hasChildren: false,
    });
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

  it("collectRows matches flatten for a window on a flat tree", () => {
    const flatNodes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      text: `item-${i}`,
    }));
    const flat = flattenVisibleRows(flatNodes, new Set());
    const index = createTreeVirtualIndex(flatNodes, new Set());
    expect(index.collectRows(10, 20)).toEqual(flat.slice(10, 20));
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
});
