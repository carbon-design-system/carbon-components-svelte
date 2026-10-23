import { get } from "svelte/store";
import { createTooltipTiming } from "../../../src/viz/utils/tooltip-timing.js";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("createTooltipTiming", () => {
  test("waits for a pointer to settle, shows at once from the keyboard, then follows", async () => {
    const timing = createTooltipTiming(20);
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

  test("does not show when the pointer left before the delay", async () => {
    const timing = createTooltipTiming(20);
    timing.settle({ id: "a" }, "pointer");
    timing.settle(null);
    await wait(40);
    expect(get(timing.shown)).toBe(false);
  });

  test("track reads the last input on the node", async () => {
    const timing = createTooltipTiming(20);
    const node = document.createElement("div");
    const action = timing.track(node);
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    timing.settle({ id: "a" });
    expect(get(timing.shown)).toBe(true);
    timing.settle(null);
    node.dispatchEvent(new PointerEvent("pointermove"));
    timing.settle({ id: "b" });
    expect(get(timing.shown)).toBe(false);
    action.destroy();
    await wait(40);
    expect(get(timing.shown)).toBe(false);
  });
});
