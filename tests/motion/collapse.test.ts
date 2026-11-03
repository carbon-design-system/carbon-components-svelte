import { collapse } from "../../src/motion/collapse.js";
import { duration, easingCss } from "../../src/motion/tokens.js";

type FakeAnimation = { cancel: () => void; onfinish: (() => void) | null };

describe("collapse", () => {
  let reduce = false;
  let animations: FakeAnimation[] = [];
  let animate: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // The reduced-motion module caches its MediaQueryList, so a single stub
    // whose `matches` is flipped per test keeps it in sync.
    vi.stubGlobal("matchMedia", () => ({
      get matches() {
        return reduce;
      },
      addEventListener() {},
      removeEventListener() {},
    }));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    reduce = false;
    animations = [];
    animate = vi.fn(() => {
      const animation: FakeAnimation = { cancel: vi.fn(), onfinish: null };
      animations.push(animation);
      return animation;
    });
    Element.prototype.animate = animate as unknown as Element["animate"];
  });

  afterEach(() => {
    // Restore jsdom's missing API.
    Reflect.deleteProperty(Element.prototype, "animate");
    document.body.innerHTML = "";
  });

  function createNode() {
    const node = document.createElement("div");
    node.setAttribute("style", "height: 80px; padding-top: 16px");
    document.body.append(node);
    return node;
  }

  const finish = () => animations.at(-1)?.onfinish?.();

  it("starts collapsed, hidden and inert without animating", () => {
    const node = createNode();
    collapse(node, false);

    expect(node.style.height).toBe("0px");
    expect(node.style.paddingTop).toBe("0px");
    expect(node.style.overflow).toBe("hidden");
    expect(node.style.visibility).toBe("hidden");
    expect(node.inert).toBe(true);
    expect(animate).not.toHaveBeenCalled();
  });

  it("leaves an open element untouched", () => {
    const node = createNode();
    collapse(node, { open: true });

    expect(node.style.height).toBe("80px");
    expect(node.style.visibility).toBe("");
    // jsdom has no `inert`; the action never sets it on an open element.
    expect(node.inert).toBeFalsy();
  });

  it("opens with the entrance easing and closes with the exit easing", () => {
    const node = createNode();
    const action = collapse(node, false);

    action.update(true);
    expect(node.inert).toBe(false);
    expect(animate).toHaveBeenLastCalledWith(expect.any(Array), {
      duration: duration.moderate02,
      easing: easingCss.entrance.productive,
    });

    action.update({ open: false, mode: "expressive", duration: "fast02" });
    expect(node.inert).toBe(true);
    expect(animate).toHaveBeenLastCalledWith(expect.any(Array), {
      duration: duration.fast02,
      easing: easingCss.exit.expressive,
    });
  });

  it("animates from the current size to the new one", () => {
    const node = createNode();
    const action = collapse(node, true);

    action.update(false);
    const [keyframes] = animate.mock.calls[0];
    expect(keyframes[0]).toMatchObject({ height: "80px", paddingTop: "16px" });
    expect(keyframes[1]).toMatchObject({ height: "0px", paddingTop: "0px" });
  });

  it("lifts a stylesheet's closed state while it animates, then rests", () => {
    const node = createNode();
    const action = collapse(node, true);

    action.update(false);
    expect(node.style.visibility).toBe("visible");
    expect(node.style.maxHeight).toBe("none");
    expect(node.style.overflow).toBe("hidden");
    expect(node.inert).toBe(true);

    finish();
    expect(node.style.visibility).toBe("hidden");
    expect(node.style.maxHeight).toBe("");
    expect(node.style.height).toBe("0px");

    action.update(true);
    expect(node.style.visibility).toBe("visible");
    finish();
    expect(node.style.visibility).toBe("");
    expect(node.style.overflow).toBe("");
    expect(node.style.height).toBe("");
  });

  it("cancels an animation in progress, whose finish no longer settles", () => {
    const node = createNode();
    const action = collapse(node, true);

    action.update(false);
    const first = animations[0];
    action.update(true);
    expect(first.cancel).toHaveBeenCalledTimes(1);

    first.onfinish?.();
    expect(node.style.visibility).toBe("visible");
    expect(node.inert).toBe(false);

    action.destroy();
    expect(animations[1].cancel).toHaveBeenCalledTimes(1);
  });

  it("does nothing when open does not change", () => {
    const node = createNode();
    const action = collapse(node, true);

    action.update({ open: true, duration: 500 });
    expect(animate).not.toHaveBeenCalled();
  });

  it("jumps to the new state under reduced motion", () => {
    reduce = true;
    const node = createNode();
    const action = collapse(node, true);

    action.update(false);
    expect(node.style.height).toBe("0px");
    expect(node.style.visibility).toBe("hidden");
    expect(node.inert).toBe(true);
    expect(animate).not.toHaveBeenCalled();
  });

  it("jumps when the browser has no Web Animations API", () => {
    Reflect.deleteProperty(Element.prototype, "animate");
    const node = createNode();
    const action = collapse(node, true);

    action.update(false);
    expect(node.style.height).toBe("0px");
    expect(node.inert).toBe(true);
  });
});
