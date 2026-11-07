import { fireEvent, render, screen } from "@testing-library/svelte";
import FocusNav from "./FocusNav.test.svelte";

describe("focusNav in a component", () => {
  it("gives the first enabled button the tab stop and moves it with the arrows", async () => {
    render(FocusNav);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
      "-1",
      "-1",
    ]);

    buttons[0].focus();
    await fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    // Copy and Paste are disabled: the cursor lands on Delete.
    expect(document.activeElement).toBe(buttons[3]);
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual([
      "-1",
      "-1",
      "-1",
      "0",
      "-1",
    ]);
  });

  it("swaps the arrows in RTL", async () => {
    render(FocusNav, { props: { rtl: true } });
    const buttons = screen.getAllByRole("button");
    buttons[3].focus();
    await fireEvent.keyDown(buttons[3], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("points aria-activedescendant at the option and keeps focus on the list", async () => {
    render(FocusNav, { props: { mode: "activedescendant" } });
    const list = screen.getByRole("listbox");
    list.focus();
    await fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(list).toHaveAttribute("aria-activedescendant", "opt-0");
    expect(document.activeElement).toBe(list);
    await fireEvent.keyDown(list, { key: "ArrowDown" });
    // Copy and Paste are aria-disabled.
    expect(list).toHaveAttribute("aria-activedescendant", "opt-3");
    expect(screen.getByRole("option", { name: "Delete" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("jumps by typeahead", async () => {
    render(FocusNav, { props: { mode: "activedescendant" } });
    const list = screen.getByRole("listbox");
    list.focus();
    await fireEvent.keyDown(list, { key: "s" });
    expect(list).toHaveAttribute("aria-activedescendant", "opt-4");
  });
});
