import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { findRowById } from "./helpers";
import TreeViewVirtualizeChildNodes from "./TreeView.virtualize.childNodes.test.svelte";

describe("TreeView virtualize childNodes slot", () => {
  it("renders the slot under an expanded node whose children have not loaded", async () => {
    render(TreeViewVirtualizeChildNodes);
    expect(screen.queryByTestId("placeholder")).toBeNull();

    findRowById("a")?.focus();
    await user.keyboard("{ArrowRight}");
    await tick();

    const placeholder = screen.getByTestId("placeholder");
    expect(placeholder).toHaveTextContent(
      "Loading Folder A (expanded: true, leaf: false)",
    );
    const row = placeholder.closest("li");
    expect(row).toHaveAttribute("role", "none");
    expect(row?.previousElementSibling).toBe(findRowById("a"));
  });

  it("skips the placeholder row with the arrow keys", async () => {
    render(TreeViewVirtualizeChildNodes, { expandedIds: ["a"] });

    findRowById("a")?.focus();
    await user.keyboard("{ArrowDown}");
    expect(findRowById("b")).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(findRowById("a")).toHaveFocus();
  });

  it("replaces the placeholder once children load", async () => {
    const { component } = render(TreeViewVirtualizeChildNodes, {
      expandedIds: ["a"],
    });
    expect(screen.getByTestId("placeholder")).toBeInTheDocument();

    component.nodes = [
      {
        id: "a",
        text: "Folder A",
        hasChildren: true,
        nodes: [{ id: "a-1", text: "Child" }],
      },
      { id: "b", text: "Folder B", hasChildren: true },
    ];
    await tick();

    expect(screen.queryByTestId("placeholder")).toBeNull();
    expect(findRowById("a-1")).toHaveAttribute("aria-level", "2");
  });
});
