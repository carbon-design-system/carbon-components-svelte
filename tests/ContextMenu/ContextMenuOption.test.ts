import { render, screen } from "@testing-library/svelte";
import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ContextMenu from "./ContextMenu.test.svelte";
import ContextMenuGroup from "./ContextMenuGroup.test.svelte";
import ContextMenuOptionKeepOpenFixture from "./ContextMenuOption.keepOpen.test.svelte";
import ContextMenuOptionSelectableIconBind from "./ContextMenuOptionSelectableIconBind.test.svelte";
import { getSelectedIds } from "./helpers";

describe("ContextMenuGroup", () => {
  it("should toggle option when clicking option that is already selected", async () => {
    render(ContextMenuGroup, {
      props: { selectedIds: ["option1", "option2"] },
    });

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    const selectedIds = getSelectedIds();
    expect(selectedIds).not.toContain("option1");
    expect(selectedIds).toContain("option2");
    expect(selectedIds).toHaveLength(1);
  });

  it("should add multiple options when clicking different options", async () => {
    render(ContextMenuGroup, { props: { selectedIds: [] } });

    const option1 = screen.getByText("Option 1");
    const option2 = screen.getByText("Option 2");
    const option3 = screen.getByText("Option 3");

    await user.click(option1);
    await user.click(option2);
    await user.click(option3);

    const selectedIds = getSelectedIds();
    expect(selectedIds).toContain("option1");
    expect(selectedIds).toContain("option2");
    expect(selectedIds).toContain("option3");
    expect(selectedIds).toHaveLength(3);
  });
});

// Regression test: a selectable/radio ContextMenuOption used to write
// `icon = Checkmark` / `indented = true` back into the exported props,
// clobbering a consumer's `bind:icon` / `bind:indented`.
describe("ContextMenuOption does not clobber bound icon and indented props in a selectable group", () => {
  it("keeps the consumer's bound icon and indented unchanged while rendering the checkmark", async () => {
    const { component } = render(ContextMenuOptionSelectableIconBind, {
      props: { indented: false },
    });

    await tick();

    expect(component.icon).toBe(CopyFile);
    expect(component.indented).toBe(false);

    const option = screen.getByRole("menuitemcheckbox", { name: "Option 1" });
    expect(option.querySelector(".bx--menu-option__icon")).toBeInTheDocument();
  });
});

describe("ContextMenuOption keep open on selection", () => {
  const getSelectedId = () => screen.getByTestId("selected-id").textContent;

  it("keeps the menu open when click is prevented and still toggles selection", async () => {
    render(ContextMenuOptionKeepOpenFixture, {
      props: { open: true, x: 100, y: 100 },
    });

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Date" }));

    expect(screen.getAllByRole("menu")[0]).toHaveClass("bx--menu--open");
    expect(getSelectedIds()).toEqual(["date"]);
  });

  it("keeps nested and root menus open when a radio click is prevented", async () => {
    render(ContextMenuOptionKeepOpenFixture, {
      props: { open: true, x: 100, y: 100 },
    });

    await user.hover(screen.getByRole("menuitem", { name: "View as" }));
    const gridOption = await screen.findByRole("menuitemradio", {
      name: "Grid",
    });
    await user.click(gridOption);

    expect(getSelectedId()).toBe("grid");

    const menus = screen.getAllByRole("menu");
    for (const menu of menus) {
      expect(menu).toHaveClass("bx--menu--open");
    }
  });
});

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
    // parent option's own right edge.
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
