import { createGestures, gesture } from "../../src/utils/gesture.js";
import type {
  GestureHandler,
  GestureOptions,
} from "../../src/utils/gesture.js";
import { pointerDrag } from "../../src/utils/pointer-drag.js";

function pointer(type: string, init: PointerEventInit = {}) {
  return new PointerEvent(type, {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

describe("gesture action", () => {
  let node: HTMLElement;
  let child: HTMLElement;
  let button: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers();
    node = document.createElement("div");
    child = document.createElement("span");
    button = document.createElement("button");
    node.append(child, button);
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
    vi.useRealTimers();
  });

  function mount(options: GestureOptions) {
    return gesture(node, options);
  }

  it("is the same function as createGestures", () => {
    expect(gesture).toBe(createGestures);
  });

  describe("touch-action", () => {
    it("is set from the gestures and restored on destroy", () => {
      node.style.touchAction = "pan-x";
      const action = mount({
        swipe: { axis: "x", onSwipe: vi.fn<GestureHandler>() },
      });
      expect(node.style.touchAction).toBe("pan-y pinch-zoom");
      action.update({ pinch: vi.fn<GestureHandler>() });
      expect(node.style.touchAction).toBe("none");
      action.update({ doubleTap: vi.fn<GestureHandler>() });
      expect(node.style.touchAction).toBe("manipulation");
      action.destroy();
      expect(node.style.touchAction).toBe("pan-x");
    });

    it("can be overridden or left alone, and is released while disabled", () => {
      const action = mount({
        pinch: vi.fn<GestureHandler>(),
        touchAction: "pan-y",
      });
      expect(node.style.touchAction).toBe("pan-y");
      action.update({ pinch: vi.fn<GestureHandler>(), touchAction: false });
      expect(node.style.touchAction).toBe("");
      action.update({ pinch: vi.fn<GestureHandler>(), enabled: false });
      expect(node.style.touchAction).toBe("");
      action.update({ pinch: vi.fn<GestureHandler>() });
      expect(node.style.touchAction).toBe("none");
      action.destroy();
    });

    it("does not grab the page's scroll for a tap", () => {
      const action = mount({ tap: vi.fn<GestureHandler>() });
      expect(node.style.touchAction).toBe("auto");
      action.destroy();
    });
  });

  describe("listeners", () => {
    it("listens for pointerdown only until a press starts", () => {
      const docAdd = vi.spyOn(document, "addEventListener");
      const docRemove = vi.spyOn(document, "removeEventListener");
      const action = mount({ tap: vi.fn<GestureHandler>() });
      expect(docAdd).not.toHaveBeenCalled();

      node.dispatchEvent(pointer("pointerdown"));
      const added = docAdd.mock.calls.map(([type]) => type).sort();
      expect(added).toEqual([
        "keydown",
        "pointercancel",
        "pointermove",
        "pointerup",
      ]);

      document.dispatchEvent(pointer("pointerup"));
      const removed = docRemove.mock.calls.map(([type]) => type).sort();
      expect(removed).toEqual(added);
      action.destroy();
    });

    it("registers no wheel or gesture listeners without a pinch", () => {
      const add = vi.spyOn(node, "addEventListener");
      const action = mount({ tap: vi.fn<GestureHandler>() });
      expect(add.mock.calls.map(([type]) => type)).toEqual(["pointerdown"]);
      action.update({ pinch: vi.fn<GestureHandler>() });
      expect(add.mock.calls.map(([type]) => type)).toEqual([
        "pointerdown",
        "wheel",
        "gesturestart",
        "gesturechange",
        "gestureend",
      ]);
      action.destroy();
    });

    it("removes everything on destroy, even mid-press", () => {
      const onEnd = vi.fn<GestureHandler>();
      const onTap = vi.fn<GestureHandler>();
      const action = mount({
        tap: onTap,
        pan: { onEnd },
        pinch: vi.fn<GestureHandler>(),
      });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 30 }),
      );
      action.destroy();
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true, reason: "disabled" }),
      );
      node.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointerup"));
      expect(onTap).not.toHaveBeenCalled();
      expect(node.style.touchAction).toBe("");
    });
  });

  describe("presses", () => {
    it("taps", () => {
      const onTap = vi.fn<GestureHandler>();
      const action = mount({ tap: onTap });
      node.dispatchEvent(pointer("pointerdown", { clientX: 4, clientY: 4 }));
      document.dispatchEvent(pointer("pointerup", { clientX: 4, clientY: 4 }));
      expect(onTap).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("leaves presses on controls, and presses a child handled, alone", () => {
      const onTap = vi.fn<GestureHandler>();
      const action = mount({ tap: onTap });
      button.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointerup"));

      child.addEventListener("pointerdown", (event) => event.preventDefault());
      child.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointerup"));
      expect(onTap).not.toHaveBeenCalled();

      action.update({ tap: onTap, ignore: "" });
      button.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointerup"));
      expect(onTap).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("ignores a second finger that did not start the press", () => {
      const onTap = vi.fn<GestureHandler>();
      const action = mount({ tap: onTap });
      node.dispatchEvent(
        pointer("pointerdown", { pointerId: 2, isPrimary: false }),
      );
      document.dispatchEvent(
        pointer("pointerup", { pointerId: 2, isPrimary: false }),
      );
      expect(onTap).not.toHaveBeenCalled();
      action.destroy();
    });

    it("cancels the press in progress when disabled", () => {
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 40 }),
      );
      action.update({ pan: { onEnd }, enabled: false });
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true, reason: "disabled" }),
      );
      action.destroy();
    });

    it("drops a press whose release never came, and starts the next", () => {
      const onEnd = vi.fn<GestureHandler>();
      const onTap = vi.fn<GestureHandler>();
      const action = mount({ tap: onTap, pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 40 }),
      );
      // The button was let go outside the window.
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true }),
      );
      document.dispatchEvent(pointer("pointerup", { pointerType: "mouse" }));
      expect(onTap).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("cancels a mouse press when it moves with no button down", () => {
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 40 }),
      );
      document.dispatchEvent(
        pointer("pointermove", {
          pointerType: "mouse",
          clientX: 60,
          buttons: 0,
        }),
      );
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true }),
      );
      action.destroy();
    });

    it("writes touch-action once, not on every update", () => {
      const action = mount({ pinch: vi.fn<GestureHandler>() });
      const set = vi.spyOn(node.style, "touchAction", "set");
      action.update({ pinch: vi.fn<GestureHandler>() });
      action.update({ pinch: vi.fn<GestureHandler>() });
      expect(set).not.toHaveBeenCalled();
      action.destroy();
    });

    it("captures the pointer once a pan starts, not at the press", () => {
      node.setPointerCapture = vi.fn();
      const action = mount({ pan: vi.fn<GestureHandler>() });
      node.dispatchEvent(
        pointer("pointerdown", { pointerType: "mouse", pointerId: 5 }),
      );
      expect(node.setPointerCapture).not.toHaveBeenCalled();
      document.dispatchEvent(
        pointer("pointermove", {
          pointerType: "mouse",
          pointerId: 5,
          clientX: 30,
        }),
      );
      expect(node.setPointerCapture).toHaveBeenCalledWith(5);
      document.dispatchEvent(
        pointer("pointerup", { pointerType: "mouse", pointerId: 5 }),
      );
      action.destroy();
    });
  });

  describe("click after a gesture", () => {
    it("is swallowed once after a pan and not after a tap", () => {
      const onClick = vi.fn();
      node.addEventListener("click", onClick);
      const action = mount({
        tap: vi.fn<GestureHandler>(),
        pan: vi.fn<GestureHandler>(),
      });

      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(pointer("pointerup", { pointerType: "mouse" }));
      node.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      expect(onClick).toHaveBeenCalledTimes(1);

      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 50 }),
      );
      document.dispatchEvent(
        pointer("pointerup", { pointerType: "mouse", clientX: 50 }),
      );
      node.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      expect(onClick).toHaveBeenCalledTimes(1);
      node.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      expect(onClick).toHaveBeenCalledTimes(2);
      action.destroy();
    });

    it("stops being swallowed after a moment, if no click came", () => {
      const onClick = vi.fn();
      node.addEventListener("click", onClick);
      const action = mount({ pan: vi.fn<GestureHandler>() });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 50 }),
      );
      document.dispatchEvent(
        pointer("pointerup", { pointerType: "mouse", clientX: 50 }),
      );
      vi.advanceTimersByTime(100);
      node.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      expect(onClick).toHaveBeenCalledTimes(1);
      action.destroy();
    });
  });

  describe("a held finger", () => {
    it("blocks the context menu, selection and image drag for the press only", () => {
      const action = mount({ longPress: vi.fn<GestureHandler>() });
      const blocked = () =>
        ["contextmenu", "selectstart", "dragstart"].map((type) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          child.dispatchEvent(event);
          return event.defaultPrevented;
        });

      expect(blocked()).toEqual([false, false, false]);
      child.dispatchEvent(pointer("pointerdown"));
      expect(blocked()).toEqual([true, true, true]);
      document.dispatchEvent(pointer("pointerup"));
      expect(blocked()).toEqual([false, false, false]);
      action.destroy();
    });

    it("leaves a mouse's context menu alone", () => {
      const action = mount({ longPress: vi.fn<GestureHandler>() });
      child.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      const event = new Event("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      child.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      document.dispatchEvent(pointer("pointerup", { pointerType: "mouse" }));
      action.destroy();
    });

    it("stops the page scrolling only once a hold may become a pan", () => {
      const action = mount({
        longPress: vi.fn<GestureHandler>(),
        pan: { touch: "afterLongPress", onMove: vi.fn<GestureHandler>() },
      });
      const touchmove = () => {
        const event = new Event("touchmove", {
          bubbles: true,
          cancelable: true,
        });
        child.dispatchEvent(event);
        return event.defaultPrevented;
      };
      child.dispatchEvent(pointer("pointerdown"));
      expect(touchmove()).toBe(false);
      vi.advanceTimersByTime(600);
      expect(touchmove()).toBe(true);
      document.dispatchEvent(pointer("pointerup"));
      expect(touchmove()).toBe(false);
      action.destroy();
    });

    it("hides the iOS callout on the node", () => {
      // jsdom's CSSStyleDeclaration does not know the property.
      const setProperty = vi.spyOn(node.style, "setProperty");
      const action = mount({ longPress: vi.fn<GestureHandler>() });
      expect(setProperty).toHaveBeenCalledWith("-webkit-touch-callout", "none");
      action.destroy();
      expect(setProperty).toHaveBeenLastCalledWith("-webkit-touch-callout", "");
    });

    it("hands a hold to a pan without losing the press", () => {
      const events: string[] = [];
      const action = mount({
        longPress: { onLongPress: () => events.push("hold") },
        pan: {
          touch: "afterLongPress",
          onStart: () => events.push("pan-start"),
          onEnd: () => events.push("pan-end"),
        },
      });
      child.dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 10 }));
      vi.advanceTimersByTime(600);
      document.dispatchEvent(
        pointer("pointermove", { clientX: 10, clientY: 40 }),
      );
      document.dispatchEvent(
        pointer("pointerup", { clientX: 10, clientY: 40 }),
      );
      expect(events).toEqual(["hold", "pan-start", "pan-end"]);
      action.destroy();
    });
  });

  describe("composing with other pointer owners", () => {
    it("stands down when an element inside captures the pointer", () => {
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 30 }),
      );
      // A drag handle with `pointerDrag` calls setPointerCapture on itself,
      // which takes the pointer from this node.
      node.dispatchEvent(
        pointer("lostpointercapture", { pointerType: "mouse" }),
      );
      button.dispatchEvent(
        pointer("gotpointercapture", { pointerType: "mouse" }),
      );
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true, reason: "claimed" }),
      );
      action.destroy();
    });

    it("leaves a press that a pointerDrag on a descendant started", () => {
      const onTap = vi.fn<GestureHandler>();
      const onPan = vi.fn<GestureHandler>();
      const action = mount({ tap: onTap, pan: onPan });
      const drag = pointerDrag(child, {});

      child.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 40 }),
      );
      document.dispatchEvent(
        pointer("pointerup", { pointerType: "mouse", clientX: 40 }),
      );
      expect(onPan).not.toHaveBeenCalled();

      // A drag that declines the press leaves it to the gesture.
      drag.update({ onStart: () => false });
      child.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(pointer("pointerup", { pointerType: "mouse" }));
      expect(onTap).toHaveBeenCalledTimes(1);
      drag.destroy();
      action.destroy();
    });

    it("does not mistake the touch pointer's implicit capture for a rival", () => {
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pan: { onEnd } });
      child.dispatchEvent(pointer("pointerdown"));
      child.dispatchEvent(pointer("gotpointercapture"));
      document.dispatchEvent(pointer("pointermove", { clientX: 30 }));
      expect(onEnd).not.toHaveBeenCalled();
      document.dispatchEvent(pointer("pointerup", { clientX: 30 }));
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: false }),
      );
      action.destroy();
    });

    it("lets cancel() hand the press to a drag engine", () => {
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 30 }),
      );
      action.cancel();
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true, reason: "claimed" }),
      );
      action.destroy();
    });

    it("cancels a pan on Escape and keeps the key from closing a dialog around it", () => {
      const onEnd = vi.fn<GestureHandler>();
      const outer = vi.fn();
      document.body.addEventListener("keydown", outer);
      const action = mount({ pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
      document.dispatchEvent(
        pointer("pointermove", { pointerType: "mouse", clientX: 30 }),
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true, reason: "escape" }),
      );
      expect(outer).not.toHaveBeenCalled();

      // With no gesture to cancel, Escape is not ours.
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      expect(outer).toHaveBeenCalledTimes(1);
      document.body.removeEventListener("keydown", outer);
      action.destroy();
    });

    it("ends the press when the browser cancels the pointer", () => {
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pan: { onEnd } });
      node.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointermove", { clientX: 30 }));
      document.dispatchEvent(pointer("pointercancel", { clientX: 30 }));
      expect(onEnd).toHaveBeenCalledWith(
        expect.objectContaining({ cancelled: true, reason: "cancel" }),
      );
      action.destroy();
    });
  });

  describe("pinch from the wheel and Safari", () => {
    it("zooms on ctrl+wheel and stops the page zooming", () => {
      const onStart = vi.fn<GestureHandler>();
      const onChange = vi.fn<GestureHandler>();
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pinch: { onStart, onChange, onEnd } });
      const wheel = (init: WheelEventInit) => {
        const event = new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          ...init,
        });
        node.dispatchEvent(event);
        return event;
      };

      expect(wheel({ deltaY: -10 }).defaultPrevented).toBe(false);
      expect(onChange).not.toHaveBeenCalled();

      expect(wheel({ deltaY: -10, ctrlKey: true }).defaultPrevented).toBe(true);
      wheel({ deltaY: -10, ctrlKey: true });
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls.at(-1)?.[0].scale).toBeGreaterThan(1.2);
      expect(onChange.mock.calls[0][0].source).toBe("wheel");

      vi.advanceTimersByTime(200);
      expect(onEnd).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("can leave the wheel to the page", () => {
      const onChange = vi.fn<GestureHandler>();
      const action = mount({ pinch: { onChange, wheel: false } });
      const event = new WheelEvent("wheel", {
        ctrlKey: true,
        cancelable: true,
      });
      node.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
      action.destroy();
    });

    it("follows Safari's gesture events when no pointer is down", () => {
      const onChange = vi.fn<GestureHandler>();
      const onEnd = vi.fn<GestureHandler>();
      const action = mount({ pinch: { onChange, onEnd } });
      const gestureEvent = (type: string, scale: number, rotation = 0) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.assign(event, { scale, rotation, clientX: 10, clientY: 20 });
        node.dispatchEvent(event);
        return event;
      };
      expect(gestureEvent("gesturestart", 1).defaultPrevented).toBe(true);
      gestureEvent("gesturechange", 1.5, 90);
      expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
        scale: 1.5,
        source: "gesture",
      });
      expect(onChange.mock.calls.at(-1)?.[0].rotation).toBeCloseTo(Math.PI / 2);
      gestureEvent("gestureend", 1.5);
      expect(onEnd).toHaveBeenCalledTimes(1);

      // iOS fires gesture events beside the touches the arena already has.
      child.dispatchEvent(pointer("pointerdown"));
      const before = onChange.mock.calls.length;
      gestureEvent("gesturechange", 2);
      expect(onChange.mock.calls.length).toBe(before);
      document.dispatchEvent(pointer("pointerup"));
      action.destroy();
    });
  });
});
