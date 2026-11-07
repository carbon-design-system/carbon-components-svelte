import { markOffscreen } from "../../docs/src/offscreen";

describe("markOffscreen", () => {
  it("marks an element while it's outside the viewport, until unobserved", () => {
    let report: (
      entries: Partial<IntersectionObserverEntry>[],
    ) => void = () => {};
    const observed = new Set<Element>();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe(element: Element) {
          observed.add(element);
        }
        unobserve(element: Element) {
          observed.delete(element);
        }
      },
    );
    const element = document.createElement("div");
    const unmark = markOffscreen(element);

    report([{ target: element, isIntersecting: false }]);
    expect(element.hasAttribute("data-offscreen")).toBe(true);
    report([{ target: element, isIntersecting: true }]);
    expect(element.hasAttribute("data-offscreen")).toBe(false);

    report([{ target: element, isIntersecting: false }]);
    unmark();
    expect(element.hasAttribute("data-offscreen")).toBe(false);
    expect(observed.has(element)).toBe(false);
    vi.unstubAllGlobals();
  });
});
