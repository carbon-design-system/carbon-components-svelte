import { sticky } from "../../src/utils/sticky.js";
import { stubIntersectionObserver } from "../utils/intersection-observer-mock";

function setup(parentDisplay = "block") {
  const parent = document.createElement("div");
  parent.style.display = parentDisplay;
  const node = document.createElement("section");
  node.style.position = "sticky";
  node.style.top = "48px";
  parent.append(node);
  document.body.append(parent);
  return { parent, node };
}

function sentinelOf(parent: Element) {
  const sentinel = parent.querySelector("[data-ccs-sticky-sentinel]");
  assert(sentinel instanceof HTMLElement);
  return sentinel;
}

describe("sticky", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it("reports stuck while the element is visible and its sentinel is not", () => {
    const { instances } = stubIntersectionObserver();
    const { parent, node } = setup();
    const onChange = vi.fn();
    sticky(node, { onChange });
    const sentinel = sentinelOf(parent);
    const [observer] = instances;

    // One observer for the element and its sentinel.
    expect(instances).toHaveLength(1);
    expect(observer.elements).toEqual(new Set([node, sentinel]));

    observer.trigger(node, true);
    observer.trigger(sentinel, true);
    expect(onChange).not.toHaveBeenCalled();

    observer.trigger(sentinel, false);
    expect(onChange).toHaveBeenLastCalledWith(true);

    // Scrolled away past its containing block: no longer stuck.
    observer.trigger(node, false);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("shares one observer across elements", () => {
    const { instances } = stubIntersectionObserver();
    sticky(setup().node);
    sticky(setup().node);

    expect(instances).toHaveLength(1);
    expect(instances[0].elements.size).toBe(4);
  });

  it("puts the sentinel before the element in a block parent, shifted by the offset", () => {
    stubIntersectionObserver();
    const { parent, node } = setup();
    sticky(node);

    const sentinel = sentinelOf(parent);
    expect(sentinel.nextElementSibling).toBe(node);
    expect(sentinel).toHaveAttribute("aria-hidden", "true");
    expect(sentinel.style.position).toBe("relative");
    expect(sentinel.style.top).toBe("calc(-48px)");
  });

  it("puts the sentinel after a bottom-edge element", () => {
    stubIntersectionObserver();
    const { parent, node } = setup();
    sticky(node, { edge: "bottom", offset: 16 });

    const sentinel = sentinelOf(parent);
    expect(node.nextElementSibling).toBe(sentinel);
    expect(sentinel.style.top).toBe("16px");
  });

  it.each(["flex", "grid"])(
    "puts the sentinel inside the element in a %s parent",
    (display) => {
      stubIntersectionObserver();
      const { parent, node } = setup(display);
      sticky(node, { offset: "3rem" });

      const sentinel = sentinelOf(parent);
      expect(sentinel.parentElement).toBe(node);
      expect(sentinel.style.position).toBe("absolute");
      expect(sentinel.style.top).toBe("calc(-1px - (3rem))");
    },
  );

  it("removes the sentinel and reports unstuck when disabled", () => {
    const { instances } = stubIntersectionObserver();
    const { parent, node } = setup();
    const onChange = vi.fn();
    const action = sticky(node, { onChange });
    const [observer] = instances;
    observer.trigger(node, true);
    observer.trigger(sentinelOf(parent), false);
    expect(onChange).toHaveBeenLastCalledWith(true);

    action.update({ enabled: false, onChange });
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(parent.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
    expect(observer.elements.size).toBe(0);

    action.update({ onChange });
    expect(parent.querySelector("[data-ccs-sticky-sentinel]")).not.toBeNull();
  });

  it("cleans up on destroy without reporting", () => {
    const { instances } = stubIntersectionObserver();
    const { parent, node } = setup();
    const onChange = vi.fn();
    const action = sticky(node, { onChange });
    instances[0].trigger(node, true);
    instances[0].trigger(sentinelOf(parent), false);
    onChange.mockClear();

    action.destroy();
    expect(parent.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
    expect(instances[0].elements.size).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const { instances } = stubIntersectionObserver();
    const { parent, node } = setup();
    sticky(node, { enabled: false });

    expect(parent.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
    expect(instances).toHaveLength(0);
  });
});
