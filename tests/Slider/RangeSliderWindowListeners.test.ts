import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import RangeSlider from "./RangeSlider.test.svelte";

const net = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === type).length;

describe("RangeSlider window listeners", () => {
  test("idle range sliders register no drag listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(RangeSlider);

    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(net(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });

  test("a drag adds exactly one shared listener per type; releasing removes it", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { container } = render(RangeSlider);
    expect(net(add, remove, "mousemove")).toBe(0);

    const slider = container.querySelector(".bx--slider");
    assert(slider instanceof HTMLElement);
    await fireEvent.mouseDown(slider);
    await tick();

    expect(net(add, remove, "mousemove")).toBe(1);
    expect(net(add, remove, "touchmove")).toBe(1);
    expect(net(add, remove, "mouseup")).toBe(1);

    await fireEvent.mouseUp(window);
    await tick();
    for (const type of ["mousemove", "touchmove", "mouseup", "touchend"]) {
      expect(net(add, remove, type)).toBe(0);
    }

    add.mockRestore();
    remove.mockRestore();
  });
});
