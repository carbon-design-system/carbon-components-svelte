import { pointerDrag } from "../../src/utils/pointer-drag.js";

function pointer(type: string, init: PointerEventInit = {}) {
  return new PointerEvent(type, { pointerId: 1, button: 0, ...init });
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
});
