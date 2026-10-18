import { render, screen } from "@testing-library/svelte";
import HeaderNavMenuCurrent from "./HeaderNavMenubar.test.svelte";

const compute = { text: "Compute" };
const quantum = { text: "Quantum (beta)" };
const entry = (...items: { text: string }[]) => [{ text: "Products", items }];

const submenu = () =>
  screen.getByRole("menuitem", { name: "Products" }).closest("li");

describe("HeaderNavMenu current marker", () => {
  it("drops the current marker when the selected item unmounts", async () => {
    const { rerender } = render(HeaderNavMenuCurrent, {
      props: { items: entry(compute, quantum), current: quantum.text },
    });
    expect(submenu()).toHaveClass("bx--header__submenu--current");

    await rerender({ items: entry(compute) });
    expect(submenu()).not.toHaveClass("bx--header__submenu--current");
  });
});
