import { trackPointerDrag } from "../../src/utils/pointer-drag.js";

function pointer(
  node: Element,
  type: string,
  x: number,
  y: number,
  button = 0,
) {
  node.dispatchEvent(
    new MouseEvent(type, {
      clientX: x,
      clientY: y,
      button,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe("trackPointerDrag", () => {
  test("starts past the threshold, reports scaled deltas, and ends on release", () => {
    const node = document.createElement("div");
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    trackPointerDrag(node, {
      threshold: 4,
      scale: () => 2,
      onStart,
      onMove,
      onEnd,
    });

    pointer(node, "pointerdown", 0, 0);
    pointer(node, "pointermove", 2, 2);
    expect(onStart).not.toHaveBeenCalled();
    pointer(node, "pointermove", 10, 6);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenLastCalledWith(5, 3, expect.anything());
    pointer(node, "pointermove", 12, 6);
    expect(onMove).toHaveBeenLastCalledWith(1, 0, expect.anything());
    pointer(node, "pointerup", 12, 6);
    expect(onEnd).toHaveBeenCalledTimes(1);
    // A click that never moved is not a drag.
    pointer(node, "pointerdown", 0, 0);
    pointer(node, "pointerup", 0, 0);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("ignores other buttons and presses the caller declines, and stops when told", () => {
    const node = document.createElement("div");
    const onMove = vi.fn();
    const stop = trackPointerDrag(node, {
      buttons: [0],
      accept: (event) => (event.target as Element).tagName !== "BUTTON",
      onMove,
    });
    pointer(node, "pointerdown", 0, 0, 2);
    pointer(node, "pointermove", 50, 50, 2);
    expect(onMove).not.toHaveBeenCalled();
    const button = document.createElement("button");
    node.appendChild(button);
    pointer(button, "pointerdown", 0, 0);
    pointer(button, "pointermove", 50, 50);
    expect(onMove).not.toHaveBeenCalled();
    stop();
    pointer(node, "pointerdown", 0, 0);
    pointer(node, "pointermove", 50, 50);
    expect(onMove).not.toHaveBeenCalled();
  });
});
