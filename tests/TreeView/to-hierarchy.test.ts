// @vitest-environment node
import { toHierarchy } from "carbon-components-svelte/utils/to-hierarchy";

describe("toHierarchy", () => {
  it("should create a nested hierarchy with parent-child relationships", () => {
    const input = [
      { id: 1, name: "Parent" },
      { id: 2, name: "Child", pid: 1, randomKey: "randomValue" },
      { id: 3, name: "Grandchild", pid: 2 },
    ];
    const result = toHierarchy(input, (item) => item.pid);

    expect(result).toEqual([
      {
        id: 1,
        name: "Parent",
        nodes: [
          {
            id: 2,
            name: "Child",
            pid: 1,
            nodes: [
              {
                id: 3,
                name: "Grandchild",
                pid: 2,
              },
            ],
            randomKey: "randomValue",
          },
        ],
      },
    ]);

    // Leaves must not carry an empty `nodes` array.
    expect(result[0].nodes?.[0].nodes?.[0]).not.toHaveProperty("nodes");
  });

  it("should handle multiple root nodes with children", () => {
    const input = [
      { id: 1, name: "Root 1" },
      { id: 2, name: "Root 2" },
      { id: 3, name: "Child 1", pid: 1 },
      { id: 4, name: "Child 2", pid: 2 },
    ];
    const result = toHierarchy(input, (item) => item.pid);

    expect(result).toEqual([
      {
        id: 1,
        name: "Root 1",
        nodes: [
          {
            id: 3,
            name: "Child 1",
            pid: 1,
          },
        ],
      },
      {
        id: 2,
        name: "Root 2",
        nodes: [
          {
            id: 4,
            name: "Child 2",
            pid: 2,
          },
        ],
      },
    ]);
  });

  it("should handle empty input array", () => {
    const result = toHierarchy<
      { id: string | number; parentId?: string | number },
      "parentId"
    >([], (item) => item.parentId || null);
    expect(result).toEqual([]);
  });

  it("should handle non-existent parent IDs", () => {
    const input = [
      { id: 1, name: "Root" },
      { id: 2, name: "Child", pid: 999 },
    ];
    const result = toHierarchy(input, (item) => item.pid);
    expect(result).toEqual([
      { id: 1, name: "Root" },
      { id: 2, name: "Child", pid: 999 },
    ]);
  });

  it("should handle mixed ID types", () => {
    const input = [
      { id: "root", name: "Root" },
      { id: 1, name: "Child 1", pid: "root" },
      { id: "2", name: "Child 2", pid: "root" },
    ];
    const result = toHierarchy(input, (item) => item.pid);
    expect(result).toEqual([
      {
        id: "root",
        name: "Root",
        nodes: [
          {
            id: 1,
            name: "Child 1",
            pid: "root",
          },
          {
            id: "2",
            name: "Child 2",
            pid: "root",
          },
        ],
      },
    ]);
  });

  it("should handle null/undefined parent IDs", () => {
    const input = [
      { id: 1, name: "Root 1" },
      { id: 2, name: "Root 2", pid: null },
      { id: 3, name: "Root 3", pid: undefined },
      { id: 4, name: "Child", pid: 1 },
    ];
    const result = toHierarchy(input, (item) => item.pid);
    expect(result).toEqual([
      {
        id: 1,
        name: "Root 1",
        nodes: [
          {
            id: 4,
            name: "Child",
            pid: 1,
          },
        ],
      },
      {
        id: 2,
        name: "Root 2",
        pid: null,
      },
      {
        id: 3,
        name: "Root 3",
        pid: undefined,
      },
    ]);
  });
});
