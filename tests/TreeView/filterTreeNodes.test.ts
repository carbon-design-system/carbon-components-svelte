import {
  filterTreeById,
  filterTreeByText,
  filterTreeNodes,
} from "carbon-components-svelte";

describe("filterTreeNodes", () => {
  const sampleTree = [
    {
      id: 1,
      text: "Documents",
      nodes: [
        {
          id: 2,
          text: "Work",
          nodes: [
            { id: 3, text: "Report.docx" },
            { id: 4, text: "Presentation.pptx" },
          ],
        },
        {
          id: 5,
          text: "Personal",
          nodes: [{ id: 6, text: "Resume.pdf" }],
        },
      ],
    },
    {
      id: 7,
      text: "Pictures",
      nodes: [{ id: 8, text: "Vacation.jpg" }],
    },
  ];

  describe("filterTreeNodes with predicate", () => {
    test("should filter by custom predicate and include ancestors", () => {
      const result = filterTreeNodes(sampleTree, (node) => node.id === 3);

      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 2,
              text: "Work",
              nodes: [{ id: 3, text: "Report.docx" }],
            },
          ],
        },
      ]);
    });

    test("should filter multiple nodes at different levels", () => {
      const result = filterTreeNodes(
        sampleTree,
        (node) => node.id === 3 || node.id === 8,
      );

      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 2,
              text: "Work",
              nodes: [{ id: 3, text: "Report.docx" }],
            },
          ],
        },
        {
          id: 7,
          text: "Pictures",
          nodes: [{ id: 8, text: "Vacation.jpg" }],
        },
      ]);
    });

    test("should return empty array when no matches", () => {
      const result = filterTreeNodes(sampleTree, (node) => node.id === 999);
      expect(result).toEqual([]);
    });

    test("should include all children when includeChildren is true", () => {
      const result = filterTreeNodes(sampleTree, (node) => node.id === 2, {
        includeChildren: true,
      });

      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 2,
              text: "Work",
              nodes: [
                { id: 3, text: "Report.docx" },
                { id: 4, text: "Presentation.pptx" },
              ],
            },
          ],
        },
      ]);
    });

    test("should exclude ancestors when includeAncestors is false", () => {
      const result = filterTreeNodes(sampleTree, (node) => node.id === 3, {
        includeAncestors: false,
      });

      expect(result).toEqual([]);
    });

    test("should match root nodes", () => {
      const result = filterTreeNodes(sampleTree, (node) => node.id === 1);

      // When a root node matches, without includeChildren,
      // it only includes the node itself (no children unless they also match)
      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
        },
      ]);
    });

    test("should preserve additional properties", () => {
      const tree = [
        {
          id: 1,
          text: "Root",
          custom: "value",
          nodes: [{ id: 2, text: "Child", meta: { key: "data" } }],
        },
      ];

      const result = filterTreeNodes(tree, (node) => node.id === 2);

      expect(result).toEqual([
        {
          id: 1,
          text: "Root",
          custom: "value",
          nodes: [{ id: 2, text: "Child", meta: { key: "data" } }],
        },
      ]);
    });
  });

  describe("filterTreeById", () => {
    test("should filter by single ID", () => {
      const result = filterTreeById(sampleTree, 6);

      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 5,
              text: "Personal",
              nodes: [{ id: 6, text: "Resume.pdf" }],
            },
          ],
        },
      ]);
    });

    test("should filter by array of IDs", () => {
      const result = filterTreeById(sampleTree, [3, 4]);

      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 2,
              text: "Work",
              nodes: [
                { id: 3, text: "Report.docx" },
                { id: 4, text: "Presentation.pptx" },
              ],
            },
          ],
        },
      ]);
    });

    test("should work with includeChildren option", () => {
      const result = filterTreeById(sampleTree, 1, { includeChildren: true });

      // Only the first tree (id=1) matches, so we get just that tree with all children
      expect(result).toEqual([sampleTree[0]]);
    });

    test("should handle string IDs", () => {
      const tree = [
        {
          id: "root",
          text: "Root",
          nodes: [{ id: "child", text: "Child" }],
        },
      ];

      const result = filterTreeById(tree, "child");

      expect(result).toEqual([
        {
          id: "root",
          text: "Root",
          nodes: [{ id: "child", text: "Child" }],
        },
      ]);
    });
  });

  describe("filterTreeByText", () => {
    test("should filter by text (case-insensitive)", () => {
      const result = filterTreeByText(sampleTree, "work");

      // Without includeChildren, only the matching node is included (and ancestors)
      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 2,
              text: "Work",
            },
          ],
        },
      ]);
    });

    test("should perform substring matching", () => {
      const result = filterTreeByText(sampleTree, "res");

      // "res" matches: "Presentation.pptx", "Personal", "Resume.pdf", and "Pictures"
      expect(result).toEqual([
        {
          id: 1,
          text: "Documents",
          nodes: [
            {
              id: 2,
              text: "Work",
              nodes: [{ id: 4, text: "Presentation.pptx" }],
            },
            {
              id: 5,
              text: "Personal",
              nodes: [{ id: 6, text: "Resume.pdf" }],
            },
          ],
        },
        {
          id: 7,
          text: "Pictures",
        },
      ]);
    });

    test("should handle empty search string", () => {
      const result = filterTreeByText(sampleTree, "");

      // Empty string matches all nodes with text
      expect(result).toEqual(sampleTree);
    });

    test("should return empty array when no text matches", () => {
      const result = filterTreeByText(sampleTree, "nonexistent");

      expect(result).toEqual([]);
    });

    test("should work with includeChildren option", () => {
      const result = filterTreeByText(sampleTree, "Documents", {
        includeChildren: true,
      });

      // Only "Documents" node matches, so we get just the first tree with all children
      expect(result).toEqual([sampleTree[0]]);
    });

    test("should handle nodes without text property", () => {
      const tree = [
        {
          id: 1,
          nodes: [{ id: 2, text: "Has Text" }],
        },
      ];

      const result = filterTreeByText(tree, "Has");

      expect(result).toEqual([
        {
          id: 1,
          nodes: [{ id: 2, text: "Has Text" }],
        },
      ]);
    });
  });

  describe("edge cases", () => {
    test("should handle empty tree", () => {
      const result = filterTreeNodes([], (_node) => true);
      expect(result).toEqual([]);
    });

    test("should handle deeply nested structures", () => {
      const deepTree = [
        {
          id: 1,
          text: "L1",
          nodes: [
            {
              id: 2,
              text: "L2",
              nodes: [
                {
                  id: 3,
                  text: "L3",
                  nodes: [
                    {
                      id: 4,
                      text: "L4",
                      nodes: [{ id: 5, text: "L5" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const result = filterTreeById(deepTree, 5);

      expect(result).toEqual(deepTree);
    });

    test("should not mutate original tree", () => {
      const original = [
        {
          id: 1,
          text: "Root",
          nodes: [{ id: 2, text: "Child" }],
        },
      ];
      const originalCopy = JSON.parse(JSON.stringify(original));

      filterTreeById(original, 2);

      expect(original).toEqual(originalCopy);
    });
  });
});
