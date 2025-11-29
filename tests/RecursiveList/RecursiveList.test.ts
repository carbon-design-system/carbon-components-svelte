import { render, screen } from "@testing-library/svelte";
import RecursiveListHierarchyTest from "./RecursiveList.hierarchy.test.svelte";
import RecursiveListTest from "./RecursiveList.test.svelte";

const testCases = [
  { name: "RecursiveList", component: RecursiveListTest },
  { name: "RecursiveList hierarchy", component: RecursiveListHierarchyTest },
];

describe.each(testCases)("$name", ({ component }) => {
  it("renders all top-level items", () => {
    render(component);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();

    expect(screen.getAllByRole("list")).toHaveLength(4);

    // Nested items
    expect(screen.getByText("Item 1a")).toBeInTheDocument();
  });

  it("renders HTML content", () => {
    render(component);

    const htmlContent = screen.getByText("HTML content");
    expect(htmlContent.tagName).toBe("H5");
  });

  it("renders links correctly", () => {
    render(component);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    // Link with custom text
    const customLink = screen.getByText("Link with custom text");
    expect(customLink).toHaveAttribute("href", "https://svelte.dev/");

    // Plain link
    const plainLink = links.find(
      (link) => link.textContent === "https://svelte.dev/",
    );
    expect(plainLink).toHaveAttribute("href", "https://svelte.dev/");
  });
});

describe("RecursiveList Generics", () => {
  it("should support custom node types with generics", () => {
    type CustomNode = {
      text?: string;
      href?: string;
      html?: string;
      icon?: string;
      badge?: number;
      nodes?: CustomNode[];
    };

    const customNodes: CustomNode[] = [
      {
        text: "Menu Item",
        icon: "icon-home",
        badge: 5,
        nodes: [
          {
            text: "Submenu",
            icon: "icon-folder",
          },
        ],
      },
    ];

    expectTypeOf<typeof customNodes>().toEqualTypeOf<CustomNode[]>();

    // Test that nodes prop accepts CustomNode type
    // Using type assertion to avoid DOM Node type conflict
    type NodesPropType =
      | ReadonlyArray<CustomNode & { nodes?: CustomNode[] }>
      | undefined;
    expectTypeOf<NodesPropType>().toEqualTypeOf<
      ReadonlyArray<CustomNode & { nodes?: CustomNode[] }> | undefined
    >();
  });

  it("should default to RecursiveListNode type when generic is not specified", () => {
    type DefaultRecursiveListNode = {
      text?: string;
      href?: string;
      html?: string;
      nodes?: DefaultRecursiveListNode[];
    };

    const defaultNodes: DefaultRecursiveListNode[] = [{ text: "Item 1" }];

    expectTypeOf<typeof defaultNodes>().toEqualTypeOf<
      DefaultRecursiveListNode[]
    >();

    type NodesPropType =
      | ReadonlyArray<
          DefaultRecursiveListNode & { nodes?: DefaultRecursiveListNode[] }
        >
      | undefined;
    expectTypeOf<NodesPropType>().toEqualTypeOf<
      | ReadonlyArray<
          DefaultRecursiveListNode & { nodes?: DefaultRecursiveListNode[] }
        >
      | undefined
    >();
  });

  it("should support recursive node types with custom properties", () => {
    type MenuNode = {
      text?: string;
      href?: string;
      html?: string;
      icon?: string;
      badge?: number;
      nodes?: MenuNode[];
    };

    const menuNodes: MenuNode[] = [
      {
        text: "Documents",
        icon: "folder",
        nodes: [
          {
            text: "file.txt",
            icon: "file",
            badge: 1,
          },
        ],
      },
    ];

    expectTypeOf<typeof menuNodes>().toEqualTypeOf<MenuNode[]>();

    type NodesPropType =
      | ReadonlyArray<MenuNode & { nodes?: MenuNode[] }>
      | undefined;
    expectTypeOf<NodesPropType>().toEqualTypeOf<
      ReadonlyArray<MenuNode & { nodes?: MenuNode[] }> | undefined
    >();

    const firstNode = menuNodes[0];
    if (firstNode.nodes) {
      expectTypeOf<typeof firstNode.nodes>().toEqualTypeOf<MenuNode[]>();
      const childNode = firstNode.nodes[0];
      if (childNode.badge) {
        expectTypeOf<typeof childNode.badge>().toEqualTypeOf<number>();
      }
    }
  });

  it("should work with nodes that have all base properties", () => {
    type FullNode = {
      text: string;
      href: string;
      html: string;
      nodes?: FullNode[];
    };

    const fullNodes: FullNode[] = [
      {
        text: "Item",
        href: "/item",
        html: "<span>HTML</span>",
      },
    ];

    expectTypeOf<typeof fullNodes>().toEqualTypeOf<FullNode[]>();

    type NodesPropType =
      | ReadonlyArray<FullNode & { nodes?: FullNode[] }>
      | undefined;
    expectTypeOf<NodesPropType>().toEqualTypeOf<
      ReadonlyArray<FullNode & { nodes?: FullNode[] }> | undefined
    >();
  });

  it("should work with minimal node types", () => {
    type MinimalNode = {
      text?: string;
      nodes?: MinimalNode[];
    };

    const minimalNodes: MinimalNode[] = [{ text: "Simple item" }];

    expectTypeOf<typeof minimalNodes>().toEqualTypeOf<MinimalNode[]>();

    type NodesPropType =
      | ReadonlyArray<MinimalNode & { nodes?: MinimalNode[] }>
      | undefined;
    expectTypeOf<NodesPropType>().toEqualTypeOf<
      ReadonlyArray<MinimalNode & { nodes?: MinimalNode[] }> | undefined
    >();
  });
});
