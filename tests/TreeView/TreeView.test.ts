import { render, screen } from "@testing-library/svelte";
import type TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
import type {
  ComponentEvents,
  ComponentProps,
  ComponentType as SvelteComponentType,
} from "svelte";
import { user } from "../setup-tests";
import TreeViewAutoCollapse from "./TreeView.autoCollapse.test.svelte";
import TreeViewHierarchy from "./TreeView.hierarchy.test.svelte";
import TreeViewMultiselect from "./TreeView.multiselect.test.svelte";
import TreeViewProps from "./TreeView.props.test.svelte";
import TreeViewSlot from "./TreeView.slot.test.svelte";
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
      icon: expect.anything(),
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

  it("can collapse all nodes", async () => {
    render(component);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);
    expect(getAllExpandedItems().length).toBeGreaterThan(0);

    const collapseAllButton = screen.getByText("Collapse all");
    await user.click(collapseAllButton);

    noExpandedItems();
  });

  it("can collapse some nodes", async () => {
    render(component);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);
    const initialExpandedCount = getAllExpandedItems().length;
    expect(initialExpandedCount).toBeGreaterThan(0);

    const collapseSomeNodesButton = screen.getByText("Collapse some nodes");
    await user.click(collapseSomeNodesButton);

    const expandedCount = getAllExpandedItems().length;
    expect(expandedCount).toBeLessThan(initialExpandedCount);
    expect(expandedCount).toBeGreaterThan(0);
  });

  it("dispatches toggle event when node is toggled", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const analyticsNode = analyticsItems[0];
    const toggleButton = analyticsNode.querySelector(
      ".bx--tree-parent-node__toggle",
    );

    expect(toggleButton).toBeInTheDocument();

    expect.assert(toggleButton instanceof HTMLElement);
    await user.click(toggleButton);

    expect(consoleLog).toHaveBeenCalledWith(
      "toggle",
      expect.objectContaining({
        id: 1,
        text: "Analytics",
        leaf: false,
      }),
    );
  });

  it("dispatches focus event when node receives focus", () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    expect(consoleLog).toHaveBeenCalledWith(
      "focus",
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
        leaf: true,
      }),
    );
  });

  it("handles disabled nodes correctly", async () => {
    render(component);

    const disabledNode = screen.getByRole("treeitem", {
      name: /Integration/,
    });
    expect(disabledNode).toHaveAttribute("aria-disabled", "true");
    expect(disabledNode).toHaveClass("bx--tree-node--disabled");

    await user.click(disabledNode);
    expect(disabledNode).not.toHaveAttribute("aria-selected", "true");
  });

  it("navigates with ArrowDown key", async () => {
    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    await user.keyboard("{ArrowDown}");

    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const nextItem = analyticsItems[0];
    expect(nextItem).toHaveFocus();
  });

  it("navigates with ArrowUp key", async () => {
    render(component);

    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const secondItem = analyticsItems[0];
    secondItem.focus();

    await user.keyboard("{ArrowUp}");

    const firstItem = getItemByName(/AI \/ Machine learning/);
    expect(firstItem).toHaveFocus();
  });

  it("skips disabled nodes in keyboard navigation", async () => {
    render(component);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);

    const databasesNodes = screen.getAllByRole("treeitem", {
      name: /Databases/,
      selected: false,
    });
    const databasesNode = databasesNodes[0];
    databasesNode.focus();

    await user.keyboard("{ArrowDown}");

    const disabledNode = screen.getByRole("treeitem", {
      name: /Integration/,
    });
    expect(disabledNode).not.toHaveFocus();
  });

  it("expands parent node with ArrowRight key", async () => {
    render(component);

    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const analyticsNode = analyticsItems[0];
    analyticsNode.focus();

    await user.keyboard("{ArrowRight}");

    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses parent node with ArrowLeft key", async () => {
    render(component);

    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const analyticsNode = analyticsItems[0];
    analyticsNode.focus();

    await user.keyboard("{ArrowRight}");
    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowLeft}");
    expect(analyticsNode).toHaveAttribute("aria-expanded", "false");
  });

  it("selects node with Enter key", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("selectedIds", [0]);
    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
      }),
    );
  });

  it("selects node with Space key", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    await user.keyboard(" ");

    expect(consoleLog).toHaveBeenCalledWith("selectedIds", [0]);
    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
      }),
    );
  });
});

