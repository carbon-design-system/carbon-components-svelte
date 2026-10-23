import { render, waitFor } from "@testing-library/svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeViewDirection from "./TreeViewDirection.test.svelte";

/** Press a key, then wait for focus to land on the row with `id`. */
async function press(key: string, id: string) {
  await user.keyboard(`{${key}}`);
  await waitFor(() => expect(treeItemById(id)).toHaveFocus());
}

describe("TreeView writing direction", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  it.each([
    ["recursive", false],
    ["virtualized", true],
  ])("swaps Left and Right in RTL (%s)", async (_mode, virtualize) => {
    render(TreeViewDirection, { props: { virtualize } });
    treeItemById("analytics").focus();

    await press("ArrowLeft", "analytics");
    expect(treeItemById("analytics")).toHaveAttribute("aria-expanded", "true");
    await press("ArrowLeft", "engine");
    await press("ArrowLeft", "engine");
    expect(treeItemById("engine")).toHaveAttribute("aria-expanded", "true");
    await press("ArrowLeft", "spark");
    await press("ArrowLeft", "spark");

    await press("ArrowRight", "engine");
    await press("ArrowRight", "engine");
    expect(treeItemById("engine")).toHaveAttribute("aria-expanded", "false");
    await press("ArrowRight", "analytics");

    treeItemById("runbook").focus();
    await press("ArrowRight", "analytics");
  });

  it("lets a LayoutDirection win over the computed direction", async () => {
    document.documentElement.style.direction = "rtl";
    render(TreeViewDirection, { props: { dir: "ltr" } });
    treeItemById("analytics").focus();

    await press("ArrowRight", "analytics");
    expect(treeItemById("analytics")).toHaveAttribute("aria-expanded", "true");
  });

  it.each([
    ["recursive", false],
    ["virtualized", true],
  ])(
    "reads a page direction change on the next key (%s)",
    async (_mode, virtualize) => {
      render(TreeViewDirection, { props: { context: false, virtualize } });
      treeItemById("analytics").focus();
      await press("ArrowRight", "analytics");
      expect(treeItemById("analytics")).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      document.documentElement.style.direction = "rtl";
      await press("ArrowRight", "analytics");
      expect(treeItemById("analytics")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    },
  );
});
