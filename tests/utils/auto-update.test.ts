import { anchorElement, autoUpdate } from "../../src/utils/auto-update.js";

// Frames run by hand, so a test says which frame an update lands in.
let queue: Array<FrameRequestCallback> = [];
function runFrame() {
  const run = queue;
  queue = [];
  for (const callback of run) callback(0);
}

function scrollBox() {
  const box = document.createElement("div");
  box.style.overflow = "auto";
  const anchor = document.createElement("button");
  const floating = document.createElement("div");
  box.append(anchor);
  document.body.append(box, floating);
  return { box, anchor, floating };
}

beforeEach(() => {
  queue = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    queue.push(callback);
    return queue.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    queue = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("autoUpdate", () => {
  it("updates now, and again in the next frame after a scroll", () => {
    const { box, anchor, floating } = scrollBox();
    const update = vi.fn();
    const stop = autoUpdate(anchor, floating, update);
    expect(update).toHaveBeenCalledTimes(1);

    box.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
    // Three triggers in one frame are one update.
    expect(update).toHaveBeenCalledTimes(1);
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);

    stop();
    box.dispatchEvent(new Event("scroll"));
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("can wait to place until the caller has the floating box", () => {
    const { anchor, floating } = scrollBox();
    const update = vi.fn();
    const stop = autoUpdate(anchor, floating, update, { immediate: false });
    expect(update).not.toHaveBeenCalled();
    stop.update();
    runFrame();
    expect(update).toHaveBeenCalledTimes(1);
    stop();
  });

  it("reads every overlay's layout before any writes", () => {
    const { anchor, floating } = scrollBox();
    const log: string[] = [];
    const stops = ["a", "b", "c"].map((name) =>
      autoUpdate(
        anchor,
        floating,
        () => {
          log.push(`read ${name}`);
          return () => log.push(`write ${name}`);
        },
        { immediate: false },
      ),
    );
    for (const stop of stops) stop.update();
    runFrame();
    expect(log).toEqual([
      "read a",
      "read b",
      "read c",
      "write a",
      "write b",
      "write c",
    ]);
    for (const stop of stops) stop();
  });

  it("shares one listener per scrolling box and one per window event, however many overlays", () => {
    const { box, anchor, floating } = scrollBox();
    const onBox = vi.spyOn(box, "addEventListener");
    const onWindow = vi.spyOn(window, "addEventListener");
    const stops = Array.from({ length: 50 }, () =>
      autoUpdate(anchor, floating, () => {}),
    );
    const boxScrolls = onBox.mock.calls.filter(([type]) => type === "scroll");
    expect(boxScrolls).toHaveLength(1);
    const windowTypes = onWindow.mock.calls.map(([type]) => type);
    for (const type of ["scroll", "resize", "transitionrun", "transitionend"]) {
      expect(windowTypes.filter((t) => t === type)).toHaveLength(1);
    }

    const offBox = vi.spyOn(box, "removeEventListener");
    const offWindow = vi.spyOn(window, "removeEventListener");
    for (const stop of stops.slice(0, 49)) stop();
    expect(offBox).not.toHaveBeenCalled();
    expect(offWindow).not.toHaveBeenCalled();
    stops[49]();
    expect(
      offBox.mock.calls.filter(([type]) => type === "scroll"),
    ).toHaveLength(1);
    expect(offWindow.mock.calls.map(([type]) => type)).toContain("scroll");
  });

  it("follows a box that scrolls above a virtual anchor with a context element", () => {
    const { box, floating } = scrollBox();
    const update = vi.fn();
    const stop = autoUpdate(
      {
        getBoundingClientRect: () => new DOMRect(),
        contextElement: box.firstElementChild,
      },
      floating,
      update,
    );
    box.dispatchEvent(new Event("scroll"));
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);
    stop();
  });

  describe("motion", () => {
    it("follows an ancestor's transition each frame until it ends", () => {
      const { box, anchor, floating } = scrollBox();
      const update = vi.fn();
      const stop = autoUpdate(anchor, floating, update, {
        ancestorScroll: false,
        attributes: false,
      });
      update.mockClear();

      const event = (type: string, propertyName?: string) =>
        Object.assign(new Event(type, { bubbles: true }), { propertyName });
      box.dispatchEvent(event("transitionrun", "transform"));
      runFrame();
      expect(update).toHaveBeenCalledTimes(1);
      // The loop asks for the next frame itself.
      runFrame();
      runFrame();
      expect(update).toHaveBeenCalledTimes(3);

      box.dispatchEvent(event("transitionend", "transform"));
      runFrame();
      const ended = update.mock.calls.length;
      runFrame();
      runFrame();
      expect(update).toHaveBeenCalledTimes(ended);
      stop();
    });

    it("ignores a transition that only paints, and one that does not hold the anchor", () => {
      const { box, anchor, floating } = scrollBox();
      const update = vi.fn();
      const stop = autoUpdate(anchor, floating, update, {
        ancestorScroll: false,
        attributes: false,
      });
      update.mockClear();
      const event = (type: string, propertyName: string) =>
        Object.assign(new Event(type, { bubbles: true }), { propertyName });
      box.dispatchEvent(event("transitionend", "opacity"));
      box.dispatchEvent(event("transitionend", "background-color"));
      floating.dispatchEvent(event("transitionend", "transform"));
      runFrame();
      expect(update).not.toHaveBeenCalled();
      box.dispatchEvent(event("transitionend", "transform"));
      runFrame();
      expect(update).toHaveBeenCalledTimes(1);
      stop();
    });

    // A browser reports a transition to the listeners that were there when it
    // began, so one that is already running is found by asking for it.
    describe("a transition already running when the overlay opens", () => {
      afterEach(() => {
        Reflect.deleteProperty(document, "getAnimations");
      });

      function animation(target: Element, playState = "running") {
        let finish: () => void = () => {};
        const finished = new Promise<void>((resolve) => {
          finish = resolve;
        });
        return {
          effect: { target },
          playState,
          transitionProperty: "transform",
          finished,
          finish,
        };
      }

      it("follows it frame by frame until it finishes", async () => {
        const { box, anchor, floating } = scrollBox();
        const running = animation(box);
        Object.defineProperty(document, "getAnimations", {
          configurable: true,
          value: () => [running],
        });
        const update = vi.fn();
        const stop = autoUpdate(anchor, floating, update, {
          ancestorScroll: false,
          attributes: false,
        });
        update.mockClear();

        runFrame();
        runFrame();
        runFrame();
        expect(update.mock.calls.length).toBeGreaterThanOrEqual(3);

        running.finish();
        await Promise.resolve();
        await Promise.resolve();
        runFrame();
        const ended = update.mock.calls.length;
        runFrame();
        runFrame();
        expect(update).toHaveBeenCalledTimes(ended);
        stop();
      });

      it("finds one that begins in the frame it opens in", () => {
        const { box, anchor, floating } = scrollBox();
        const later = animation(box);
        let present = false;
        Object.defineProperty(document, "getAnimations", {
          configurable: true,
          value: () => (present ? [later] : []),
        });
        const update = vi.fn();
        const stop = autoUpdate(anchor, floating, update, {
          ancestorScroll: false,
          attributes: false,
        });
        update.mockClear();
        present = true;
        runFrame();
        runFrame();
        runFrame();
        expect(update).toHaveBeenCalled();
        stop();
      });

      it("ignores one on another box, one that is paused, and one that only paints", () => {
        const { anchor, floating } = scrollBox();
        const other = document.createElement("div");
        document.body.append(other);
        const painting = animation(anchor);
        painting.transitionProperty = "opacity";
        Object.defineProperty(document, "getAnimations", {
          configurable: true,
          value: () => [
            animation(other),
            animation(anchor.parentElement as Element, "paused"),
            painting,
          ],
        });
        const update = vi.fn();
        const stop = autoUpdate(anchor, floating, update, {
          ancestorScroll: false,
          attributes: false,
        });
        update.mockClear();
        runFrame();
        runFrame();
        expect(update).not.toHaveBeenCalled();
        stop();
      });
    });

    it("updates when an animation on an ancestor ends", () => {
      const { box, anchor, floating } = scrollBox();
      const update = vi.fn();
      const stop = autoUpdate(anchor, floating, update, {
        ancestorScroll: false,
        attributes: false,
      });
      update.mockClear();
      box.dispatchEvent(new Event("animationend", { bubbles: true }));
      runFrame();
      expect(update).toHaveBeenCalledTimes(1);
      stop();
    });
  });

  it("updates in the frame the anchor's or the box's size changes, with no frame between", () => {
    const { anchor, floating } = scrollBox();
    let deliver: (entries: Array<{ target: Element }>) => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: (entries: Array<{ target: Element }>) => void) {
          deliver = callback;
        }
        observe() {}
        unobserve() {}
      },
    );
    const log: string[] = [];
    const stop = autoUpdate(
      anchor,
      floating,
      () => {
        log.push("read");
        return () => log.push("write");
      },
      {
        immediate: false,
        ancestorScroll: false,
        motion: false,
        attributes: false,
      },
    );
    deliver([{ target: floating }]);
    expect(log).toEqual(["read", "write"]);
    stop();
  });

  it("updates when the anchor's style or class changes", async () => {
    const { anchor, floating } = scrollBox();
    const update = vi.fn();
    const stop = autoUpdate(anchor, floating, update, {
      immediate: false,
      ancestorScroll: false,
      motion: false,
      elementResize: false,
    });
    anchor.style.marginLeft = "10px";
    await Promise.resolve();
    runFrame();
    expect(update).toHaveBeenCalledTimes(1);
    anchor.setAttribute("data-other", "x");
    await Promise.resolve();
    runFrame();
    expect(update).toHaveBeenCalledTimes(1);
    stop();
    anchor.className = "moved";
    await Promise.resolve();
    runFrame();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending frame when stopped", () => {
    const { box, anchor, floating } = scrollBox();
    const update = vi.fn();
    const stop = autoUpdate(anchor, floating, update, { immediate: false });
    box.dispatchEvent(new Event("scroll"));
    stop();
    runFrame();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("anchorElement", () => {
  it("is the element, or the context element of a virtual anchor", () => {
    const el = document.createElement("div");
    expect(anchorElement(el)).toBe(el);
    expect(
      anchorElement({
        getBoundingClientRect: () => new DOMRect(),
        contextElement: el,
      }),
    ).toBe(el);
    expect(anchorElement({ getBoundingClientRect: () => new DOMRect() })).toBe(
      null,
    );
  });
});
