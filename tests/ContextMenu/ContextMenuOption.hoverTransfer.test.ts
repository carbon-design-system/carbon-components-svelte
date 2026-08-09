import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContextMenu from "./ContextMenu.test.svelte";

/**
 * Regression coverage for the safe-triangle hover-transfer check that used
 * to run in ContextMenuOption. Its submenu is positioned flush against the
 * parent option (zero horizontal gap) in real usage, which made the
 * triangle math degenerate: anchor/floating edges coincide, the containment
 * check's denominator is exactly 0, and every point (including ones inside
 * the visual "gap") evaluated to NaN comparisons, i.e. always `false`. The
 * check has been removed; hover transfer instead relies on `mouseenter` /
 * `mouseleave` alone, which already covers the flush-adjacent case because
 * the submenu <ul> is rendered as a DOM descendant of the parent <li> (not
 * portaled) - moving the pointer onto it never fires `mouseleave` on the
 * parent to begin with.
 */
describe("ContextMenuOption hover transfer to a flush submenu", () => {
  const HOVER_DELAY = 150;
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it("positions the submenu with zero horizontal gap from the parent option", async () => {
    render(ContextMenu, {
      props: { open: true, withSubmenu: true, x: 100, y: 100 },
    });

    const triggerText = screen.getByText("Option with submenu");
    const trigger = triggerText.closest("li");
    assert(trigger);

    // Mirrors what a real rendered `<li>` reports: it spans the full width
    // of its containing `<ul>` (no horizontal padding on `.bx--menu`), so
    // its right edge coincides with the parent menu's right edge.
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      left: 100,
      right: 300,
      top: 100,
      bottom: 140,
      width: 200,
      height: 40,
      x: 100,
      y: 100,
      toJSON() {},
    });

    await user.hover(triggerText);
    await wait(HOVER_DELAY);

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);

    // ContextMenuOption computes `x = rootMenuPosition[0] + width`, i.e. the
    // parent option's own right edge - the same value plugged into
    // `isInSafeTriangle` as both the anchor's and floating element's edge.
    const submenuLeft = Number.parseInt(submenu.style.left, 10);
    expect(submenuLeft).toBe(trigger.getBoundingClientRect().right);
  });

  it("keeps the submenu open when the pointer moves onto a submenu option", async () => {
    render(ContextMenu, {
      props: { open: true, withSubmenu: true, x: 100, y: 100 },
    });

    const triggerText = screen.getByText("Option with submenu");
    const trigger = triggerText.closest("li");
    assert(trigger);

    await user.hover(triggerText);
    await wait(HOVER_DELAY);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The submenu option is a DOM descendant of `trigger`, so moving the
    // pointer onto it does not fire `mouseleave` on `trigger` - the same
    // way it wouldn't in a real browser.
    await user.hover(screen.getByText("Submenu option 1"));
    await wait(HOVER_DELAY);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the submenu after the hover delay when the pointer leaves for good", async () => {
    render(ContextMenu, {
      props: { open: true, withSubmenu: true, x: 100, y: 100 },
    });

    const triggerText = screen.getByText("Option with submenu");
    const trigger = triggerText.closest("li");
    assert(trigger);

    await user.hover(triggerText);
    await wait(HOVER_DELAY);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.hover(screen.getByText("Option 1"));
    await wait(HOVER_DELAY);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
