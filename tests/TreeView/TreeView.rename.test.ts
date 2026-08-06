import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeViewRename from "./TreeView.rename.test.svelte";

// Collapsed subtrees stay mounted, and no stylesheet applies
// `.bx--tree-node--hidden` in jsdom, so their labels pollute accessible-name
// computation. Look rows up by id instead, as the lazy-loading suite does.
function treeItemById(id: string): HTMLElement {
  const el = document.getElementById(id);
  expect.assert(el instanceof HTMLElement);
  return el;
}

/** The element carrying the double-click-to-rename handler for a row. */
function labelOf(id: string): HTMLElement {
  const row = treeItemById(id);
  const el =
    row.querySelector(".bx--tree-node__label__text") ??
    row.querySelector(".bx--tree-node__label");
  expect.assert(el instanceof HTMLElement);
  return el;
}

async function findRenameInput(): Promise<HTMLInputElement> {
  const input = await screen.findByRole("textbox");
  expect.assert(input instanceof HTMLInputElement);
  return input;
}

describe("TreeView inline rename", () => {
  it("swaps in an input with the node text selected on F2", async () => {
    render(TreeViewRename);

    treeItemById("leaf").focus();
    await user.keyboard("{F2}");

    const input = await findRenameInput();
    expect(input).toHaveValue("Leaf");
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Leaf".length);
  });

  it("swaps in an input with the node text selected on double-click", async () => {
    render(TreeViewRename);

    await user.dblClick(labelOf("root"));

    const input = await findRenameInput();
    expect(input).toHaveValue("Root");
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Root".length);
  });

  it("commits on Enter and reports the change", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TreeViewRename);

    treeItemById("leaf").focus();
    await user.keyboard("{F2}");
    await findRenameInput();
    await user.keyboard("Renamed{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("rename", {
      id: "leaf",
      text: "Renamed",
      previousText: "Leaf",
    });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("commits on blur", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TreeViewRename);

    treeItemById("leaf").focus();
    await user.keyboard("{F2}");
    await findRenameInput();
    await user.keyboard("Renamed");
    await user.click(document.body);

    expect(consoleLog).toHaveBeenCalledWith("rename", {
      id: "leaf",
      text: "Renamed",
      previousText: "Leaf",
    });
  });

  it("cancels on Escape and returns focus to the row", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TreeViewRename);

    const leaf = treeItemById("leaf");
    leaf.focus();
    await user.keyboard("{F2}");
    await findRenameInput();
    await user.keyboard("Renamed{Escape}");

    await waitFor(() => expect(leaf).toHaveFocus());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(leaf).toHaveTextContent("Leaf");
    expect(consoleLog).not.toHaveBeenCalledWith("rename", expect.anything());
  });

  it("reports nothing when the committed text is unchanged", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TreeViewRename);

    treeItemById("leaf").focus();
    await user.keyboard("{F2}");
    await findRenameInput();
    await user.keyboard("{Enter}");

    expect(consoleLog).not.toHaveBeenCalledWith("rename", expect.anything());
  });

  it("reports nothing when the committed text is whitespace-only", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TreeViewRename);

    treeItemById("leaf").focus();
    await user.keyboard("{F2}");
    await findRenameInput();
    await user.keyboard("   {Enter}");

    expect(consoleLog).not.toHaveBeenCalledWith("rename", expect.anything());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("types a space without triggering type-ahead or selection", async () => {
    render(TreeViewRename);

    const leaf = treeItemById("leaf");
    leaf.focus();
    await user.keyboard("{F2}");
    const input = await findRenameInput();
    await user.keyboard(" x");

    expect(input).toHaveFocus();
    expect(input).toHaveValue(" x");
    expect(leaf).toHaveAttribute("aria-selected", "false");
  });

  it("never edits disabled or link nodes", async () => {
    const { component } = render(TreeViewRename);

    await user.dblClick(labelOf("blocked"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.dblClick(labelOf("link"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    component.edit("blocked");
    component.edit("link");
    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
    );
  });

  it("opts a node out with node.editable set to false", async () => {
    const { component } = render(TreeViewRename);

    await user.dblClick(labelOf("locked"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    component.edit("locked");
    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
    );
  });

  it("expands ancestors when editNode targets a collapsed node", async () => {
    const { component } = render(TreeViewRename);

    const root = treeItemById("root");
    expect(root).toHaveAttribute("aria-expanded", "false");

    component.edit("child");

    const input = await findRenameInput();
    expect(root).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveValue("Child");
    expect(input).toHaveFocus();
  });
});
