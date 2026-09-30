import { render } from "@testing-library/svelte";
import TreeView from "../../src/TreeView/TreeView.svelte";
import { findRowById } from "./helpers";

const nodes = [
  { id: "a", text: "A" },
  {
    id: "b",
    text: "B",
    nodes: [{ id: "c", text: "C", nodes: [{ id: "d", text: "D" }] }],
  },
];

describe("TreeView.showNode scroll and result", () => {
  // `setup-globals` stubs `scrollIntoView`, which jsdom does not implement.
  const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);

  beforeEach(() => {
    scrollIntoView.mockClear();
  });

  it("resolves true after focusing the node", async () => {
    const { component } = render(TreeView, { nodes });

    await expect(component.showNode("d")).resolves.toBe(true);
    expect(document.getElementById("d")).toHaveFocus();
  });

  it("resolves false for an unknown id", async () => {
    const { component } = render(TreeView, { nodes });

    await expect(component.showNode("missing")).resolves.toBe(false);
  });

  it("scrolls without focusing or selecting when scroll is set", async () => {
    const { component } = render(TreeView, { nodes });

    await expect(
      component.showNode("d", { select: false, focus: false, scroll: true }),
    ).resolves.toBe(true);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("d"));
    expect(document.getElementById("d")).not.toHaveFocus();
    expect(document.getElementById("d")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("does not scroll when focus and scroll are both off", async () => {
    const { component } = render(TreeView, { nodes });

    await expect(component.showNode("d", { focus: false })).resolves.toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("resolves false when a collapsed ancestor hides the row", async () => {
    const { component } = render(TreeView, { nodes });

    await expect(
      component.showNode("d", { expand: false, select: false }),
    ).resolves.toBe(false);
  });

  it("scrolls a virtual row into view without focusing it", async () => {
    const manyNodes = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      text: `Row ${i}`,
    }));
    const { component, container } = render(TreeView, {
      nodes: manyNodes,
      virtualize: { maxVisibleRows: 5 },
    });
    const tree = container.querySelector('[role="tree"]');
    assert(tree instanceof HTMLElement);

    await expect(
      component.showNode(150, { select: false, focus: false, scroll: true }),
    ).resolves.toBe(true);

    expect(tree.scrollTop).toBeGreaterThan(0);
    expect(findRowById(150)).not.toBeNull();
    expect(findRowById(150)).not.toHaveFocus();
  });

  it("resolves false for a virtual row under a collapsed ancestor", async () => {
    const { component } = render(TreeView, {
      nodes,
      virtualize: true,
    });

    await expect(
      component.showNode("d", { expand: false, select: false }),
    ).resolves.toBe(false);
  });
});
