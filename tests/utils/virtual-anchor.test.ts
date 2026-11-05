import {
  caretAnchor,
  pointAnchor,
  rangeAnchor,
} from "../../src/utils/virtual-anchor.js";
import { rect } from "./rect";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("pointAnchor", () => {
  it("is a zero-size rect at the point, and moves", () => {
    const anchor = pointAnchor(30, 40);
    expect(anchor.getBoundingClientRect()).toMatchObject({
      left: 30,
      top: 40,
      right: 30,
      bottom: 40,
      width: 0,
      height: 0,
    });
    anchor.move(50, 60);
    expect(anchor.getBoundingClientRect()).toMatchObject({ left: 50, top: 60 });
  });
});

describe("rangeAnchor", () => {
  it("reads the range's rect each time, and stands in its container", () => {
    document.body.innerHTML = "<p>Hello world</p>";
    const text = document.querySelector("p")?.firstChild as Text;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    let box = rect({ left: 10, top: 20, width: 50, height: 16 });
    range.getBoundingClientRect = () => box;
    const anchor = rangeAnchor(range);
    expect(anchor.contextElement).toBe(document.querySelector("p"));
    expect(anchor.getBoundingClientRect()).toBe(box);
    box = rect({ left: 15, top: 20, width: 50, height: 16 });
    expect(anchor.getBoundingClientRect().left).toBe(15);
  });

  it("falls back to the first line box for a range with no box of its own", () => {
    document.body.innerHTML = "<p>Hello</p>";
    const range = document.createRange();
    range.setStart(document.querySelector("p")?.firstChild as Text, 2);
    range.collapse(true);
    range.getBoundingClientRect = () => rect();
    const line = rect({ left: 7, top: 8, width: 0, height: 14 });
    range.getClientRects = () => [line] as unknown as DOMRectList;
    expect(rangeAnchor(range).getBoundingClientRect()).toBe(line);
  });
});

describe("caretAnchor", () => {
  function field(tag: "textarea" | "input", value: string) {
    const el = document.createElement(tag);
    el.value = value;
    document.body.append(el);
    el.getBoundingClientRect = () =>
      rect({ left: 100, top: 200, width: 300, height: 80 });
    return el;
  }

  it("lays the text before the caret out in a hidden copy that shares the field's text styles", () => {
    const el = field("textarea", "Hello @pri world");
    el.style.fontSize = "16px";
    el.style.fontFamily = "monospace";
    el.style.letterSpacing = "1px";
    el.setSelectionRange(8, 8);
    // The marker sits where the text before the caret ends.
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(64);
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(24);

    const anchor = caretAnchor(el);
    expect(anchor.contextElement).toBe(el);
    const box = anchor.getBoundingClientRect();
    expect(box.left).toBe(164);
    expect(box.top).toBe(224);
    expect(box.width).toBe(1);

    const mirror = document.body.lastElementChild as HTMLElement;
    expect(mirror).not.toBe(el);
    expect(mirror.getAttribute("aria-hidden")).toBe("true");
    expect(mirror.style.fontSize).toBe("16px");
    expect(mirror.style.letterSpacing).toBe("1px");
    expect(mirror.style.visibility).toBe("hidden");
    // Never off the page's start edge, which an RTL page scrolls to.
    expect(mirror.style.position).toBe("fixed");
    expect(mirror.style.left).toBe("0px");
    // The text up to the caret, then the rest in a marker, so a word that
    // wraps takes its start with it.
    expect(mirror.firstChild?.textContent).toBe("Hello @p");
    expect(mirror.querySelector("span")?.textContent).toBe("ri world");
  });

  it("reuses one copy across reads, follows a caret that moves, and removes it on destroy", () => {
    const el = field("textarea", "abcdef");
    let index = 2;
    const anchor = caretAnchor(el, () => index);
    anchor.getBoundingClientRect();
    anchor.getBoundingClientRect();
    expect(document.querySelectorAll("[aria-hidden='true']")).toHaveLength(1);
    index = 4;
    anchor.getBoundingClientRect();
    expect(
      (document.body.lastElementChild as HTMLElement).firstChild?.textContent,
    ).toBe("abcd");
    anchor.destroy();
    expect(document.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
  });

  it("takes away the field's own scroll", () => {
    const el = field("textarea", "line one\nline two");
    el.scrollTop = 30;
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(10);
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(60);
    expect(caretAnchor(el, () => 10).getBoundingClientRect().top).toBe(230);
  });

  it("centers the one line of an input in its box", () => {
    const el = field("input", "abc");
    Object.defineProperty(el, "clientHeight", { value: 40 });
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(0);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(20);
    // 40px box, 20px line: 10px down.
    expect(caretAnchor(el, () => 1).getBoundingClientRect().top).toBe(210);
  });

  it("clamps an index past the text", () => {
    const el = field("textarea", "abc");
    const anchor = caretAnchor(el, () => 99);
    anchor.getBoundingClientRect();
    expect(
      (document.body.lastElementChild as HTMLElement).firstChild?.textContent,
    ).toBe("abc");
  });
});
