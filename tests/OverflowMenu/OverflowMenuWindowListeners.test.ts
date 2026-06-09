import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import OverflowMenu from "./OverflowMenu.test.svelte";

describe("OverflowMenu window listeners", () => {
  function netClickListeners(
    addSpy: ReturnType<typeof vi.spyOn>,
    removeSpy: ReturnType<typeof vi.spyOn>,
  ) {
    const adds = addSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === "click",
    ).length;
    const removes = removeSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === "click",
    ).length;
    return adds - removes;
  }

  test("rendering many closed menus adds no window click listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 1000; i++) {
      render(OverflowMenu, { props: { id: `menu-${i}` } });
    }

    expect(netClickListeners(addSpy, removeSpy)).toBe(0);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  }, 30_000);

  test("opening adds one window click listener, closing removes it", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) {
      render(OverflowMenu, { props: { id: `menu-${i}` } });
    }
    expect(netClickListeners(addSpy, removeSpy)).toBe(0);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(netClickListeners(addSpy, removeSpy)).toBe(1);

    await user.keyboard("{Escape}");
    expect(netClickListeners(addSpy, removeSpy)).toBe(0);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
