import { toHierarchy } from "../../src/utils/toHierarchy";

describe("toHierarchy", () => {
  test("should create a flat hierarchy when no items have parents", () => {
    const input = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2", parentId: "invalid" },
    ];
    const result = toHierarchy(input, (item) => item.parentId);

    expect(result).toEqual([
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2", parentId: "invalid" },
    ]);
  });

  test("should create a nested hierarchy with parent-child relationships", () => {
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
  });

  test("should handle multiple root nodes with children", () => {
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

  test("should remove empty nodes arrays", () => {
    const input = [
      { id: 1, name: "Root" },
      { id: 2, name: "Leaf", pid: 1 },
    ];
    const result = toHierarchy(input, (item) => item.pid);
    expect(result).toEqual([
      {
        id: 1,
        name: "Root",
        nodes: [
          {
            id: 2,
            name: "Leaf",
            pid: 1,
          },
        ],
      },
    ]);

    expect(result[0].nodes?.[0]).not.toHaveProperty("nodes");
  });
});
