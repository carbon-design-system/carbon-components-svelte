import {
  focusSection,
  getActiveSectionId,
  revealItem,
  scrollToSection,
} from "../../src/utils/active-section.js";
import { rect } from "./rect";

describe("getActiveSectionId", () => {
  let tops: Record<string, number>;

  beforeEach(() => {
    document.body.innerHTML =
      '<section id="a"></section><section id="b"></section><section id="c"></section>';
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return rect({ top: tops[this.id] ?? 0 });
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("returns the last section whose top has crossed the offset", () => {
    tops = { a: -300, b: -10, c: 200 };
    expect(getActiveSectionId(["a", "b", "c"])).toBe("b");
  });

  it("returns the first section before any has crossed", () => {
    tops = { a: 50, b: 300, c: 600 };
    expect(getActiveSectionId(["a", "b", "c"])).toBe("a");
  });

  it("counts a section within the offset as crossed", () => {
    tops = { a: -300, b: 40, c: 200 };
    expect(getActiveSectionId(["a", "b", "c"], { offset: 48 })).toBe("b");
  });

  it("defaults the offset to the container's scroll-padding-top", () => {
    const container = document.createElement("div");
    container.id = "container";
    container.style.scrollPaddingTop = "48px";
    document.body.append(container);
    tops = { container: 0, a: -300, b: 40, c: 200 };
    expect(getActiveSectionId(["a", "b", "c"], { container })).toBe("b");
    expect(getActiveSectionId(["a", "b", "c"], { container, offset: 0 })).toBe(
      "a",
    );
  });

  it("moves the activation line down the container by `line`", () => {
    const container = document.createElement("div");
    container.id = "container";
    Object.defineProperty(container, "clientHeight", { value: 600 });
    document.body.append(container);
    tops = { container: 0, a: -300, b: 250, c: 550 };
    const ids = ["a", "b", "c"];
    expect(getActiveSectionId(ids, { container, offset: 0 })).toBe("a");
    expect(getActiveSectionId(ids, { container, offset: 0, line: 0.5 })).toBe(
      "b",
    );
    expect(getActiveSectionId(ids, { container, offset: 0, line: 1 })).toBe(
      "c",
    );
    // The line starts below the offset: 100 + 0.5 * (600 - 100) = 350.
    expect(getActiveSectionId(ids, { container, offset: 100, line: 0.5 })).toBe(
      "b",
    );
  });

  it("measures tops relative to a scroll container", () => {
    const container = document.createElement("div");
    container.id = "container";
    document.body.append(container);
    tops = { container: 100, a: 0, b: 90, c: 400 };
    expect(getActiveSectionId(["a", "b", "c"], { container })).toBe("b");
  });

  it("returns the last section once scrolled to the end", () => {
    tops = { a: -300, b: -10, c: 200 };
    const container = document.createElement("div");
    Object.defineProperties(container, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 400 },
      scrollTop: { value: 600 },
    });
    tops.container = 0;
    expect(getActiveSectionId(["a", "b", "c"], { container })).toBe("c");
  });

  it("skips ids with no element", () => {
    tops = { a: -300, c: -10 };
    expect(getActiveSectionId(["a", "missing", "c"])).toBe("c");
    expect(getActiveSectionId(["missing"])).toBeUndefined();
  });
});

