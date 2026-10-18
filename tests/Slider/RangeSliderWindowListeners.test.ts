import { fireEvent, render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import RangeSlider from "./RangeSlider.test.svelte";

describe("RangeSlider window listeners", () => {
  it("idle range sliders register no drag listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(RangeSlider);

    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(netListenerCalls(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });

  it("a drag adds exactly one shared listener per type; releasing removes it", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { container } = render(RangeSlider);
    expect(netListenerCalls(add, remove, "mousemove")).toBe(0);

    const slider = container.querySelector(".bx--slider");
    assert(slider instanceof HTMLElement);
    await fireEvent.mouseDown(slider);
    await flushDismiss();

    expect(netListenerCalls(add, remove, "mousemove")).toBe(1);
    expect(netListenerCalls(add, remove, "touchmove")).toBe(1);
    expect(netListenerCalls(add, remove, "mouseup")).toBe(1);

    await fireEvent.mouseUp(window);
    await flushDismiss();
    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(netListenerCalls(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });
});
