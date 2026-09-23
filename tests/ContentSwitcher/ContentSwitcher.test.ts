import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ContentSwitcherCustom from "./ContentSwitcher.custom.test.svelte";
import ContentSwitcherDisabled from "./ContentSwitcher.disabled.test.svelte";
import ContentSwitcherDisabledNav from "./ContentSwitcher.disabledNav.test.svelte";
import ContentSwitcherDisabledSelected from "./ContentSwitcher.disabledSelected.test.svelte";
import ContentSwitcherDynamic from "./ContentSwitcher.dynamic.test.svelte";
import ContentSwitcherDynamicBound from "./ContentSwitcher.dynamicBound.test.svelte";
import ContentSwitcherLowContrast from "./ContentSwitcher.lowContrast.test.svelte";
import ContentSwitcherLowContrastIconOnly from "./ContentSwitcher.lowContrastIconOnly.test.svelte";
import ContentSwitcherNested from "./ContentSwitcher.nested.test.svelte";
import ContentSwitcherOutOfRange from "./ContentSwitcher.outOfRange.test.svelte";
import ContentSwitcherSelectedId from "./ContentSwitcher.selectedId.test.svelte";
import ContentSwitcherSelectedIndex from "./ContentSwitcher.selectedIndex.test.svelte";
import ContentSwitcherSelectionMode from "./ContentSwitcher.selectionMode.test.svelte";
import ContentSwitcherSize from "./ContentSwitcher.size.test.svelte";
import ContentSwitcherSlotSelected from "./ContentSwitcher.slotSelected.test.svelte";
import ContentSwitcherSwitchSelected from "./ContentSwitcher.switchSelected.test.svelte";
import ContentSwitcher from "./ContentSwitcher.test.svelte";

/** Child registration flushes on a microtask (`batchStoreUpdates`). */
async function renderSwitcher(
  ...args: Parameters<typeof render>
): Promise<ReturnType<typeof render>> {
  const result = render(...args);
  await tick();
  return result;
}

