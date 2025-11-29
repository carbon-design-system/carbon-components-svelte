import { render, screen } from "@testing-library/svelte";
import type { ComponentType as SvelteComponentType } from "svelte";
import { user } from "../setup-tests";
import TreeViewHierarchy from "./TreeView.hierarchy.test.svelte";
import TreeView from "./TreeView.test.svelte";

const testCases = [
  { name: "TreeView", component: TreeView },
  { name: "TreeView hierarchy", component: TreeViewHierarchy },
];

describe.each(testCases)("$name", ({ component }) => {
  const getItemByName = (name: RegExp) => {
    return screen.getByRole("treeitem", {
      name,
      selected: false,
    });
  };

  const getSelectedItemByName = (name: RegExp) => {
    return screen.getByRole("treeitem", {
      name,
      selected: true,
    });
  };

  const noExpandedItems = () => {
    expect(screen.queryAllByRole("treeitem", { expanded: true })).toHaveLength(
      0,
    );
  };

  const getAllExpandedItems = () => {
    return screen.getAllByRole("treeitem", { expanded: true });
  };

  it("can select a node", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    expect(firstItem).toBeInTheDocument();

    await user.click(firstItem);
    expect(getSelectedItemByName(/AI \/ Machine learning/)).toBeInTheDocument();
    expect(consoleLog).toBeCalledWith("selectedIds", [0]);
    expect(consoleLog).toBeCalledWith("select", {
      disabled: false,
      expanded: false,
      id: 0,
      leaf: true,
      selected: false,
      text: "AI / Machine learning",
    });
  });

  it("can expand all nodes", async () => {
    render(component);

    noExpandedItems();

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);

    expect(getAllExpandedItems()).toHaveLength(5);
  });

  it("can expand some nodes", async () => {
    render(component);

    noExpandedItems();

    const expandSomeNodesButton = screen.getByText("Expand some nodes");
    await user.click(expandSomeNodesButton);

    expect(getAllExpandedItems()).toHaveLength(2);

    expect(
      screen.getByText("IBM Analytics Engine").parentNode?.parentNode,
    ).toHaveAttribute("aria-expanded", "true");
  });
});

describe("TreeView Generics", () => {
  it("should support custom node types with generics", () => {
    type CustomNode = {
      id: string;
      text: string;
      icon?: SvelteComponentType;
      disabled?: boolean;
      metadata?: { count: number; tags: string[] };
      nodes?: CustomNode[];
    };

    const customNodes: CustomNode[] = [
      {
        id: "1",
        text: "Node 1",
        metadata: { count: 5, tags: ["a", "b"] },
      },
    ];

    expectTypeOf<typeof customNodes>().toEqualTypeOf<CustomNode[]>();

    type SelectEventDetail = CustomNode & {
      expanded: boolean;
      leaf: boolean;
      selected: boolean;
    };

    expectTypeOf<SelectEventDetail>().toEqualTypeOf<
      CustomNode & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      }
    >();

    const testDetail: SelectEventDetail = {
      id: "1",
      text: "test",
      metadata: { count: 5, tags: ["a"] },
      expanded: false,
      leaf: true,
      selected: false,
    };
    if (testDetail.metadata) {
      expectTypeOf(testDetail.metadata.count).toEqualTypeOf<number>();
      expectTypeOf(testDetail.metadata.tags).toEqualTypeOf<string[]>();
    }
  });

  it("should default to TreeNode type when generic is not specified", () => {
    type DefaultTreeNode = {
      id: string | number;
      text: unknown;
      icon?: unknown;
      disabled?: boolean;
      nodes?: DefaultTreeNode[];
    };

    const defaultNodes: DefaultTreeNode[] = [{ id: "1", text: "Node 1" }];

    expectTypeOf<typeof defaultNodes>().toEqualTypeOf<DefaultTreeNode[]>();

    type DefaultEventDetail = DefaultTreeNode & {
      expanded: boolean;
      leaf: boolean;
      selected: boolean;
    };

    expectTypeOf<DefaultEventDetail>().toEqualTypeOf<
      DefaultTreeNode & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      }
    >();
  });

  it("should provide type-safe access to custom node properties in event handlers", () => {
    type CustomNode = {
      id: string;
      text: string;
      metadata?: { count: number; tags: string[] };
      nodes?: CustomNode[];
    };

    const handleSelect = (
      node: CustomNode & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      },
    ) => {
      expectTypeOf(node).toEqualTypeOf<
        CustomNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
      if (node.metadata) {
        expectTypeOf(node.metadata.count).toEqualTypeOf<number>();
        expectTypeOf(node.metadata.tags).toEqualTypeOf<string[]>();
      }
    };

    expectTypeOf(handleSelect)
      .parameter(0)
      .toEqualTypeOf<
        CustomNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();

    // Verify the event detail type matches what the handler expects
    type SelectEventDetail = CustomNode & {
      expanded: boolean;
      leaf: boolean;
      selected: boolean;
    };
    const testEventDetail: SelectEventDetail = {
      id: "1",
      text: "test",
      metadata: { count: 5, tags: ["a"] },
      expanded: false,
      leaf: true,
      selected: false,
    };
    expectTypeOf(testEventDetail).toEqualTypeOf<
      Parameters<typeof handleSelect>[0]
    >();
  });

  it("should provide type-safe access in expandNodes and collapseNodes filter functions", () => {
    type CustomNode = {
      id: string;
      text: string;
      category?: "folder" | "file";
      nodes?: CustomNode[];
    };

    const filterFolders = (node: CustomNode) => {
      expectTypeOf(node).toEqualTypeOf<CustomNode>();
      if (node.category) {
        expectTypeOf(node.category).toEqualTypeOf<"folder" | "file">();
        return node.category === "folder";
      }
      return false;
    };

    expectTypeOf(filterFolders).parameter(0).toEqualTypeOf<CustomNode>();
    expectTypeOf<
      Parameters<typeof filterFolders>[0]
    >().toEqualTypeOf<CustomNode>();
  });

  it("should support recursive node types with custom properties", () => {
    type FileNode = {
      id: string;
      text: string;
      fileSize?: number;
      fileType?: string;
      nodes?: FileNode[];
    };

    const fileNodes: FileNode[] = [
      {
        id: "1",
        text: "Documents",
        nodes: [
          {
            id: "2",
            text: "file.txt",
            fileSize: 1024,
            fileType: "text/plain",
          },
        ],
      },
    ];

    expectTypeOf<typeof fileNodes>().toEqualTypeOf<FileNode[]>();

    const firstNode = fileNodes[0];
    if (firstNode.nodes) {
      expectTypeOf<typeof firstNode.nodes>().toEqualTypeOf<FileNode[]>();
      const childNode = firstNode.nodes[0];
      if (childNode.fileSize) {
        expectTypeOf<typeof childNode.fileSize>().toEqualTypeOf<number>();
      }
    }
  });

  it("should work with nodes that have icon property typed correctly", () => {
    type IconNode = {
      id: string;
      text: string;
      icon?: SvelteComponentType;
      nodes?: IconNode[];
    };

    const iconNodes: IconNode[] = [
      { id: "1", text: "Node with icon", icon: undefined },
    ];

    expectTypeOf<typeof iconNodes>().toEqualTypeOf<IconNode[]>();

    const nodeWithIcon: IconNode = {
      id: "2",
      text: "Node",
      icon: undefined as SvelteComponentType | undefined,
    };
    expectTypeOf(nodeWithIcon.icon).toEqualTypeOf<
      SvelteComponentType | undefined
    >();
  });
});
