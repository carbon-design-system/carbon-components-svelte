import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import TreeViewDragDrop from "./TreeView.dragDrop.test.svelte";

function treeItemById(id: string): HTMLElement {
  const el = document.getElementById(id);
  expect.assert(el instanceof HTMLElement);
  return el;
}

function createDragEvent(
  type: "dragstart" | "dragover" | "dragleave" | "drop" | "dragend",
  options: { clientY?: number; relatedTarget?: EventTarget | null } = {},
): DragEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientY: options.clientY ?? 0,
    relatedTarget: options.relatedTarget ?? null,
  }) as unknown as DragEvent;

  Object.defineProperty(event, "dataTransfer", {
    value: {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      getData: vi.fn(),
    },
    writable: false,
    configurable: true,
  });

  return event;
}

describe("TreeView drag-and-drop (move event)", () => {
  beforeEach(() => {
    // Rows report a fixed 30px-tall rect starting at y=100, so `clientY`
    // 105 / 115 / 125 land in the top / middle / bottom third.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 100,
      height: 30,
      bottom: 130,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 100,
      toJSON() {},
    });
  });

  it("is not draggable by default", () => {
    render(TreeViewDragDrop, { props: { draggable: false } });
    expect(treeItemById("blockchain")).toHaveAttribute("draggable", "false");
  });

  it("marks non-disabled rows draggable and disabled rows not draggable", () => {
    render(TreeViewDragDrop);
    expect(treeItemById("blockchain")).toHaveAttribute("draggable", "true");
    expect(treeItemById("disabled-node")).toHaveAttribute("draggable", "false");
  });

  it("dispatches move with position 'before' when dropped on the top third of a row", () => {
    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const source = treeItemById("blockchain");
    const target = treeItemById("sql-query");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 105 }));
    target.dispatchEvent(createDragEvent("drop", { clientY: 105 }));

    expect(onMove).toHaveBeenCalledWith({
      ids: ["blockchain"],
      targetId: "sql-query",
      position: "before",
    });
  });

  it("dispatches move with position 'inside' when dropped on the middle of a row", () => {
    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const source = treeItemById("sql-query");
    const target = treeItemById("blockchain");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 115 }));
    target.dispatchEvent(createDragEvent("drop", { clientY: 115 }));

    expect(onMove).toHaveBeenCalledWith({
      ids: ["sql-query"],
      targetId: "blockchain",
      position: "inside",
    });
  });

  it("dispatches move with position 'after' when dropped on the bottom third of a row", () => {
    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const source = treeItemById("blockchain");
    const target = treeItemById("sql-query");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 125 }));
    target.dispatchEvent(createDragEvent("drop", { clientY: 125 }));

    expect(onMove).toHaveBeenCalledWith({
      ids: ["blockchain"],
      targetId: "sql-query",
      position: "after",
    });
  });

  it("measures the drop position against the row's own label, not the whole subtree", () => {
    // A parent row's `<li>` also contains its (expanded) children, so its
    // own rect spans the whole subtree — much taller than a single row.
    // Position math must use `.bx--tree-node__label`'s rect instead.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const isLabel = this.classList.contains("bx--tree-node__label");
        return {
          top: 100,
          height: isLabel ? 32 : 200,
          bottom: isLabel ? 132 : 300,
          left: 0,
          right: 0,
          width: 0,
          x: 0,
          y: 100,
          toJSON() {},
        };
      },
    );

    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const source = treeItemById("blockchain");
    const target = treeItemById("analytics");

    // Offset 15 within a 32px label lands in the middle third ("inside");
    // the same offset within the 200px `<li>` would land in the top third
    // ("before"), so this only passes when the label rect is used.
    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 115 }));
    target.dispatchEvent(createDragEvent("drop", { clientY: 115 }));

    expect(onMove).toHaveBeenCalledWith({
      ids: ["blockchain"],
      targetId: "analytics",
      position: "inside",
    });
  });

  it("refuses to drop a node onto itself", () => {
    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const row = treeItemById("blockchain");
    row.dispatchEvent(createDragEvent("dragstart"));
    row.dispatchEvent(createDragEvent("dragover", { clientY: 115 }));
    row.dispatchEvent(createDragEvent("drop", { clientY: 115 }));

    expect(onMove).not.toHaveBeenCalled();
  });

  it("refuses to drop a node onto its own descendant", () => {
    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const source = treeItemById("analytics");
    const target = treeItemById("engine");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 115 }));
    target.dispatchEvent(createDragEvent("drop", { clientY: 115 }));

    expect(onMove).not.toHaveBeenCalled();
  });

  it("refuses to drop onto a disabled node", () => {
    const onMove = vi.fn();
    render(TreeViewDragDrop, { props: { onMove } });

    const source = treeItemById("blockchain");
    const target = treeItemById("disabled-node");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 115 }));
    target.dispatchEvent(createDragEvent("drop", { clientY: 115 }));

    expect(onMove).not.toHaveBeenCalled();
  });

  it("adds a drag-over indicator class while hovering a valid target and removes it on dragleave", async () => {
    render(TreeViewDragDrop);

    const source = treeItemById("blockchain");
    const target = treeItemById("sql-query");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 105 }));
    await tick();
    expect(target).toHaveClass("bx--tree-node--drag-over-before");

    target.dispatchEvent(
      createDragEvent("dragleave", { relatedTarget: document.body }),
    );
    await tick();
    expect(target).not.toHaveClass("bx--tree-node--drag-over-before");
  });

  it("clears drag state on dragend even without a successful drop", async () => {
    render(TreeViewDragDrop);

    const source = treeItemById("blockchain");
    const target = treeItemById("sql-query");

    source.dispatchEvent(createDragEvent("dragstart"));
    target.dispatchEvent(createDragEvent("dragover", { clientY: 105 }));
    await tick();
    expect(target).toHaveClass("bx--tree-node--drag-over-before");

    source.dispatchEvent(createDragEvent("dragend"));
    await tick();
    expect(target).not.toHaveClass("bx--tree-node--drag-over-before");
    expect(source).not.toHaveClass("bx--tree-node--dragging");
  });
});