describe("ContentSwitcher", () => {
  it("renders with default props", async () => {
    await renderSwitcher(ContentSwitcher);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("bx--content-switcher");
    expect(tablist).not.toHaveClass("bx--content-switcher--sm");
    expect(tablist).not.toHaveClass("bx--content-switcher--xl");

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    expect(tabs[0]).toHaveTextContent("Option 1");
    expect(tabs[1]).toHaveTextContent("Option 2");
    expect(tabs[2]).toHaveTextContent("Option 3");

    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");

    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");

    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  });

  it("renders with different sizes", () => {
    render(ContentSwitcherSize);

    const tablists = screen.getAllByRole("tablist");
    expect(tablists).toHaveLength(2);

    expect(tablists[0]).toHaveClass("bx--content-switcher--sm");
    expect(tablists[0]).not.toHaveClass("bx--content-switcher--xl");

    expect(tablists[1]).toHaveClass("bx--content-switcher--xl");
    expect(tablists[1]).not.toHaveClass("bx--content-switcher--sm");

    const smallTabs = within(tablists[0]).getAllByRole("tab");
    expect(smallTabs).toHaveLength(2);
    expect(smallTabs[0]).toHaveTextContent("Small 1");
    expect(smallTabs[1]).toHaveTextContent("Small 2");

    const xlTabs = within(tablists[1]).getAllByRole("tab");
    expect(xlTabs).toHaveLength(2);
    expect(xlTabs[0]).toHaveTextContent("XL 1");
    expect(xlTabs[1]).toHaveTextContent("XL 2");
  });

  it("applies the low contrast modifier only when lowContrast is set", () => {
    render(ContentSwitcherLowContrast);

    const tablists = screen.getAllByRole("tablist");
    expect(tablists).toHaveLength(2);

    expect(tablists[0]).toHaveClass("bx--content-switcher--low-contrast");
    expect(tablists[1]).not.toHaveClass("bx--content-switcher--low-contrast");
  });

  it("combines the low contrast and icon-only modifiers", async () => {
    await renderSwitcher(ContentSwitcherLowContrastIconOnly);

    // Both modifiers must coexist on the tablist; this is the precondition for
    // the low-contrast rule that recolors the selected icon to `$icon-primary`
    // (the icon-only default of `$icon-inverse` is invisible on the light card).
    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("bx--content-switcher--low-contrast");
    expect(tablist).toHaveClass("bx--content-switcher--icon-only");
  });

  it("renders with selectedIndex prop", async () => {
    await renderSwitcher(ContentSwitcherSelectedIndex);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[0]).toHaveAttribute("tabindex", "-1");

    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("tabindex", "0");

    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  });

  it("does not dispatch change event on initial render", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await renderSwitcher(ContentSwitcher);

    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      false,
    );
  });

  it("does not dispatch change event on initial render with selectedIndex", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await renderSwitcher(ContentSwitcher, { props: { selectedIndex: 1 } });

    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      false,
    );
  });

  it("does not dispatch change event when a selected Switch mounts", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await renderSwitcher(ContentSwitcherDynamicBound, {
      props: { selectLast: true },
    });
    await tick();

    expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      false,
    );
  });

  it("updates when selectedIndex changes", async () => {
    const { rerender } = await renderSwitcher(ContentSwitcherSelectedIndex);

    let tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");

    await rerender({ selectedIndex: 2 });

    tabs = screen.getAllByRole("tab");
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[2]).toHaveAttribute("tabindex", "0");
  });

  it("handles click events", async () => {
    await renderSwitcher(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

    await user.click(tabs[1]);
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");

    await user.click(tabs[2]);
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
  });

  it("prevents ArrowRight's default action (page scroll) when moving focus", async () => {
    render(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    await user.tab();

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    tabs[0].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("handles keyboard navigation", async () => {
    await renderSwitcher(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[1]);

    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[2]);

    await user.keyboard("{ArrowRight}");
    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{ArrowLeft}");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("ignores nested [role='tab'] elements inside switch slots when navigating", async () => {
    await renderSwitcher(ContentSwitcherNested);

    const tablist = screen.getByRole("tablist");
    const switchTabs = within(tablist).getAllByRole("tab", {
      name: /Outer|Nested tab/,
    });
    expect(switchTabs).toHaveLength(4);

    const outerTabs = within(tablist)
      .getAllByRole("tab")
      .filter((el) => el.tagName === "BUTTON");
    expect(outerTabs).toHaveLength(3);
    expect(outerTabs[0]).toHaveClass("bx--content-switcher--selected");

    await user.tab();
    expect(document.activeElement).toBe(outerTabs[0]);

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(outerTabs[1]);
    expect(outerTabs[1]).toHaveClass("bx--content-switcher--selected");

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(outerTabs[2]);
    expect(outerTabs[2]).toHaveClass("bx--content-switcher--selected");

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(outerTabs[0]);
    expect(outerTabs[0]).toHaveClass("bx--content-switcher--selected");
  });

  it("Home/End jump to first/last tab", async () => {
    render(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(tabs[0]);
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
  });

  it("respects disabled state", async () => {
    render(ContentSwitcherDisabled);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[1]).toHaveAttribute("disabled");

    await user.click(tabs[1]);
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");

    await user.click(tabs[2]);
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
  });

  describe("skips disabled switches during keyboard navigation", () => {
    // Fixture order: A (enabled), B (disabled), C (enabled), D (disabled)
    it("ArrowRight skips a disabled switch (automatic)", async () => {
      render(ContentSwitcherDisabledNav);

      const tabs = screen.getAllByRole("tab");
      await user.tab();
      expect(document.activeElement).toBe(tabs[0]);

      // A -> (skip B) -> C
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("ArrowRight wraps past a trailing disabled switch (automatic)", async () => {
      render(ContentSwitcherDisabledNav);

      const tabs = screen.getAllByRole("tab");
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[2]);

      // C -> (skip D, wrap) -> A
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[0]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    });

    it("ArrowLeft skips a disabled switch (automatic)", async () => {
      render(ContentSwitcherDisabledNav);

      const tabs = screen.getAllByRole("tab");
      await user.tab();
      expect(document.activeElement).toBe(tabs[0]);

      // A -> (skip D, skip nothing) wraps left past D to C
      await user.keyboard("{ArrowLeft}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    });

    it("End lands on the last enabled switch (automatic)", async () => {
      render(ContentSwitcherDisabledNav);

      const tabs = screen.getAllByRole("tab");
      await user.tab();

      // D (last) is disabled, so End should land on C
      await user.keyboard("{End}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[3]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("Home lands on the first enabled switch (automatic)", async () => {
      render(ContentSwitcherDisabledNav);

      const tabs = screen.getAllByRole("tab");
      await user.tab();
      await user.keyboard("{End}");
      expect(document.activeElement).toBe(tabs[2]);

      // A (first) is enabled, so Home should land on A
      await user.keyboard("{Home}");
      expect(document.activeElement).toBe(tabs[0]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    });

    it("ArrowRight moves focus past a disabled switch without selecting it (manual)", async () => {
      render(ContentSwitcherDisabledNav, {
        props: { selectionMode: "manual" },
      });

      const tabs = screen.getAllByRole("tab");
      await user.tab();
      expect(document.activeElement).toBe(tabs[0]);

      // Focus moves A -> (skip B) -> C; selection stays on A
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("End moves focus to the last enabled switch (manual)", async () => {
      render(ContentSwitcherDisabledNav, {
        props: { selectionMode: "manual" },
      });

      const tabs = screen.getAllByRole("tab");
      await user.tab();

      await user.keyboard("{End}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    });
  });

  it("renders custom content", () => {
    render(ContentSwitcherCustom);

    const customContent = screen.getByTestId("custom-content");
    expect(customContent).toBeInTheDocument();
    expect(customContent).toHaveTextContent("Custom Content");

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toHaveTextContent("Regular Text");
  });

  it("should apply custom class", () => {
    render(ContentSwitcher, {
      props: { customClass: "custom-switcher" },
    });

    const switcher = screen.getByRole("tablist");
    expect(switcher).toHaveClass("custom-switcher");
  });

  it("should dispatch change event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);

    expect(consoleLog).toHaveBeenCalledWith("change", 1);
  });

  it("should handle mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContentSwitcher);

    const switcher = screen.getByRole("tablist");
    await user.hover(switcher);

    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(switcher);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should handle click events on container", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContentSwitcher);

    const switcher = screen.getByRole("tablist");
    await user.click(switcher);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should apply custom id to Switch", () => {
    render(ContentSwitcher, {
      props: { switchId: "custom-switch-id" },
    });

    const tab = screen.getByRole("tab", { name: "Option 2" });
    expect(tab).toHaveAttribute("id", "custom-switch-id");
  });

  it("should bind ref to Switch button element", () => {
    const { component } = render(ContentSwitcher);

    assert(component.switchRef);
    expect(component.switchRef).toBeInstanceOf(HTMLButtonElement);
    expect(component.switchRef.type).toBe("button");
  });

  it("unregisters a destroyed Switch so keyboard wrap-around uses the visible tabs", async () => {
    const { rerender } = render(ContentSwitcherDynamic, {
      props: { show: true },
    });

    expect(screen.getAllByRole("tab")).toHaveLength(3);

    await rerender({ show: false });

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent("First");
    expect(tabs[1]).toHaveTextContent("Last");

    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);

    // ArrowLeft from the first tab should wrap to the last visible tab.
    // If the destroyed middle Switch is still in the parent's registry,
    // currentIndex wraps onto a phantom entry and focus never moves.
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
  });

  it("syncs switch order to the DOM when a middle Switch is re-added", async () => {
    const { rerender } = render(ContentSwitcherDynamic, {
      props: { show: false },
    });

    expect(
      screen.getAllByRole("tab").map((tab) => tab.textContent?.trim()),
    ).toEqual(["First", "Last"]);

    // Re-adding the middle Switch mounts it last, so the parent's registry
    // would append it after "Last" without DOM-order syncing.
    await rerender({ show: true });

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "First",
      "Middle",
      "Last",
    ]);

    // Arrow navigation must follow visual order, not mount order.
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]).toHaveTextContent("Middle");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2]).toHaveTextContent("Last");
  });

  it("should bind ref to the tablist element", () => {
    const { component } = render(ContentSwitcher);

    assert(component.ref);
    expect(component.ref).toBeInstanceOf(HTMLDivElement);
    expect(component.ref).toHaveAttribute("role", "tablist");
    expect(component.ref).toHaveClass("bx--content-switcher");
  });

  describe('selectionMode="manual"', () => {
    it("arrow keys move focus without changing selection", async () => {
      await renderSwitcher(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

      await user.tab();
      expect(document.activeElement).toBe(tabs[0]);

      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[1]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");

      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("arrow left moves focus without changing selection", async () => {
      render(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      await user.tab();

      await user.keyboard("{ArrowLeft}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("Enter selects the focused tab", async () => {
      render(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      await user.tab();

      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[1]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

      await user.keyboard("{Enter}");
      expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("Space selects the focused tab", async () => {
      render(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      await user.tab();

      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[1]);

      await user.keyboard(" ");
      expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("click selects a tab", async () => {
      await renderSwitcher(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

      await user.click(tabs[2]);
      expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    });

    it("wraps focus around from last to first", async () => {
      render(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      await user.tab();

      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[2]);

      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[0]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    });

    it("Home/End move focus without changing selection", async () => {
      render(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      await user.tab();
      expect(document.activeElement).toBe(tabs[0]);

      await user.keyboard("{End}");
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");

      await user.keyboard("{Home}");
      expect(document.activeElement).toBe(tabs[0]);
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    });

    it("dispatches change event only on selection, not on focus", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ContentSwitcherSelectionMode);

      await user.tab();
      consoleLog.mockClear();

      await user.keyboard("{ArrowRight}");
      expect(consoleLog).not.toHaveBeenCalledWith("change", 1);

      await user.keyboard("{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("change", 1);
    });
  });

  describe("selectedId", () => {
    it("keeps selectedId on the same logical switch when a prior switch is removed", async () => {
      await renderSwitcher(ContentSwitcherSelectedId, {
        props: { selectedId: "switch-b", showSwitchA: true },
      });

      expect(screen.getByRole("tab", { name: "Switch B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-id")).toHaveTextContent("switch-b");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");

      await user.click(screen.getByTestId("toggle-switch-a"));

      expect(
        screen.queryByRole("tab", { name: "Switch A" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Switch B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-id")).toHaveTextContent("switch-b");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
    });

    it("falls back when the selectedId switch itself is removed", async () => {
      render(ContentSwitcherSelectedId, {
        props: { selectedId: "switch-b", showSwitchA: true, showSwitchB: true },
      });

      await user.click(screen.getByTestId("toggle-switch-b"));

      expect(
        screen.queryByRole("tab", { name: "Switch B" }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("selected-id")).toHaveTextContent("switch-c");
      expect(screen.getByRole("tab", { name: "Switch C" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("uses the index API when selectedId is unset", async () => {
      await renderSwitcher(ContentSwitcherSelectedId, {
        props: { selectedIndex: 2, selectedId: undefined },
      });

      expect(screen.getByRole("tab", { name: "Switch C" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("");

      await user.click(screen.getByRole("tab", { name: "Switch A" }));

      expect(screen.getByRole("tab", { name: "Switch A" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("");
    });

    it("lets selectedId win over selectedIndex", async () => {
      await renderSwitcher(ContentSwitcherSelectedId, {
        props: { selectedIndex: 0, selectedId: "switch-c" },
      });

      expect(screen.getByRole("tab", { name: "Switch C" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-id")).toHaveTextContent("switch-c");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    });
  });

  describe("removing a switch in index mode", () => {
    it("re-anchors selectedIndex when an earlier switch is removed", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 2 },
      });

      await rerender({ show: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      const last = screen.getByRole("tab", { name: "Last" });
      expect(last).toHaveAttribute("aria-selected", "true");
      expect(last).toHaveAttribute("tabindex", "0");
      expect(consoleLog).toHaveBeenCalledWith("change", 1);
    });

    it("does not dispatch change when clicking the re-anchored switch", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 2 },
      });

      await rerender({ show: false });
      await tick();
      consoleLog.mockClear();

      await user.click(screen.getByRole("tab", { name: "Last" }));

      expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
        false,
      );
    });

    it("moves to the next switch when the selected switch is removed", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 1 },
      });
      consoleLog.mockClear();

      await rerender({ show: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
        false,
      );
    });

    it("keeps a Switch selected at mount", async () => {
      await renderSwitcher(ContentSwitcherDynamicBound, {
        props: { selectLast: true },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    });

    it("keeps selectedIndex when a later switch is removed", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 0 },
      });
      consoleLog.mockClear();

      await rerender({ show: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
        false,
      );
    });
  });

  describe("out-of-range selectedIndex", () => {
    const changed = (consoleLog: { mock: { calls: unknown[][] } }) =>
      consoleLog.mock.calls.some(([event]) => event === "change");

    it("clamps an index past the end to the last switch", async () => {
      const consoleLog = vi.spyOn(console, "log");
      await renderSwitcher(ContentSwitcherOutOfRange, {
        props: { selectedIndex: 7 },
      });
      await tick();

      const last = screen.getByRole("tab", { name: "Last" });
      expect(last).toHaveAttribute("aria-selected", "true");
      expect(last).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(changed(consoleLog)).toBe(false);

      await user.tab();
      expect(document.activeElement).toBe(last);
    });

    it("clamps a negative index to the first switch", async () => {
      const consoleLog = vi.spyOn(console, "log");
      await renderSwitcher(ContentSwitcherOutOfRange, {
        props: { selectedIndex: -1 },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(changed(consoleLog)).toBe(false);
    });

    it("selects the new last switch when the selected trailing switch is removed", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherOutOfRange, {
        props: { selectedIndex: 2 },
      });

      await rerender({ showLast: false });
      await tick();

      const middle = screen.getByRole("tab", { name: "Middle" });
      expect(middle).toHaveAttribute("aria-selected", "true");
      expect(middle).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(consoleLog).toHaveBeenCalledWith("change", 1);
    });

    it("clamps a programmatic out-of-range write", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherOutOfRange);

      await rerender({ selectedIndex: 9 });
      await tick();

      expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(consoleLog).toHaveBeenCalledWith("change", 2);
    });
  });

  describe("Switch selected prop", () => {
    const changed = (consoleLog: { mock: { calls: unknown[][] } }) =>
      consoleLog.mock.calls.some(([event]) => event === "change");

    it("selects the switch when `selected` turns true after mount", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherSwitchSelected);

      await rerender({ second: true });

      const a = screen.getByRole("tab", { name: "A" });
      const b = screen.getByRole("tab", { name: "B" });
      const c = screen.getByRole("tab", { name: "C" });
      expect(b).toHaveAttribute("aria-selected", "true");
      expect(b).toHaveAttribute("tabindex", "0");
      for (const tab of [a, c]) {
        expect(tab).toHaveAttribute("aria-selected", "false");
        expect(tab).toHaveAttribute("tabindex", "-1");
      }
      expect(
        screen
          .getAllByRole("tab")
          .filter((tab) => tab.getAttribute("aria-selected") === "true"),
      ).toHaveLength(1);
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(consoleLog).toHaveBeenCalledWith("change", 1);
    });

    it("re-selects after another switch was clicked", async () => {
      const { rerender } = await renderSwitcher(ContentSwitcherSwitchSelected);
      await rerender({ second: true });

      const a = screen.getByRole("tab", { name: "A" });
      const b = screen.getByRole("tab", { name: "B" });
      await user.click(a);
      expect(a).toHaveAttribute("aria-selected", "true");
      expect(b).toHaveAttribute("aria-selected", "false");

      await rerender({ second: false });
      expect(a).toHaveAttribute("aria-selected", "true");

      await rerender({ second: true });
      expect(b).toHaveAttribute("aria-selected", "true");
      expect(a).toHaveAttribute("aria-selected", "false");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
    });

    it("keeps the current switch selected when `selected` turns false", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = await renderSwitcher(ContentSwitcherSwitchSelected);
      await rerender({ second: true });
      consoleLog.mockClear();

      await rerender({ second: false });

      expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(changed(consoleLog)).toBe(false);
    });

    it("honors `selected` at mount without dispatching change", async () => {
      const consoleLog = vi.spyOn(console, "log");
      await renderSwitcher(ContentSwitcherSwitchSelected, {
        props: { second: true },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(changed(consoleLog)).toBe(false);
    });
  });

  describe("default slot `selected` prop", () => {
    it("reflects selection in the text branch", async () => {
      const { rerender } = await renderSwitcher(ContentSwitcherSlotSelected);

      expect(screen.getByTestId("slot-one")).toHaveTextContent("on");
      expect(screen.getByTestId("slot-two")).toHaveTextContent("off");

      // The slot replaces `text`, so the tab's name is the slot content.
      await user.click(screen.getByTestId("slot-two"));
      expect(screen.getByTestId("slot-one")).toHaveTextContent("off");
      expect(screen.getByTestId("slot-two")).toHaveTextContent("on");

      await rerender({ selectedIndex: 0 });
      expect(screen.getByTestId("slot-one")).toHaveTextContent("on");
      expect(screen.getByTestId("slot-two")).toHaveTextContent("off");
    });

    it("reflects selection in the icon branch", async () => {
      await renderSwitcher(ContentSwitcherSlotSelected);

      expect(screen.getByTestId("icon-slot-one")).toHaveTextContent("on");
      expect(screen.getByTestId("icon-slot-two")).toHaveTextContent("off");

      await user.click(screen.getByRole("tab", { name: "Icon two" }));
      expect(screen.getByTestId("icon-slot-one")).toHaveTextContent("off");
      expect(screen.getByTestId("icon-slot-two")).toHaveTextContent("on");
    });
  });

  describe("disabled selected switch", () => {
    const changed = (consoleLog: { mock: { calls: unknown[][] } }) =>
      consoleLog.mock.calls.some(([event]) => event === "change");
    const tab = (name: string) => screen.getByRole("tab", { name });

    it("moves the tab stop to the first enabled switch", async () => {
      await renderSwitcher(ContentSwitcherDisabledSelected);

      expect(tab("A")).toHaveAttribute("aria-selected", "true");
      expect(tab("A")).toHaveAttribute("tabindex", "-1");
      expect(tab("B")).toHaveAttribute("tabindex", "0");
      expect(tab("C")).toHaveAttribute("tabindex", "-1");
    });

    it("reaches the fallback with Tab without changing selection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      await renderSwitcher(ContentSwitcherDisabledSelected);

      await user.tab();
      await user.tab();

      expect(document.activeElement).toBe(tab("B"));
      expect(tab("A")).toHaveAttribute("aria-selected", "true");
      expect(changed(consoleLog)).toBe(false);
    });

    it("ArrowRight moves off the fallback (automatic)", async () => {
      const consoleLog = vi.spyOn(console, "log");
      await renderSwitcher(ContentSwitcherDisabledSelected);

      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(tab("C"));
      expect(tab("C")).toHaveAttribute("aria-selected", "true");
      expect(tab("C")).toHaveAttribute("tabindex", "0");
      expect(tab("B")).toHaveAttribute("tabindex", "-1");
      expect(consoleLog).toHaveBeenCalledWith("change", 2);
    });

    it("ArrowRight moves focus off the fallback without selecting (manual)", async () => {
      const consoleLog = vi.spyOn(console, "log");
      await renderSwitcher(ContentSwitcherDisabledSelected, {
        props: { selectionMode: "manual" },
      });

      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(tab("C"));
      expect(tab("A")).toHaveAttribute("aria-selected", "true");
      expect(changed(consoleLog)).toBe(false);
    });

    it("returns the tab stop to the selection when it is re-enabled", async () => {
      const { rerender } = await renderSwitcher(
        ContentSwitcherDisabledSelected,
      );

      await rerender({ disabledFirst: false });
      await tick();

      expect(tab("A")).toHaveAttribute("tabindex", "0");
      expect(tab("B")).toHaveAttribute("tabindex", "-1");
    });

    it("has no tab stop when every switch is disabled", async () => {
      const { rerender } = await renderSwitcher(
        ContentSwitcherDisabledSelected,
      );

      await rerender({ allDisabled: true });
      await tick();

      for (const t of screen.getAllByRole("tab")) {
        expect(t).toHaveAttribute("tabindex", "-1");
      }
    });
  });
});
