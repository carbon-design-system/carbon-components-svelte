// @vitest-environment node
import { toHierarchy } from "carbon-components-svelte/utils/to-hierarchy";

type Item = {
  id: string | number;
  name: string;
  pid?: string | number | null;
  randomKey?: string;
};

/** Collect every node in the tree whose `nodes` key is present but empty. */
const emptyNodesKeys = (tree: { nodes?: unknown[] }[]): unknown[] =>
  tree.flatMap((node) => [
    ...("nodes" in node && !node.nodes?.length ? [node] : []),
    ...emptyNodesKeys((node.nodes ?? []) as { nodes?: unknown[] }[]),
  ]);

describe("toHierarchy", () => {
  it.each<[string, Item[], unknown[]]>([
    [
      "nests a grandchild under a child under a root, preserving extra keys",
      [
        { id: 1, name: "Parent" },
        { id: 2, name: "Child", pid: 1, randomKey: "randomValue" },
        { id: 3, name: "Grandchild", pid: 2 },
      ],
      [
        {
          id: 1,
          name: "Parent",
          nodes: [
            {
              id: 2,
              name: "Child",
              pid: 1,
              nodes: [{ id: 3, name: "Grandchild", pid: 2 }],
              randomKey: "randomValue",
            },
          ],
        },
      ],
    ],
    [
      "gives each of multiple roots its own children",
      [
        { id: 1, name: "Root 1" },
        { id: 2, name: "Root 2" },
        { id: 3, name: "Child 1", pid: 1 },
        { id: 4, name: "Child 2", pid: 2 },
      ],
      [
        { id: 1, name: "Root 1", nodes: [{ id: 3, name: "Child 1", pid: 1 }] },
        { id: 2, name: "Root 2", nodes: [{ id: 4, name: "Child 2", pid: 2 }] },
      ],
    ],
    [
      "nests children and grandchildren listed before their parents",
      [
        { id: 3, name: "Grandchild", pid: 2 },
        { id: 2, name: "Child", pid: 1 },
        { id: 1, name: "Parent" },
      ],
      [
        {
          id: 1,
          name: "Parent",
          nodes: [
            {
              id: 2,
              name: "Child",
              pid: 1,
              nodes: [{ id: 3, name: "Grandchild", pid: 2 }],
            },
          ],
        },
      ],
    ],
    ["returns an empty array for empty input", [], []],
    [
      "treats a non-existent parent id as a root",
      [
        { id: 1, name: "Root" },
        { id: 2, name: "Child", pid: 999 },
      ],
      [
        { id: 1, name: "Root" },
        { id: 2, name: "Child", pid: 999 },
      ],
    ],
    [
      "matches mixed string and number ids, preserving sibling order",
      [
        { id: "root", name: "Root" },
        { id: 1, name: "Child 1", pid: "root" },
        { id: "2", name: "Child 2", pid: "root" },
      ],
      [
        {
          id: "root",
          name: "Root",
          nodes: [
            { id: 1, name: "Child 1", pid: "root" },
            { id: "2", name: "Child 2", pid: "root" },
          ],
        },
      ],
    ],
    [
      "treats null and undefined parent ids as roots",
      [
        { id: 1, name: "Root 1" },
        { id: 2, name: "Root 2", pid: null },
        { id: 3, name: "Root 3", pid: undefined },
        { id: 4, name: "Child", pid: 1 },
      ],
      [
        { id: 1, name: "Root 1", nodes: [{ id: 4, name: "Child", pid: 1 }] },
        { id: 2, name: "Root 2", pid: null },
        { id: 3, name: "Root 3", pid: undefined },
      ],
    ],
  ])("%s", (_name, input, expected) => {
    const result = toHierarchy<Item, "pid">(input, (item) => item.pid);

    expect(result).toEqual(expected);
    // Leaves must not carry an empty `nodes` array.
    expect(emptyNodesKeys(result)).toEqual([]);
  });

  it("nests children under a parent with id 0", () => {
    const input = [{ id: 0 }, { id: 1, pid: 0 }];

    expect(toHierarchy(input, (item) => item.pid)).toEqual([
      { id: 0, nodes: [{ id: 1, pid: 0 }] },
    ]);
  });

  it("leaves the input items untouched, so a rerun starts clean", () => {
    const input = [{ id: 1 }, { id: 2, pid: 1 }].map((item) =>
      Object.freeze(item),
    );

    toHierarchy(input, (item) => item.pid);

    expect(toHierarchy([input[0]], (item) => item.pid)).toEqual([{ id: 1 }]);
  });
});
