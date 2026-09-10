import { createHighlightCursor } from "../../src/ListBox/highlightCursor.js";

const HIGHLIGHT = "bx--list-box__menu-item--highlighted";

function option(id: string) {
  const node = document.createElement("div");
  node.id = id;
  node.className = "bx--list-box__menu-item";
  const inner = document.createElement("div");
  inner.className = "bx--list-box__menu-item__option";
  node.appendChild(inner);
  document.body.appendChild(node);
  return node;
}

describe("createHighlightCursor", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("adds the highlight class to the registered node on set", () => {
    const cursor = createHighlightCursor();
    const a = option("a");
    const b = option("b");
    cursor.register("a", a);
    cursor.register("b", b);

    cursor.set("b", { scroll: false });

    expect(a).not.toHaveClass(HIGHLIGHT);
    expect(b).toHaveClass(HIGHLIGHT);
  });

  it("moves the class from the previous node to the next", () => {
    const cursor = createHighlightCursor();
    const a = option("a");
    const b = option("b");
    cursor.register("a", a);
    cursor.register("b", b);

    cursor.set("a", { scroll: false });
    cursor.set("b", { scroll: false });

    expect(a).not.toHaveClass(HIGHLIGHT);
    expect(b).toHaveClass(HIGHLIGHT);
  });

  it("does not strip highlight from an active (selected) node", () => {
    const cursor = createHighlightCursor();
    const selected = option("sel");
    const other = option("other");
    cursor.register("sel", selected, true);
    cursor.register("other", other);

    cursor.set("sel", { scroll: false });
    cursor.set("other", { scroll: false });

    expect(selected).toHaveClass(HIGHLIGHT);
    expect(other).toHaveClass(HIGHLIGHT);
  });

  it("re-registering with isActive false clears the highlight once the cursor moves on", () => {
    const cursor = createHighlightCursor();
    const selected = option("sel");
    const other = option("other");
    cursor.register("sel", selected, true);
    cursor.register("other", other);
    cursor.set("other", { scroll: false });

    // Deselecting re-registers with `isActive: false`, mirroring
    // `ListBoxMenuItem` re-running `bindCursor` when its `active` prop flips.
    cursor.register("sel", selected, false);

    expect(selected).not.toHaveClass(HIGHLIGHT);
  });

  it("applies highlight on register when set ran first", () => {
    const cursor = createHighlightCursor();
    cursor.set("late", { scroll: false });

    const late = option("late");
    cursor.register("late", late);

    expect(late).toHaveClass(HIGHLIGHT);
  });

  it("clears highlight when set to null", () => {
    const cursor = createHighlightCursor();
    const a = option("a");
    cursor.register("a", a);
    cursor.set("a", { scroll: false });
    cursor.set(null, { scroll: false });

    expect(a).not.toHaveClass(HIGHLIGHT);
  });

  it("unregister stops tracking the node", () => {
    const cursor = createHighlightCursor();
    const a = option("a");
    const unregister = cursor.register("a", a);
    unregister();
    cursor.set("a", { scroll: false });

    expect(a).not.toHaveClass(HIGHLIGHT);
  });
});