describe("scrollToSection", () => {
  let tops: Record<string, number>;

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return rect({ top: tops[this.id] ?? 0 });
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  function setup() {
    const container = document.createElement("div");
    container.id = "container";
    container.scrollTo = vi.fn();
    Object.defineProperty(container, "scrollTop", { value: 200 });
    const target = document.createElement("section");
    target.id = "target";
    container.append(target);
    document.body.append(container);
    return { container, target };
  }

  it("scrolls the container so the target's top meets its top", () => {
    const { container, target } = setup();
    tops = { container: 100, target: 400 };
    const windowScroll = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    scrollToSection(target, { container });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 500 });
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it("leaves room for the offset", () => {
    const { container, target } = setup();
    tops = { container: 100, target: 400 };

    scrollToSection(target, { container, offset: 48 });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 452 });
  });

  it("uses the target's scroll-margin-top when it is larger", () => {
    const { container, target } = setup();
    target.style.scrollMarginTop = "64px";
    tops = { container: 100, target: 400 };

    scrollToSection(target, { container, offset: 48 });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 436 });
  });

  it("adds the container's scroll-padding-top to the scroll-margin-top", () => {
    const { container, target } = setup();
    container.style.scrollPaddingTop = "40px";
    target.style.scrollMarginTop = "16px";
    tops = { container: 100, target: 400 };

    scrollToSection(target, { container, offset: 48 });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 444 });
  });

  it("resolves a percentage scroll-padding-top against the container", () => {
    const { container, target } = setup();
    Object.defineProperty(container, "clientHeight", { value: 400 });
    container.style.scrollPaddingTop = "10%";
    tops = { container: 100, target: 400 };

    scrollToSection(target, { container });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 460 });
  });

  it("scrolls the window when there is no container", () => {
    const { target } = setup();
    tops = { target: 400 };
    const windowScroll = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    scrollToSection(target, { offset: 48 });

    expect(windowScroll).toHaveBeenCalledWith({ top: 352 });
  });
});

describe("focusSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses a section until blur, then removes the added tabindex", () => {
    const target = document.createElement("section");
    document.body.append(target);
    const focus = vi.spyOn(target, "focus");

    focusSection(target);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(target);
    expect(target).toHaveAttribute("tabindex", "-1");

    target.blur();

    expect(target).not.toHaveAttribute("tabindex");
  });

  it("keeps an existing tabindex", () => {
    const target = document.createElement("section");
    target.tabIndex = 0;
    document.body.append(target);

    focusSection(target);
    target.blur();

    expect(target).toHaveAttribute("tabindex", "0");
  });

  it("removes the added tabindex when the section can't take focus", () => {
    const target = document.createElement("section");

    focusSection(target);

    expect(document.activeElement).not.toBe(target);
    expect(target).not.toHaveAttribute("tabindex");
  });
});

describe("revealItem", () => {
  let rects: Record<string, { top: number; height: number }>;

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return rect(rects[this.id] ?? { top: 0, height: 0 });
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  /** A scrolling sidebar holding `item`, and a section outside it. */
  function setup() {
    const sidebar = document.createElement("aside");
    sidebar.id = "sidebar";
    sidebar.style.overflowY = "auto";
    Object.defineProperties(sidebar, {
      scrollHeight: { value: 800 },
      clientHeight: { value: 200 },
    });
    const item = document.createElement("li");
    item.id = "item";
    sidebar.append(item);
    const section = document.createElement("section");
    document.body.append(sidebar, section);
    return { sidebar, item, section };
  }

  it("scrolls the sidebar down to an item below its bottom", () => {
    const { sidebar, item, section } = setup();
    rects = {
      sidebar: { top: 0, height: 200 },
      item: { top: 300, height: 32 },
    };

    revealItem(item, section);

    expect(sidebar.scrollTop).toBe(132);
  });

  it("scrolls the sidebar up to an item above its top", () => {
    const { sidebar, item, section } = setup();
    sidebar.scrollTop = 100;
    rects = {
      sidebar: { top: 0, height: 200 },
      item: { top: -40, height: 32 },
    };

    revealItem(item, section);

    expect(sidebar.scrollTop).toBe(60);
  });

  it("leaves an item already in view", () => {
    const { sidebar, item, section } = setup();
    rects = { sidebar: { top: 0, height: 200 }, item: { top: 40, height: 32 } };

    revealItem(item, section);

    expect(sidebar.scrollTop).toBe(0);
  });

  it("doesn't scroll an ancestor that also holds the section", () => {
    const { sidebar, item, section } = setup();
    sidebar.append(section);
    rects = {
      sidebar: { top: 0, height: 200 },
      item: { top: 300, height: 32 },
    };

    revealItem(item, section);

    expect(sidebar.scrollTop).toBe(0);
  });
});
