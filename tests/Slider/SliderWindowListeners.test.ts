import { fireEvent, render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import Slider from "./Slider.test.svelte";

describe("Slider window listeners", () => {
  it("a drag adds exactly one shared listener per type; releasing removes it", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const containers = Array.from(
      { length: 5 },
      () => render(Slider).container,
    );
    for (const type of ["mousemove", "mouseup"]) {
      expect(netListenerCalls(add, remove, type)).toBe(0);
    }

    const sliderA = containers[0].querySelector(".bx--slider");
    assert(sliderA instanceof HTMLElement);
    await fireEvent.mouseDown(sliderA);
    await flushDismiss();

    expect(netListenerCalls(add, remove, "mousemove")).toBe(1);
    expect(netListenerCalls(add, remove, "touchmove")).toBe(1);
    expect(netListenerCalls(add, remove, "mouseup")).toBe(1);

    // A second concurrent drag still shares the single pooled listener.
    const sliderB = containers[1].querySelector(".bx--slider");
    assert(sliderB instanceof HTMLElement);
    await fireEvent.mouseDown(sliderB);
    await flushDismiss();
    expect(netListenerCalls(add, remove, "mousemove")).toBe(1);

    // Releasing both ends the drag and tears the shared listeners down.
    await fireEvent.mouseUp(window);
    await flushDismiss();
    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(netListenerCalls(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });

  it("move listeners stay passive (scrolling is never blocked)", async () => {
    const add = vi.spyOn(window, "addEventListener");

    const { container } = render(Slider);
    const slider = container.querySelector(".bx--slider");
    assert(slider instanceof HTMLElement);
    await fireEvent.mouseDown(slider);
    await flushDismiss();

    const moveCall = add.mock.calls.find(
      (c: unknown[]) => c[0] === "mousemove",
    );
    assert(moveCall);
    expect(moveCall[2]).toMatchObject({ passive: true });

    add.mockRestore();
  });
});
