import { render } from "@testing-library/svelte";
import Dropdown from "./Dropdown.test.svelte";

const netClick = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === "click").length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === "click").length;

describe("Dropdown window listeners", () => {
  test("closed dropdowns register no window click listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(Dropdown, { props: { open: false } });
    expect(netClick(add, remove)).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an open dropdown registers exactly one window click listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(Dropdown, { props: { open: true } });
    expect(netClick(add, remove)).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
