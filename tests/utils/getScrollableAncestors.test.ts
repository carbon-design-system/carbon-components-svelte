import { getScrollableAncestors } from "../../src/utils/getScrollableAncestors.js";

/** Nested divs (outermost first) with optional styles, plus an unstyled leaf. */
function buildChain(styles: Array<Partial<CSSStyleDeclaration>>): HTMLElement {
  let parent: HTMLElement = document.body;

  for (const style of styles) {
    const el = document.createElement("div");
    Object.assign(el.style, style);
    parent.appendChild(el);
    parent = el;
  }

  const leaf = document.createElement("div");
  parent.appendChild(leaf);
  return leaf;
}

describe("getScrollableAncestors", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("returns an empty array when no ancestor is scrollable", () => {
    const leaf = buildChain([{ overflow: "visible" }, { overflow: "hidden" }]);
    expect(getScrollableAncestors(leaf)).toEqual([]);
  });

  test("collects ancestors with overflow auto or scroll, nearest first", () => {
    const leaf = buildChain([
      { overflow: "scroll" },
      { overflow: "visible" },
      { overflow: "auto" },
    ]);

    const result = getScrollableAncestors(leaf);

    expect(result).toHaveLength(2);
    expect((result[0] as HTMLElement).style.overflow).toBe("auto");
    expect((result[1] as HTMLElement).style.overflow).toBe("scroll");
  });

  test("detects scrollability from overflowX or overflowY alone", () => {
    const leaf = buildChain([{ overflowY: "auto" }, { overflowX: "scroll" }]);

    expect(getScrollableAncestors(leaf)).toHaveLength(2);
  });

  test("does not include the node itself, only its ancestors", () => {
    const leaf = buildChain([]);
    leaf.style.overflow = "scroll";

    expect(getScrollableAncestors(leaf)).not.toContain(leaf);
  });
});
