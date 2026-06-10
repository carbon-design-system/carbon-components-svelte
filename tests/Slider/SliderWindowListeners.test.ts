import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import Slider from "./Slider.test.svelte";

const net = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === type).length;

describe("Slider window listeners", () => {
  test("idle sliders register no drag listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(Slider);

    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(net(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });

  test("a drag adds exactly one shared listener per type; releasing removes it", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const containers = Array.from(
      { length: 5 },
      () => render(Slider).container,
    );
    for (const type of ["mousemove", "mouseup"]) {
      expect(net(add, remove, type)).toBe(0);
    }

    // Begin a drag on one slider.
    const sliderA = containers[0].querySelector(".bx--slider");
    assert(sliderA instanceof HTMLElement);
    await fireEvent.mouseDown(sliderA);
    await tick();

    expect(net(add, remove, "mousemove")).toBe(1);
    expect(net(add, remove, "touchmove")).toBe(1);
    expect(net(add, remove, "mouseup")).toBe(1);

    // A second concurrent drag still shares the single pooled listener.
    const sliderB = containers[1].querySelector(".bx--slider");
    assert(sliderB instanceof HTMLElement);
    await fireEvent.mouseDown(sliderB);
    await tick();
    expect(net(add, remove, "mousemove")).toBe(1);

    // Releasing both ends the drag and tears the shared listeners down.
    await fireEvent.mouseUp(window);
    await tick();
    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(net(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });

  test("move listeners stay passive (scrolling is never blocked)", async () => {
    const add = vi.spyOn(window, "addEventListener");

    const { container } = render(Slider);
    const slider = container.querySelector(".bx--slider");
    assert(slider instanceof HTMLElement);
    await fireEvent.mouseDown(slider);
    await tick();

    const moveCall = add.mock.calls.find(
      (c: unknown[]) => c[0] === "mousemove",
    );
    assert(moveCall);
    expect(moveCall[2]).toMatchObject({ passive: true });

    add.mockRestore();
  });
});
