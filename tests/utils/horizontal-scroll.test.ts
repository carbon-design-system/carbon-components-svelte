import {
  computeScrollOverflow,
  scrollByViewport,
  scrollIntoViewX,
} from "../../src/utils/horizontal-scroll.js";
import { rect } from "./rect";

describe("computeScrollOverflow", () => {
  it("no overflow when content fits exactly", () => {
    expect(
      computeScrollOverflow({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 200,
      }),
    ).toEqual({ canScrollBackward: false, canScrollForward: false });
  });

  it("can scroll backward once scrolled away from the start", () => {
    expect(
      computeScrollOverflow({
        scrollLeft: 10,
        scrollWidth: 300,
        clientWidth: 200,
      }),
    ).toEqual({ canScrollBackward: true, canScrollForward: true });
  });

  it("can scroll forward when content overflows past the viewport", () => {
    expect(
      computeScrollOverflow({
        scrollLeft: 0,
        scrollWidth: 300,
        clientWidth: 200,
      }).canScrollForward,
    ).toBe(true);
  });

  it("forwardEpsilon absorbs a sub-pixel rounding gap", () => {
    const metrics = { scrollLeft: 0, scrollWidth: 201, clientWidth: 200 };

    expect(computeScrollOverflow(metrics).canScrollForward).toBe(true);
    expect(
      computeScrollOverflow({ ...metrics, forwardEpsilon: 1 }).canScrollForward,
    ).toBe(false);
  });
});

describe("scrollByViewport", () => {
  it("is a no-op when node is missing", () => {
    expect(() => scrollByViewport(null, 1)).not.toThrow();
  });

  it("scrolls by 75% of the node's own width, in the given direction", () => {
    const node = document.createElement("div");
    Object.defineProperty(node, "clientWidth", { value: 400 });
    const scrollBy = vi.fn();
    node.scrollBy = scrollBy;

    scrollByViewport(node, 1);
    expect(scrollBy).toHaveBeenCalledWith({ left: 300, behavior: "smooth" });

    scrollByViewport(node, -1);
    expect(scrollBy).toHaveBeenCalledWith({ left: -300, behavior: "smooth" });
  });
});

describe("scrollIntoViewX", () => {
  function buildRow(options: {
    containerLeft: number;
    containerRight: number;
    targetLeft: number;
    targetRight: number;
  }) {
    const container = document.createElement("div");
    container.getBoundingClientRect = () =>
      rect({ left: options.containerLeft, right: options.containerRight });
    container.scrollLeft = 0;

    const target = document.createElement("div");
    target.getBoundingClientRect = () =>
      rect({ left: options.targetLeft, right: options.targetRight });

    return { container, target };
  }

  it("is a no-op when container or target is missing", () => {
    const { container, target } = buildRow({
      containerLeft: 0,
      containerRight: 100,
      targetLeft: 0,
      targetRight: 50,
    });
    expect(() => scrollIntoViewX(null, target)).not.toThrow();
    expect(() => scrollIntoViewX(container, null)).not.toThrow();
  });

  it("does not scroll when the target is already fully visible", () => {
    const { container, target } = buildRow({
      containerLeft: 0,
      containerRight: 200,
      targetLeft: 50,
      targetRight: 150,
    });

    scrollIntoViewX(container, target);
    expect(container.scrollLeft).toBe(0);
  });

  it("scrolls left when the target overflows the left edge, honoring margin", () => {
    const { container, target } = buildRow({
      containerLeft: 0,
      containerRight: 300,
      targetLeft: 30,
      targetRight: 100,
    });

    scrollIntoViewX(container, target, 48);
    // leftOverflow = 30 - (0 + 48) = -18
    expect(container.scrollLeft).toBe(-18);
  });

  it("scrolls right when the target overflows the right edge, honoring margin", () => {
    const { container, target } = buildRow({
      containerLeft: 0,
      containerRight: 300,
      targetLeft: 200,
      targetRight: 280,
    });

    scrollIntoViewX(container, target, 48);
    // rightOverflow = 280 - (300 - 48) = 28
    expect(container.scrollLeft).toBe(28);
  });
});
