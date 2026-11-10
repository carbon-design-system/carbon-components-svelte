import { GHOST, renderSegments } from "../../src/utils/render-segments.js";

const ZWSP = String.fromCodePoint(0x200b);

describe("renderSegments", () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement("div");
  });

  const spans = () => Array.from(parent.children) as HTMLElement[];

  it("draws a span for each run, with its classes", () => {
    const drawn = renderSegments(parent, [
      { text: "is:", className: "key" },
      { text: "open" },
      { text: " ", className: "gap" },
    ]);

    expect(drawn).toBe("is:open ");
    expect(parent.textContent).toBe("is:open ");
    expect(spans().map((span) => span.className)).toEqual(["key", "", "gap"]);
  });

  it("never reads text as markup", () => {
    const hostile =
      '<img src=x onerror="window.__pwned = 1"> &amp; <b>bold</b>';
    renderSegments(parent, [{ text: hostile, className: "run" }]);

    expect(parent.textContent).toBe(hostile);
    expect(parent.querySelector("img, b")).toBeNull();
    expect(parent.innerHTML).toContain("&lt;img");
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it("does not take a class as markup", () => {
    renderSegments(parent, [{ text: "x", className: '"><img src=x>' }]);

    expect(parent.querySelector("img")).toBeNull();
    expect(spans()).toHaveLength(1);
  });

  it("reuses the spans, so a key changes one of them", () => {
    renderSegments(parent, [{ text: "ab" }, { text: "cd", className: "x" }]);
    const [first, second] = spans();

    renderSegments(parent, [{ text: "ab" }, { text: "cde", className: "x" }]);

    expect(spans()[0]).toBe(first);
    expect(spans()[1]).toBe(second);
    expect(parent.textContent).toBe("abcde");
  });

  it("removes the spans a shorter text no longer needs", () => {
    renderSegments(parent, [{ text: "a" }, { text: "b", className: "x" }]);
    renderSegments(parent, [{ text: "a" }]);

    expect(spans()).toHaveLength(1);
    renderSegments(parent, []);
    expect(parent.childNodes).toHaveLength(0);
  });

  it("drops a class that a run no longer has", () => {
    renderSegments(parent, [{ text: "a", className: "x" }]);
    renderSegments(parent, [{ text: "a" }]);

    expect(spans()[0].hasAttribute("class")).toBe(false);
  });

  it("skips empty runs and joins neighbours of one class", () => {
    const drawn = renderSegments(parent, [
      { text: "a", className: "x" },
      { text: "" },
      { text: "b", className: "x" },
      { text: "c" },
      { text: "d" },
    ]);

    expect(drawn).toBe("abcd");
    expect(spans().map((span) => span.textContent)).toEqual(["ab", "cd"]);
  });

  describe("ghost text", () => {
    it("is drawn after the value and is not part of what was drawn", () => {
      const drawn = renderSegments(parent, [
        { text: "ada@gm" },
        { text: "ail.com", className: "dim", ghost: true },
      ]);

      expect(drawn).toBe("ada@gm");
      expect(parent.textContent).toBe("ada@gmail.com");
      expect(spans()[1].className).toBe(`${GHOST} dim`);
    });

    it("is a span of its own, even next to a run of the same class", () => {
      renderSegments(parent, [
        { text: "a", className: "x" },
        { text: "b", className: "x", ghost: true },
      ]);

      expect(spans()).toHaveLength(2);
    });
  });

  describe("trailingBreak", () => {
    it("keeps the empty last line after a final newline", () => {
      const drawn = renderSegments(parent, [{ text: "one\n" }], {
        trailingBreak: true,
      });

      expect(drawn).toBe("one\n");
      expect(spans()).toHaveLength(2);
      expect(parent.textContent).toBe(`one\n${ZWSP}`);
    });

    it("keeps a line in an empty text", () => {
      expect(renderSegments(parent, [], { trailingBreak: true })).toBe("");
      expect(parent.textContent).toBe(ZWSP);
    });

    it("adds nothing to a text that ends in a character", () => {
      renderSegments(parent, [{ text: "one" }], { trailingBreak: true });

      expect(parent.textContent).toBe("one");
    });
  });
});
