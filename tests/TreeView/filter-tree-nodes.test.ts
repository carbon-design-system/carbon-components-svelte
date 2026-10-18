// @vitest-environment node
import {
  filterTreeById,
  filterTreeByText,
  filterTreeNodes,
} from "carbon-components-svelte/utils/filter-tree-nodes";

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

  const workPath = {
    id: 1,
    text: "Documents",
    nodes: [
      {
        id: 2,
        text: "Work",
        nodes: [{ id: 3, text: "Report.docx" }],
      },
    ],
  };

  it.each<[string, () => unknown, unknown]>([
    [
      "filters by predicate and includes ancestors",
      () => filterTreeNodes(sampleTree, (node) => node.id === 3),
      [workPath],
    ],
    [
      "filters multiple nodes at different levels",
      () =>
        filterTreeNodes(sampleTree, (node) => node.id === 3 || node.id === 8),
      [
        workPath,
        { id: 7, text: "Pictures", nodes: [{ id: 8, text: "Vacation.jpg" }] },
      ],
    ],
    [
      "returns an empty array when nothing matches",
      () => filterTreeNodes(sampleTree, (node) => node.id === 999),
      [],
    ],
    [
      "includes all children when includeChildren is true",
      () =>
        filterTreeNodes(sampleTree, (node) => node.id === 2, {
          includeChildren: true,
        }),
      [
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
      ],
    ],
    [
      "excludes ancestors when includeAncestors is false",
      () =>
        filterTreeNodes(sampleTree, (node) => node.id === 3, {
          includeAncestors: false,
        }),
      [],
    ],
    [
      "keeps a matching child under a matching parent when includeAncestors is false",
      () =>
        filterTreeNodes(sampleTree, (node) => node.id === 1 || node.id === 2, {
          includeAncestors: false,
        }),
      [
        {
          id: 1,
          text: "Documents",
          nodes: [{ id: 2, text: "Work" }],
        },
      ],
    ],
    [
      "includes all children of a match when includeChildren is true and includeAncestors is false",
      () =>
        filterTreeNodes(sampleTree, (node) => node.id === 1, {
          includeChildren: true,
          includeAncestors: false,
        }),
      [sampleTree[0]],
    ],
    [
      "passes the original node, with its children, to the predicate",
      () =>
        filterTreeNodes(
          [
            { id: 1, text: "Folder", nodes: [{ id: 2, text: "File" }] },
            { id: 3, text: "Loose file" },
          ],
          (node) => !node.nodes || node.nodes.length === 0,
          { includeAncestors: false },
        ),
      [{ id: 3, text: "Loose file" }],
    ],
    [
      "matches root nodes",
      () => filterTreeNodes(sampleTree, (node) => node.id === 1),
      [{ id: 1, text: "Documents" }],
    ],
    [
      "preserves additional properties",
      () =>
        filterTreeNodes(
          [
            {
              id: 1,
              text: "Root",
              custom: "value",
              nodes: [{ id: 2, text: "Child", meta: { key: "data" } }],
            },
          ],
          (node) => node.id === 2,
        ),
      [
        {
          id: 1,
          text: "Root",
          custom: "value",
          nodes: [{ id: 2, text: "Child", meta: { key: "data" } }],
        },
      ],
    ],
    ["handles an empty tree", () => filterTreeNodes([], (_node) => true), []],
  ])("filterTreeNodes %s", (_name, run, expected) => {
    expect(run()).toEqual(expected);
  });

  it.each<[string, () => unknown, unknown]>([
    [
      "filterTreeById filters by single ID",
      () => filterTreeById(sampleTree, 6),
      [
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
      ],
    ],
    [
      "filterTreeById filters by array of IDs",
      () => filterTreeById(sampleTree, [3, 4]),
      [
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
      ],
    ],
    [
      "filterTreeById forwards includeChildren",
      () => filterTreeById(sampleTree, 1, { includeChildren: true }),
      [sampleTree[0]],
    ],
    [
      "filterTreeByText filters case-insensitively",
      () => filterTreeByText(sampleTree, "work"),
      [{ id: 1, text: "Documents", nodes: [{ id: 2, text: "Work" }] }],
    ],
    [
      // Matches "Presentation.pptx", "Personal", "Resume.pdf" and "Pictures".
      "filterTreeByText matches substrings",
      () => filterTreeByText(sampleTree, "res"),
      [
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
        { id: 7, text: "Pictures" },
      ],
    ],
    [
      // An empty string matches every node with text.
      "filterTreeByText returns the whole tree for an empty search string",
      () => filterTreeByText(sampleTree, ""),
      sampleTree,
    ],
    [
      "filterTreeByText forwards includeChildren",
      () =>
        filterTreeByText(sampleTree, "Documents", { includeChildren: true }),
      [sampleTree[0]],
    ],
    [
      "filterTreeByText handles nodes without a text property",
      () =>
        filterTreeByText(
          [{ id: 1, nodes: [{ id: 2, text: "Has Text" }] }],
          "Has",
        ),
      [{ id: 1, nodes: [{ id: 2, text: "Has Text" }] }],
    ],
  ])("%s", (_name, run, expected) => {
    expect(run()).toEqual(expected);
  });

  it("filterTreeById matches ids strictly, without coercing between strings and numbers", () => {
    const stringTree = [{ id: "1", text: "String id" }];

    expect(filterTreeById(sampleTree, "1")).toEqual([]);
    expect(filterTreeById(stringTree, 1)).toEqual([]);
    expect(filterTreeById(stringTree, "1")).toEqual(stringTree);
  });

  it("returns copies of the children when includeChildren is true", () => {
    type Node = { text: string; nodes?: Node[] };
    const tree: Node[] = sampleTree;
    const result: Node[] = filterTreeNodes(
      sampleTree,
      (node) => node.id === 2,
      { includeChildren: true },
    );
    const copiedLeaf = result[0].nodes?.[0].nodes?.[0];
    assert(copiedLeaf);
    copiedLeaf.text = "Changed";

    expect(tree[0].nodes?.[0].nodes?.[0].text).toBe("Report.docx");
  });

  it("does not mutate the original tree", () => {
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
