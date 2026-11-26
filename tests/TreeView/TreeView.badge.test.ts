import { render, screen } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import TreeViewBadgeSlot from "./TreeView.badgeSlot.test.svelte";

const nodes = [
  {
    id: "docs",
    text: "Documents",
    badge: 4,
    badgeDescription: "4 items",
    nodes: [{ id: "notes", text: "Notes", badge: 12 }],
  },
  { id: "trash", text: "Trash" },
];

describe.each([
  ["nested", false],
  ["virtualized", true],
])("TreeView badge (%s)", (_, virtualize) => {
  const props = { labelText: "Files", nodes, virtualize };

  it("renders the badge after the label text", () => {
    render(TreeView, { props: { ...props, expandedIds: ["docs"] } });

    const badge = screen
      .getByRole("treeitem", { name: "Notes, 12" })
      .querySelector(".bx--tree-node__label")?.lastElementChild;
    expect(badge).toHaveClass("bx--tree-node__badge");
    expect(badge).toHaveTextContent("12");
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });

  it("renders no badge element without a badge", () => {
    render(TreeView, { props });

    const trash = screen.getByRole("treeitem", { name: "Trash" });
    expect(trash.querySelector(".bx--tree-node__badge")).toBeNull();
    expect(trash.querySelector(".bx--visually-hidden")).toBeNull();
  });

  it("names a node with its badge description", () => {
    render(TreeView, { props });

    expect(
      screen.getByRole("treeitem", { name: /^Documents, 4 items/ }),
    ).toBeInTheDocument();
  });
});

describe.each([
  ["nested", false],
  ["virtualized", true],
])("TreeView badgeChildren (%s)", (_, virtualize) => {
  it("renders the slot at the badge position instead of the badge field", () => {
    render(TreeViewBadgeSlot, { props: { virtualize } });

    const api = screen.getByRole("treeitem", {
      // Browsers add the space: the badge is a flex box. jsdom has no CSS.
      name: /^api-gateway\s*Failed$/,
    });
    const badge = api.querySelector(".bx--tree-node__badge");
    expect(badge).toBe(screen.getByTestId("status").parentElement);
    expect(badge).not.toHaveAttribute("aria-hidden");
    expect(api).not.toHaveTextContent("3");
    expect(
      screen.getByRole("treeitem", { name: "web-frontend" }),
    ).toBeInTheDocument();
  });
});
