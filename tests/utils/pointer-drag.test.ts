import { pointerDrag } from "../../src/utils/pointer-drag.js";

function pointer(type: string, init: PointerEventInit = {}) {
  return new PointerEvent(type, {
    pointerId: 1,
    button: 0,
    bubbles: true,
    ...init,
  });
}

describe("pointerDrag", () => {
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
  });

  it("calls onStart, onMove, and onEnd for one drag", () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const action = pointerDrag(node, { onStart, onMove, onEnd });

    node.dispatchEvent(pointer("pointermove"));
    expect(onMove).not.toHaveBeenCalled();

    node.dispatchEvent(pointer("pointerdown"));
    node.dispatchEvent(pointer("pointermove"));
    node.dispatchEvent(pointer("pointerup"));
    node.dispatchEvent(pointer("lostpointercapture"));
    node.dispatchEvent(pointer("pointermove"));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0].type).toBe("pointerup");

    action.destroy();
  });

  it("captures the pointer when supported", () => {
    const setPointerCapture = vi.fn();
    node.setPointerCapture = setPointerCapture;
    const action = pointerDrag(node, {});

    node.dispatchEvent(pointer("pointerdown", { pointerId: 7 }));

    expect(setPointerCapture).toHaveBeenCalledWith(7);
    action.destroy();
  });

  it.each(["pointercancel", "lostpointercapture"])(
    "ends the drag on %s",
    (type) => {
      const onEnd = vi.fn();
      const action = pointerDrag(node, { onEnd });

      node.dispatchEvent(pointer("pointerdown"));
      node.dispatchEvent(pointer(type));

      expect(onEnd).toHaveBeenCalledTimes(1);
      action.destroy();
    },
  );

  it("ignores secondary buttons", () => {
    const onStart = vi.fn();
    const action = pointerDrag(node, { onStart });

    node.dispatchEvent(pointer("pointerdown", { button: 2 }));

    expect(onStart).not.toHaveBeenCalled();
    action.destroy();
  });

  it("ignores a second pointer while one is active", () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const action = pointerDrag(node, { onStart, onMove, onEnd });

    node.dispatchEvent(pointer("pointerdown", { pointerId: 1 }));
    node.dispatchEvent(pointer("pointerdown", { pointerId: 2 }));
    node.dispatchEvent(pointer("pointermove", { pointerId: 2 }));
    node.dispatchEvent(pointer("pointerup", { pointerId: 2 }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    action.destroy();
  });

  it("does not start when onStart returns false", () => {
    const onMove = vi.fn();
    const action = pointerDrag(node, { onStart: () => false, onMove });

    node.dispatchEvent(pointer("pointerdown"));
    node.dispatchEvent(pointer("pointermove"));

    expect(onMove).not.toHaveBeenCalled();
    action.destroy();
  });

  it("does not start while disabled, and picks up updated handlers", () => {
    const onStart = vi.fn();
    const action = pointerDrag(node, { enabled: false, onStart });

    node.dispatchEvent(pointer("pointerdown"));
    expect(onStart).not.toHaveBeenCalled();

    action.update({ enabled: true, onStart });
    node.dispatchEvent(pointer("pointerdown"));
    expect(onStart).toHaveBeenCalledTimes(1);
    action.destroy();
  });

  it("keeps dragging when a descendant loses its implicit touch capture", () => {
    const child = document.createElement("span");
    node.appendChild(child);
    const onEnd = vi.fn();
    const action = pointerDrag(node, { onEnd });

    child.dispatchEvent(pointer("pointerdown"));
    child.dispatchEvent(pointer("lostpointercapture"));
    expect(onEnd).not.toHaveBeenCalled();

    node.dispatchEvent(pointer("lostpointercapture"));
    expect(onEnd).toHaveBeenCalledTimes(1);
    action.destroy();
  });

  it("listens for moves only while a drag is active", () => {
    const add = vi.spyOn(node, "addEventListener");
    const remove = vi.spyOn(node, "removeEventListener");
    const action = pointerDrag(node, {});
    expect(add.mock.calls.map(([type]) => type)).toEqual(["pointerdown"]);

    node.dispatchEvent(pointer("pointerdown"));
    expect(add.mock.calls.map(([type]) => type)).toContain("pointermove");

    node.dispatchEvent(pointer("pointerup"));
    expect(remove.mock.calls.map(([type]) => type)).toContain("pointermove");
    action.destroy();
  });

  it("removes its listeners on destroy", () => {
    const onStart = vi.fn();
    const action = pointerDrag(node, { onStart });
    action.destroy();

    node.dispatchEvent(pointer("pointerdown"));

    expect(onStart).not.toHaveBeenCalled();
  });

  describe('capture: "drag"', () => {
    let link: HTMLAnchorElement;
    let setPointerCapture: ReturnType<
      typeof vi.fn<HTMLElement["setPointerCapture"]>
    >;

    // A finished drag holds a click swallower until the next task.
    afterEach(() => new Promise((resolve) => setTimeout(resolve, 0)));

    beforeEach(() => {
      link = document.createElement("a");
      link.href = "#target";
      node.appendChild(link);
      setPointerCapture = vi.fn<HTMLElement["setPointerCapture"]>();
      node.setPointerCapture = setPointerCapture;
    });

    it("captures only after the pointer passes the threshold", () => {
      const onDragStart = vi.fn();
      const onMove = vi.fn();
      const onEnd = vi.fn();
      const action = pointerDrag(node, {
        capture: "drag",
        threshold: 6,
        onDragStart,
        onMove,
        onEnd,
      });

      link.dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 10 }));
      link.dispatchEvent(pointer("pointermove", { clientX: 14, clientY: 10 }));
      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onMove).not.toHaveBeenCalled();

      link.dispatchEvent(pointer("pointermove", { clientX: 17, clientY: 10 }));
      expect(setPointerCapture).toHaveBeenCalledWith(1);
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledTimes(1);

      node.dispatchEvent(pointer("pointermove", { clientX: 30 }));
      node.dispatchEvent(pointer("pointerup", { clientX: 30 }));
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledTimes(2);
      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(onEnd.mock.calls[0][1]).toBe(true);
      action.destroy();
    });

    it("ends a press under the threshold as a click, not a drag", () => {
      const onMove = vi.fn();
      const onEnd = vi.fn();
      const onClick = vi.fn((event: Event) => event.preventDefault());
      link.addEventListener("click", onClick);
      const action = pointerDrag(node, { capture: "drag", onMove, onEnd });

      link.dispatchEvent(pointer("pointerdown", {}));
      link.dispatchEvent(pointer("pointermove", { clientX: 2 }));
      link.dispatchEvent(pointer("pointerup", { bubbles: true }));
      link.click();

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(onMove).not.toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(onEnd.mock.calls[0][1]).toBe(false);
      expect(onClick).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("tracks a pointer that leaves the node before it is captured", () => {
      const onDragStart = vi.fn();
      const action = pointerDrag(node, { capture: "drag", onDragStart });

      node.dispatchEvent(pointer("pointerdown"));
      document.body.dispatchEvent(pointer("pointermove", { clientX: 40 }));

      expect(onDragStart).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("swallows the click that follows a drag, once", () => {
      vi.useFakeTimers();
      const onClick = vi.fn();
      link.addEventListener("click", onClick);
      node.addEventListener("click", onClick);
      const action = pointerDrag(node, { capture: "drag" });

      link.dispatchEvent(pointer("pointerdown", { bubbles: true }));
      node.dispatchEvent(pointer("pointermove", { clientX: 20 }));
      node.dispatchEvent(pointer("pointerup", { clientX: 20 }));
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onClick).not.toHaveBeenCalled();

      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onClick).toHaveBeenCalledTimes(1);

      // A drag released over nothing has no click to swallow, so the next
      // real click must not be eaten.
      link.dispatchEvent(pointer("pointerdown", { bubbles: true }));
      node.dispatchEvent(pointer("pointermove", { clientX: 20 }));
      node.dispatchEvent(pointer("pointerup", { clientX: 20 }));
      vi.runAllTimers();
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onClick).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
      action.destroy();
    });

    it("does not swallow the click after a cancelled drag", () => {
      const onClick = vi.fn();
      node.addEventListener("click", onClick);
      const action = pointerDrag(node, { capture: "drag" });

      node.dispatchEvent(pointer("pointerdown"));
      node.dispatchEvent(pointer("pointermove", { clientX: 20 }));
      node.dispatchEvent(pointer("pointercancel"));
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onClick).toHaveBeenCalledTimes(1);
      action.destroy();
    });

    it("turns off the browser's own drag and drop while the press is down", () => {
      const action = pointerDrag(node, { capture: "drag" });
      const nativeDrag = () =>
        new Event("dragstart", { bubbles: true, cancelable: true });

      const before = nativeDrag();
      link.dispatchEvent(before);
      expect(before.defaultPrevented).toBe(false);

      link.dispatchEvent(pointer("pointerdown"));
      const during = nativeDrag();
      link.dispatchEvent(during);
      expect(during.defaultPrevented).toBe(true);

      link.dispatchEvent(pointer("pointerup"));
      const after = nativeDrag();
      link.dispatchEvent(after);
      expect(after.defaultPrevented).toBe(false);
      action.destroy();
    });

    it("removes its document listeners on destroy", () => {
      const onDragStart = vi.fn();
      const action = pointerDrag(node, { capture: "drag", onDragStart });

      node.dispatchEvent(pointer("pointerdown"));
      action.destroy();
      document.body.dispatchEvent(pointer("pointermove", { clientX: 40 }));

      expect(onDragStart).not.toHaveBeenCalled();
    });
  });

  it('calls onDragStart on press when capture is "press"', () => {
    const onDragStart = vi.fn();
    const action = pointerDrag(node, { onDragStart });

    node.dispatchEvent(pointer("pointerdown"));

    expect(onDragStart).toHaveBeenCalledTimes(1);
    action.destroy();
  });
});
