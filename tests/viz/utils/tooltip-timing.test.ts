import { get } from "svelte/store";
import { createTooltipTiming } from "../../../src/viz/utils/tooltip-timing.js";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("createTooltipTiming", () => {
  test("waits for a pointer to settle, shows at once from the keyboard, then follows", async () => {
    const timing = createTooltipTiming(20, { warm: 0 });
    timing.settle({ id: "a" }, "pointer");
    expect(get(timing.shown)).toBe(false);
    timing.settle({ id: "b" }, "pointer");
    await wait(40);
    expect(get(timing.shown)).toBe(true);
    timing.settle({ id: "c" }, "pointer");
    expect(get(timing.shown)).toBe(true);
    timing.settle(null);
    expect(get(timing.shown)).toBe(false);
    timing.settle({ id: "d" }, "keyboard");
    expect(get(timing.shown)).toBe(true);
    timing.destroy();
  });

  test("a pointer that leaves before the delay never shows", async () => {
    const timing = createTooltipTiming(20, { warm: 0 });
    const onHide = vi.fn();
    const withHide = createTooltipTiming(20, { warm: 0, onHide });
    timing.settle({ id: "a" }, "pointer");
    timing.settle(null);
    await wait(40);
    expect(get(timing.shown)).toBe(false);
    withHide.settle({ id: "a" }, "pointer");
    withHide.leave();
    expect(onHide).toHaveBeenCalledTimes(1);
    await wait(40);
    expect(get(withHide.shown)).toBe(false);
    timing.destroy();
    withHide.destroy();
  });

  test("leaving keeps a shown tooltip for a moment, so the next item swaps without a flicker", async () => {
    const onHide = vi.fn();
    const timing = createTooltipTiming(0, { leaveDelay: 30, warm: 0, onHide });
    timing.settle({ id: "a" }, "pointer");
    expect(get(timing.shown)).toBe(true);
    // Across the gap: still shown, then the next item takes over at once.
    timing.leave();
    expect(get(timing.shown)).toBe(true);
    await wait(10);
    timing.settle({ id: "b" }, "pointer");
    expect(get(timing.shown)).toBe(true);
    await wait(40);
    expect(get(timing.shown)).toBe(true);
    expect(onHide).not.toHaveBeenCalled();
    // Away for good: hidden after the grace, and the chart hears it once.
    timing.leave();
    timing.leave();
    await wait(50);
    expect(get(timing.shown)).toBe(false);
    expect(onHide).toHaveBeenCalledTimes(1);
    timing.destroy();
  });

  test("a pointer back soon after hiding shows at once, later it waits again", async () => {
    const timing = createTooltipTiming(20, { leaveDelay: 0, warm: 60 });
    timing.settle({ id: "a" }, "pointer");
    await wait(40);
    expect(get(timing.shown)).toBe(true);
    timing.leave();
    await wait(10);
    expect(get(timing.shown)).toBe(false);
    timing.settle({ id: "b" }, "pointer");
    expect(get(timing.shown)).toBe(true);
    timing.leave();
    await wait(80);
    timing.settle({ id: "c" }, "pointer");
    expect(get(timing.shown)).toBe(false);
    await wait(40);
    expect(get(timing.shown)).toBe(true);
    timing.destroy();
  });

  test("a tap shows at once, a click pins, and a press outside releases", () => {
    const onUnpin = vi.fn();
    const timing = createTooltipTiming(20, { onUnpin });
    const node = document.createElement("div");
    document.body.append(node);
    const action = timing.track(node);
    node.dispatchEvent(
      new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }),
    );
    timing.settle({ id: "a" });
    expect(get(timing.shown)).toBe(true);
    timing.pin();
    expect(get(timing.pinned)).toBe(true);
    timing.settle(null);
    expect(get(timing.shown)).toBe(true);
    timing.leave();
    expect(get(timing.shown)).toBe(true);
    timing.settle({ id: "b" }, "pointer");
    expect(get(timing.shown)).toBe(true);
    timing.togglePin();
    timing.togglePin();
    expect(get(timing.pinned)).toBe(true);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(get(timing.pinned)).toBe(false);
    expect(onUnpin).toHaveBeenCalledTimes(1);
    timing.settle(null);
    expect(get(timing.shown)).toBe(false);
    action.destroy();
    node.remove();
  });
});
