import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import FileManager from "carbon-components-svelte/FileManager/FileManager.svelte";
import {
  createMemoryFileSystem,
  type MemoryFileSystemOptions,
} from "../../src/utils/file-system.js";
import { user } from "../utils/user";

const entries = (): NonNullable<MemoryFileSystemOptions["entries"]> => [
  { path: "/Docs/a.txt", size: 10, type: "text/plain", content: "a" },
  { path: "/Docs/b.txt", size: 20, type: "text/plain", content: "b" },
  { path: "/Music", kind: "folder" },
  { path: "/c.txt", size: 30, type: "text/plain" },
  { path: "/d.txt", size: 40, type: "text/plain" },
  { path: "/e.txt", size: 50, type: "text/plain" },
];

const row = (path: string) =>
  document.querySelector(`tr[data-row="${path}"]`) as HTMLElement;

async function renderManager(props: Record<string, unknown> = {}) {
  const adapter = createMemoryFileSystem({ entries: entries() });
  const result = render(FileManager, { adapter, ...props });
  await waitFor(() => expect(row("/c.txt")).not.toBeNull());
  return { adapter, ...result };
}

describe("FileManager", () => {
  it("lists the root with folders first and a tree beside it", async () => {
    await renderManager();
    const rows = [...document.querySelectorAll("tr[data-row]")].map((tr) =>
      tr.getAttribute("data-row"),
    );
    expect(rows).toEqual(["/Docs", "/Music", "/c.txt", "/d.txt", "/e.txt"]);
    expect(screen.getByRole("treeitem", { name: "Docs" })).toBeInTheDocument();
  });

  it("opens a folder on double click and shows it in the path", async () => {
    await renderManager();
    await fireEvent.dblClick(row("/Docs"));
    await waitFor(() => expect(row("/Docs/a.txt")).not.toBeNull());
    const path = screen.getByRole("navigation", { name: "Folder path" });
    expect(path).toHaveTextContent("Docs");
  });

  it("selects with click, Shift range and Cmd toggle, and marks the rows", async () => {
    await renderManager();
    await fireEvent.click(row("/c.txt").querySelectorAll("td")[1]);
    await fireEvent.click(row("/e.txt").querySelectorAll("td")[1], {
      shiftKey: true,
    });
    await waitFor(() =>
      expect(row("/d.txt")).toHaveAttribute("aria-selected", "true"),
    );
    expect(row("/Docs")).toHaveAttribute("aria-selected", "false");
    await fireEvent.click(row("/d.txt").querySelectorAll("td")[1], {
      ctrlKey: true,
    });
    await waitFor(() =>
      expect(row("/d.txt")).toHaveAttribute("aria-selected", "false"),
    );
    expect(row("/c.txt")).toHaveAttribute("aria-selected", "true");
  });

  it("keeps the selection when the view switches to the grid", async () => {
    await renderManager();
    await fireEvent.click(row("/Music").querySelectorAll("td")[1]);
    await user.click(screen.getByRole("button", { name: "Grid view" }));
    // jsdom has no layout, so the grid windows only its first lines.
    const option = await screen.findByRole("option", { name: "Music" });
    expect(option).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Docs" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("deletes after confirming and announces it", async () => {
    const { adapter } = await renderManager();
    await fireEvent.click(row("/e.txt").querySelectorAll("td")[1]);
    await fireEvent.keyDown(row("/e.txt"), { key: "Delete" });
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent('Delete "e.txt"?');
    await user.click(
      screen.getAllByRole("button", { name: "Delete" }).at(-1) as HTMLElement,
    );
    await waitFor(() => expect(row("/e.txt")).toBeNull());
    expect((await adapter.list("/")).map((e) => e.name)).not.toContain("e.txt");
    await waitFor(() =>
      expect(document.body).toHaveTextContent("Deleted 1 item"),
    );
  });

  it("renames in place and refuses a duplicate name", async () => {
    const { adapter } = await renderManager();
    await fireEvent.click(row("/d.txt").querySelectorAll("td")[1]);
    await fireEvent.keyDown(row("/d.txt"), { key: "F2" });
    const input = await screen.findByRole("textbox", { name: "Rename d.txt" });
    await user.clear(input);
    await user.type(input, "c.txt");
    expect(
      screen.getByText("An item with that name already exists."),
    ).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "z.txt{Enter}");
    await waitFor(() => expect(row("/z.txt")).not.toBeNull());
    expect((await adapter.list("/")).map((e) => e.name)).toContain("z.txt");
  });

  it("shows an error with a retry when a folder cannot load", async () => {
    const adapter = createMemoryFileSystem({
      entries: entries(),
      fail: (operation, path) =>
        operation === "list" && path === "/Docs"
          ? new Error("No access")
          : undefined,
    });
    render(FileManager, { adapter });
    await waitFor(() => expect(row("/Docs")).not.toBeNull());
    await fireEvent.dblClick(row("/Docs"));
    expect(await screen.findByText("Couldn't load Docs")).toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("loads a tree branch only when it opens", async () => {
    const { adapter } = await renderManager();
    expect(adapter.calls.filter((call) => call.operation === "list")).toEqual([
      { operation: "list", path: "/" },
    ]);
    const item = screen.getByRole("treeitem", { name: "Docs" });
    await user.click(
      item.querySelector(".bx--tree-parent-node__toggle") as HTMLElement,
    );
    await waitFor(() =>
      expect(
        adapter.calls
          .filter((call) => call.operation === "list")
          .map((call) => call.path),
      ).toContain("/Docs"),
    );
  });

  it("uploads dropped files and lists them", async () => {
    const { adapter } = await renderManager();
    const dataTransfer = {
      types: ["Files"],
      items: [],
      files: [new File(["hello"], "dropped.txt", { type: "text/plain" })],
      dropEffect: "none",
    };
    const pane = document.querySelector(
      ".bx--file-manager__pane",
    ) as HTMLElement;
    await fireEvent.drop(pane, { dataTransfer });
    await waitFor(() => expect(row("/dropped.txt")).not.toBeNull());
    expect((await adapter.stat("/dropped.txt")).size).toBe(5);
    expect(screen.getByText(/Uploads, 1 of 1 done/)).toBeInTheDocument();
  });
});
