import { sheetTouch } from "../../src/utils/bottom-sheet-touch.js";

function touch(
  node: HTMLElement,
  type: "touchstart" | "touchmove" | "touchend",
  points: { x: number; y: number }[],
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value: points.map((p) => ({ clientX: p.x, clientY: p.y })),
  });
  node.dispatchEvent(event);
  return event;
}

describe("sheetTouch", () => {
  let node: HTMLElement;
  let atMax: boolean;
  const calls: string[] = [];
  const handlers = () => ({
    atMax: () => atMax,
    onStart: () => calls.push("start"),
    onMove: (travel: number) => calls.push(`move:${travel}`),
    onEnd: () => calls.push("end"),
  });

  beforeEach(() => {
    node = document.createElement("div");
    document.body.append(node);
    atMax = true;
    calls.length = 0;
  });

  afterEach(() => node.remove());

  it("cancels the first move and follows the finger when the sheet is below its tallest snap point", () => {
    atMax = false;
    sheetTouch(node, handlers());
    touch(node, "touchstart", [{ x: 10, y: 100 }]);
    const first = touch(node, "touchmove", [{ x: 10, y: 90 }]);
    touch(node, "touchmove", [{ x: 10, y: 60 }]);
    touch(node, "touchend", []);
    expect(first.defaultPrevented).toBe(true);
    expect(calls).toEqual(["start", "move:0", "move:-30", "end"]);
  });

  it("leaves an upward drag at the tallest snap point to the content", () => {
    sheetTouch(node, handlers());
    touch(node, "touchstart", [{ x: 10, y: 100 }]);
    const move = touch(node, "touchmove", [{ x: 10, y: 80 }]);
    touch(node, "touchend", []);
    expect(move.defaultPrevented).toBe(false);
    expect(calls).toEqual([]);
  });

  it("hands a scroll that reaches the top to the sheet, without cancelling it", () => {
    node.scrollTop = 0;
    sheetTouch(node, handlers());
    // The scroll starts with content above (a stubbed `scrollTop`).
    let top = 50;
    Object.defineProperty(node, "scrollTop", { get: () => top });
    touch(node, "touchstart", [{ x: 10, y: 100 }]);
    touch(node, "touchmove", [{ x: 10, y: 120 }]);
    expect(calls).toEqual([]);
    top = 0;
    touch(node, "touchmove", [{ x: 10, y: 140 }]);
    touch(node, "touchmove", [{ x: 10, y: 170 }]);
    touch(node, "touchend", []);
    // The claim is from where the finger was when the content ran out.
    expect(calls).toEqual(["start", "move:20", "move:50", "end"]);
  });

  it("ignores a second finger, and a disabled action", () => {
    atMax = false;
    const action = sheetTouch(node, handlers());
    touch(node, "touchstart", [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
    touch(node, "touchmove", [{ x: 0, y: 50 }]);
    expect(calls).toEqual([]);
    action.update({ ...handlers(), enabled: false });
    touch(node, "touchstart", [{ x: 0, y: 0 }]);
    touch(node, "touchmove", [{ x: 0, y: 50 }]);
    expect(calls).toEqual([]);
  });

  it("ends a claimed gesture when it is disabled or destroyed", () => {
    atMax = false;
    const action = sheetTouch(node, handlers());
    touch(node, "touchstart", [{ x: 0, y: 100 }]);
    touch(node, "touchmove", [{ x: 0, y: 130 }]);
    action.update({ ...handlers(), enabled: false });
    expect(calls.at(-1)).toBe("end");
  });
});
