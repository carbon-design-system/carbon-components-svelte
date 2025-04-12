import { toHierarchy } from "carbon-components-svelte";

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

  test("should handle empty input array", () => {
    const result = toHierarchy<
      { id: string | number; parentId?: string | number },
      "parentId"
    >([], (item) => item.parentId || null);
    expect(result).toEqual([]);
  });

  test("should handle non-existent parent IDs", () => {
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

  test("should handle deeply nested structures", () => {
    const input = [
      { id: 1, name: "Level 1" },
      { id: 2, name: "Level 2", pid: 1 },
      { id: 3, name: "Level 3", pid: 2 },
      { id: 4, name: "Level 4", pid: 3 },
      { id: 5, name: "Level 5", pid: 4 },
    ];
    const result = toHierarchy(input, (item) => item.pid);
    expect(result).toEqual([
      {
        id: 1,
        name: "Level 1",
        nodes: [
          {
            id: 2,
            name: "Level 2",
            pid: 1,
            nodes: [
              {
                id: 3,
                name: "Level 3",
                pid: 2,
                nodes: [
                  {
                    id: 4,
                    name: "Level 4",
                    pid: 3,
                    nodes: [
                      {
                        id: 5,
                        name: "Level 5",
                        pid: 4,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("should handle mixed ID types", () => {
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

  test("should preserve additional properties", () => {
    const input = [
      { id: 1, name: "Root", extra: "data", meta: { key: "value" } },
      { id: 2, name: "Child", pid: 1, flag: true, count: 42 },
    ];
    const result = toHierarchy(input, (item) => item.pid);
    expect(result).toEqual([
      {
        id: 1,
        name: "Root",
        extra: "data",
        meta: { key: "value" },
        nodes: [
          {
            id: 2,
            name: "Child",
            pid: 1,
            flag: true,
            count: 42,
          },
        ],
      },
    ]);
  });

  test("should handle null/undefined parent IDs", () => {
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
