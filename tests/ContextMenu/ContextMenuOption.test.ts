import { render, screen, waitFor } from "@testing-library/svelte";
import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ContextMenu from "./ContextMenu.test.svelte";
import ContextMenuGroup from "./ContextMenuGroup.test.svelte";
import ContextMenuOptionKeepOpenFixture from "./ContextMenuOption.keepOpen.test.svelte";
import ContextMenuOptionRole from "./ContextMenuOption.role.test.svelte";
import ContextMenuOptionShortcutSlot from "./ContextMenuOption.shortcutSlot.test.svelte";
import ContextMenuOptionSelectableIconBind from "./ContextMenuOptionSelectableIconBind.test.svelte";
import ContextMenuSelection from "./ContextMenuSelection.test.svelte";
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

describe("ContextMenuOption selection state", () => {
  const getSelectedId = () => screen.getByTestId("selected-id").textContent;

  it("registers an initially selected group option into selectedIds", () => {
    render(ContextMenuSelection);

    expect(getSelectedIds()).toEqual(["date"]);
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Date" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Name" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("selects an initially selected radio option", () => {
    render(ContextMenuSelection);

    expect(getSelectedId()).toBe("grid");
    expect(screen.getByRole("menuitemradio", { name: "Grid" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: "List" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("toggles a group checkbox with Space", async () => {
    render(ContextMenuSelection);

    screen.getByRole("menuitemcheckbox", { name: "Name" }).focus();
    await user.keyboard(" ");

    expect(getSelectedIds()).toEqual(["date", "name"]);
  });

  it("selects a radio option with Enter", async () => {
    render(ContextMenuSelection);

    screen.getByRole("menuitemradio", { name: "List" }).focus();
    await user.keyboard("{Enter}");

    expect(getSelectedId()).toBe("list");
    expect(screen.getByRole("menuitemradio", { name: "List" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: "Grid" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("toggles aria-checked on a plain selectable option", async () => {
    render(ContextMenuOptionRole, { props: { selectable: true } });

    const option = screen.getByRole("menuitemcheckbox");
    expect(option).toHaveAttribute("aria-checked", "false");

    await user.click(option);
    expect(option).toHaveAttribute("aria-checked", "true");

    await user.click(option);
    expect(option).toHaveAttribute("aria-checked", "false");
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

  it("renders no `indented` attribute on an indented option", () => {
    render(ContextMenuOptionSelectableIconBind);

    expect(
      screen.getByRole("menuitemcheckbox", { name: "Option 1" }),
    ).not.toHaveAttribute("indented");
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

  it("keeps the submenu open when a radio click is prevented", async () => {
    render(ContextMenuOptionKeepOpenFixture, {
      props: { open: true, x: 100, y: 100 },
    });

    const viewAs = screen.getByRole("menuitem", { name: "View as" });
    await user.hover(viewAs);
    // The flyout opens after the hover delay; selecting before then can't
    // tell a kept-open flyout from one that never opened.
    await waitFor(() =>
      expect(viewAs).toHaveAttribute("aria-expanded", "true"),
    );
    await user.click(screen.getByRole("menuitemradio", { name: "Grid" }));

    expect(getSelectedId()).toBe("grid");
    expect(viewAs).toHaveAttribute("aria-expanded", "true");
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

describe("ContextMenuOption shortcut slots", () => {
  it.each([
    ["New", "New shortcut"],
    ["Old", "Old shortcut"],
  ])("renders the %s option's shortcut slot", (label, text) => {
    render(ContextMenuOptionShortcutSlot);

    const option = screen.getByRole("menuitem", { name: new RegExp(label) });
    expect(option).toHaveTextContent(text);
    expect(option).not.toHaveTextContent("Ignored");
    expect(screen.getByText(text).parentElement).toHaveClass(
      "bx--menu-option__info",
    );
  });

  it("prefers the shortcutChildren slot over the shortcutText slot", () => {
    render(ContextMenuOptionShortcutSlot);

    expect(screen.getByText("Both new")).toBeInTheDocument();
    expect(screen.queryByText("Both old")).toBeNull();
  });
});
