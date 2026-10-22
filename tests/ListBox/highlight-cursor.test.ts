import { createHighlightCursor } from "../../src/ListBox/highlight-cursor.js";
import { rect } from "../utils/rect";

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

  describe("scrolling", () => {
    /**
     * A scrollable listbox holding one option whose inner element sits below
     * the visible area. Layout is stubbed since the test DOM computes none.
     */
    function scrollableOption() {
      const container = document.createElement("div");
      container.setAttribute("role", "listbox");
      Object.defineProperty(container, "clientHeight", { value: 100 });
      Object.defineProperty(container, "scrollHeight", { value: 300 });
      container.getBoundingClientRect = () => rect({ top: 0, bottom: 100 });
      document.body.appendChild(container);

      const node = option("far");
      container.appendChild(node);
      const inner = node.querySelector(".bx--list-box__menu-item__option");
      assert(inner instanceof HTMLElement);
      inner.getBoundingClientRect = () => rect({ top: 150, bottom: 180 });
      return { container, node };
    }

    it("scrolls the highlighted option into view by default", () => {
      const cursor = createHighlightCursor();
      const { container, node } = scrollableOption();
      cursor.register("far", node);

      cursor.set("far");

      expect(container.scrollTop).toBe(80);
    });

    it("does not scroll when scroll is false", () => {
      const cursor = createHighlightCursor();
      const { container, node } = scrollableOption();
      cursor.register("far", node);

      cursor.set("far", { scroll: false });

      expect(container.scrollTop).toBe(0);
    });

    it("does not scroll to an option the pointer is over", () => {
      const cursor = createHighlightCursor();
      const { container, node } = scrollableOption();
      cursor.register("far", node);
      vi.spyOn(node, "matches").mockImplementation(
        (selector) => selector === ":hover",
      );

      cursor.set("far");

      expect(container.scrollTop).toBe(0);
    });
  });
});
