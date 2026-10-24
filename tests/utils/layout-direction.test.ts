import {
  inlineKey,
  resolveLayoutDirection,
} from "carbon-components-svelte/utils/layout-direction.js";

describe("resolveLayoutDirection", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("style");
    document.body.replaceChildren();
  });

  function attach(direction?: string) {
    const node = document.createElement("div");
    if (direction) node.style.direction = direction;
    document.body.append(node);
    return node;
  }

  it("uses the context first", () => {
    expect(resolveLayoutDirection("rtl", attach("ltr"))).toBe("rtl");
    expect(resolveLayoutDirection("ltr", attach("rtl"))).toBe("ltr");
  });

  it("falls back to the element's computed direction", () => {
    expect(resolveLayoutDirection(undefined, attach("rtl"))).toBe("rtl");
    expect(resolveLayoutDirection(undefined, attach())).toBe("ltr");
  });

  it.each([
    ["no element", null],
    ["a detached element", document.createElement("div")],
  ])("falls back to the document with %s", (_, node) => {
    expect(resolveLayoutDirection(undefined, node)).toBe("ltr");
    document.documentElement.style.direction = "rtl";
    expect(resolveLayoutDirection(undefined, node)).toBe("rtl");
  });
});

describe("inlineKey", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it.each([
    ["ArrowLeft", "ltr", "ArrowLeft"],
    ["ArrowRight", "ltr", "ArrowRight"],
    ["ArrowLeft", "rtl", "ArrowRight"],
    ["ArrowRight", "rtl", "ArrowLeft"],
    ["ArrowUp", "rtl", "ArrowUp"],
    ["Home", "rtl", "Home"],
  ] as const)("reads %s in %s as %s", (key, direction, expected) => {
    expect(inlineKey(key, direction)).toBe(expected);
  });

  it("reads the document's direction when called", () => {
    expect(inlineKey("ArrowLeft", undefined)).toBe("ArrowLeft");
    document.documentElement.style.direction = "rtl";
    expect(inlineKey("ArrowLeft", undefined)).toBe("ArrowRight");
  });
});