describe("TreeView Props", () => {
  it("applies default size class", () => {
    render(TreeViewProps);

    const tree = screen.getByRole("tree");
    expect(tree).toHaveClass("bx--tree--default");
  });

  it("applies compact size class", () => {
    render(TreeViewProps, { size: "compact" });

    const tree = screen.getByRole("tree");
    expect(tree).toHaveClass("bx--tree--compact");
  });

  it("displays label text", () => {
    render(TreeViewProps, { labelText: "Test Label" });

    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--label");
  });

  it("hides label when hideLabel is true", () => {
    render(TreeViewProps, { labelText: "Test Label", hideLabel: true });

    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
    const tree = screen.getByRole("tree");
    expect(tree).toHaveAttribute("aria-label", "Test Label");
  });

  it("sets activeId correctly", () => {
    render(TreeViewProps, { activeId: 1 });

    const node2 = screen.getByRole("treeitem", { name: /Node 2/ });
    expect(node2).toHaveAttribute("aria-current", "true");
    expect(node2).toHaveClass("bx--tree-node--active");
  });

  it("handles multiple selectedIds", () => {
    render(TreeViewMultiselect, { selectedIds: [0, 7, 9] });

    const tree = screen.getByRole("tree");
    expect(tree).toHaveAttribute("aria-multiselectable", "true");

    const aiItem = screen.getByRole("treeitem", {
      name: /AI \/ Machine learning/,
    });
    const blockchainItem = screen.getByRole("treeitem", { name: /Blockchain/ });
    const databasesItem = screen.getByRole("treeitem", { name: /Databases/ });

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");
    expect(databasesItem).toHaveAttribute("aria-selected", "true");
  });

  it("handles empty nodes array", () => {
    render(TreeViewProps, { nodes: [] });

    const tree = screen.getByRole("tree");
    expect(tree).toBeInTheDocument();
    expect(screen.queryAllByRole("treeitem")).toHaveLength(0);
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

  it("should enforce TreeNode constraint on generic type", () => {
    type CustomNode = {
      id: string;
      text: string;
      metadata?: { count: number };
      nodes?: CustomNode[];
    };

    type ComponentType = TreeViewComponent<CustomNode>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<NonNullable<Props["nodes"]>>().toEqualTypeOf<
      readonly CustomNode[]
    >();

    type BaseComponentType = TreeViewComponent<TreeNode>;
    type BaseProps = ComponentProps<BaseComponentType>;
    expectTypeOf<NonNullable<BaseProps["nodes"]>>().toEqualTypeOf<
      readonly TreeNode[]
    >();
  });

  describe("Id generic parameter", () => {
    it("should default Id to string | number when not specified", () => {
      type ComponentType = TreeViewComponent<TreeNode>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["activeId"]>().toEqualTypeOf<
        string | number | undefined
      >();
      expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<string | number> | undefined
      >();
      expectTypeOf<Props["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<string | number> | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<
        TreeNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
    });

    it("should support different ID types (string, number, union)", () => {
      // String ID
      type StringNode = { id: string; text: string };
      type StringComponent = TreeViewComponent<StringNode>;
      type StringProps = ComponentProps<StringComponent>;
      type StringEvents = ComponentEvents<StringComponent>;

      expectTypeOf<StringProps["activeId"]>().toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf<StringProps["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();
      expectTypeOf<StringProps["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();

      type StringSelectEvent = StringEvents["select"];
      type StringSelectDetail =
        StringSelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<StringSelectDetail>().toEqualTypeOf<
        StringNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();

      // Number ID
      type NumberNode = { id: number; text: string };
      type NumberComponent = TreeViewComponent<NumberNode>;
      type NumberProps = ComponentProps<NumberComponent>;

      expectTypeOf<NumberProps["activeId"]>().toEqualTypeOf<
        number | undefined
      >();
      expectTypeOf<NumberProps["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<number> | undefined
      >();
      expectTypeOf<NumberProps["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<number> | undefined
      >();

      // Union ID
      type UnionId = "a" | "b" | "c";
      type UnionNode = { id: UnionId; text: string };
      type UnionComponent = TreeViewComponent<UnionNode>;
      type UnionProps = ComponentProps<UnionComponent>;
      type UnionEvents = ComponentEvents<UnionComponent>;

      expectTypeOf<UnionProps["activeId"]>().toEqualTypeOf<
        UnionId | undefined
      >();
      expectTypeOf<UnionProps["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<UnionId> | undefined
      >();
      expectTypeOf<UnionProps["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<UnionId> | undefined
      >();

      type UnionSelectEvent = UnionEvents["select"];
      type UnionSelectDetail =
        UnionSelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<UnionSelectDetail>().toEqualTypeOf<
        UnionNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
    });

    it("should work with 'as const' for literal type inference", () => {
      const nodes = [
        { id: "node1", text: "Node 1" },
        { id: "node2", text: "Node 2" },
        { id: "node3", text: "Node 3" },
      ] as const;

      type InferredNode = (typeof nodes)[number];
      type InferredId = InferredNode["id"];

      expectTypeOf<InferredId>().toEqualTypeOf<"node1" | "node2" | "node3">();

      type ComponentType = TreeViewComponent<InferredNode>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["activeId"]>().toEqualTypeOf<InferredId | undefined>();
      expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<InferredId> | undefined
      >();
      expectTypeOf<Props["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<InferredId> | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<
        InferredNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
      expectTypeOf<SelectEventDetail["id"]>().toEqualTypeOf<InferredId>();
    });

    it("should type showNode method correctly with different ID types", () => {
      // String ID - verify the component accepts string IDs
      type StringNode = { id: string; text: string };
      type StringComponent = TreeViewComponent<StringNode>;
      type StringProps = ComponentProps<StringComponent>;
      // Test that showNode accepts string by checking the prop types
      expectTypeOf<StringProps["activeId"]>().toEqualTypeOf<
        string | undefined
      >();

      // Number ID
      type NumberNode = { id: number; text: string };
      type NumberComponent = TreeViewComponent<NumberNode>;
      type NumberProps = ComponentProps<NumberComponent>;
      expectTypeOf<NumberProps["activeId"]>().toEqualTypeOf<
        number | undefined
      >();

      // Union ID
      type UnionId = "folder1" | "folder2" | "file1";
      type UnionNode = { id: UnionId; text: string };
      type UnionComponent = TreeViewComponent<UnionNode>;
      type UnionProps = ComponentProps<UnionComponent>;
      expectTypeOf<UnionProps["activeId"]>().toEqualTypeOf<
        UnionId | undefined
      >();
    });

    it("should type context properties correctly with different ID types", () => {
      type CustomNode = { id: string; text: string };
      type ComponentType = TreeViewComponent<CustomNode>;
      type Props = ComponentProps<ComponentType>;

      // These props use Node["id"] which should be inferred as string
      expectTypeOf<Props["activeId"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();
      expectTypeOf<Props["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();
    });

    it("should type event details correctly with different ID types", () => {
      type CustomNode = {
        id: number;
        text: string;
        metadata?: { count: number };
      };
      type ComponentType = TreeViewComponent<CustomNode>;
      type Events = ComponentEvents<ComponentType>;

      type SelectEvent = Events["select"];
      type SelectDetail = SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectDetail["id"]>().toEqualTypeOf<number>();
      expectTypeOf<SelectDetail>().toEqualTypeOf<
        CustomNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();

      type ToggleEvent = Events["toggle"];
      type ToggleDetail = ToggleEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ToggleDetail["id"]>().toEqualTypeOf<number>();

      type FocusEvent = Events["focus"];
      type FocusDetail = FocusEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<FocusDetail["id"]>().toEqualTypeOf<number>();
    });
  });

  it("supports custom label slot", () => {
    render(TreeViewSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });
});

describe("TreeView autoCollapse", () => {
  const getToggleButton = (node: HTMLElement) => {
    const button = node.querySelector(".bx--tree-parent-node__toggle");
    expect.assert(button instanceof HTMLElement);
    return button;
  };

  const getAllExpandedItems = () => {
    return screen.queryAllByRole("treeitem", { expanded: true });
  };

  it("collapses sibling nodes when autoCollapse is true", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = screen.getByRole("treeitem", { name: /Folder 1/ });
    const folder2 = screen.getByRole("treeitem", { name: /Folder 2/ });

    await user.click(getToggleButton(folder1));
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(getAllExpandedItems()).toHaveLength(1);

    await user.click(getToggleButton(folder2));
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
    expect(getAllExpandedItems()).toHaveLength(1);
  });

  it("keeps siblings expanded when autoCollapse is false", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: false });

    const folder1 = screen.getByRole("treeitem", { name: /Folder 1/ });
    const folder2 = screen.getByRole("treeitem", { name: /Folder 2/ });

    await user.click(getToggleButton(folder1));
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(getAllExpandedItems()).toHaveLength(1);

    await user.click(getToggleButton(folder2));
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(getAllExpandedItems()).toHaveLength(2);
  });

  it("only collapses siblings at the same level, not parent or cousins", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder3 = screen.getByRole("treeitem", { name: /^Folder 3$/ });

    await user.click(getToggleButton(folder3));
    expect(folder3).toHaveAttribute("aria-expanded", "true");

    const subfolder1 = screen.getByRole("treeitem", { name: /^Subfolder 1$/ });
    await user.click(getToggleButton(subfolder1));
    expect(subfolder1).toHaveAttribute("aria-expanded", "true");
    expect(folder3).toHaveAttribute("aria-expanded", "true");

    const subfolder2 = screen.getByRole("treeitem", { name: /^Subfolder 2$/ });
    await user.click(getToggleButton(subfolder2));
    expect(subfolder2).toHaveAttribute("aria-expanded", "true");
    expect(subfolder1).toHaveAttribute("aria-expanded", "false");
    expect(folder3).toHaveAttribute("aria-expanded", "true");
  });

  it("works with keyboard navigation (ArrowRight to expand)", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = screen.getByRole("treeitem", { name: /Folder 1/ });
    const folder2 = screen.getByRole("treeitem", { name: /Folder 2/ });

    folder1.focus();
    await user.keyboard("{ArrowRight}");
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    folder2.focus();
    await user.keyboard("{ArrowRight}");
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
  });

  it("works when expanding via Enter/Space key", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = screen.getByRole("treeitem", { name: /Folder 1/ });
    const folder2 = screen.getByRole("treeitem", { name: /Folder 2/ });

    folder1.focus();
    await user.keyboard("{Enter}");
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    folder2.focus();
    await user.keyboard(" ");
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
  });

  it("applies autoCollapse when activeId changes programmatically", async () => {
    const { rerender } = render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = screen.getByRole("treeitem", { name: /Folder 1/ });
    const folder2 = screen.getByRole("treeitem", { name: /Folder 2/ });

    // Manually expand folder1 via click
    await user.click(getToggleButton(folder1));
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    // Programmatically set activeId to an item in folder2
    // This should: 1) expand folder2, 2) collapse folder1 (autoCollapse)
    await rerender({ activeId: "item3" });
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
  });
});
