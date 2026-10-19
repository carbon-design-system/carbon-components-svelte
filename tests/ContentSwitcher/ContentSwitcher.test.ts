import { render, screen, within } from "@testing-library/svelte";
import { type ComponentProps, tick } from "svelte";
import { user } from "../utils/user";
import ContentSwitcherCustom from "./ContentSwitcher.custom.test.svelte";
import ContentSwitcherDisabled from "./ContentSwitcher.disabled.test.svelte";
import ContentSwitcherDisabledNav from "./ContentSwitcher.disabledNav.test.svelte";
import ContentSwitcherDisabledSelected from "./ContentSwitcher.disabledSelected.test.svelte";
import ContentSwitcherDynamic from "./ContentSwitcher.dynamic.test.svelte";
import ContentSwitcherDynamicBound from "./ContentSwitcher.dynamicBound.test.svelte";
import ContentSwitcherKeyed from "./ContentSwitcher.keyed.test.svelte";
import ContentSwitcherLowContrastIconOnly from "./ContentSwitcher.lowContrastIconOnly.test.svelte";
import ContentSwitcherModifiers from "./ContentSwitcher.modifiers.test.svelte";
import ContentSwitcherNested from "./ContentSwitcher.nested.test.svelte";
import ContentSwitcherOutOfRange from "./ContentSwitcher.outOfRange.test.svelte";
import ContentSwitcherSelectedId from "./ContentSwitcher.selectedId.test.svelte";
import ContentSwitcherSelectedIndex from "./ContentSwitcher.selectedIndex.test.svelte";
import ContentSwitcherSelectionMode from "./ContentSwitcher.selectionMode.test.svelte";
import ContentSwitcherSlotSelected from "./ContentSwitcher.slotSelected.test.svelte";
import ContentSwitcherSwitchSelected from "./ContentSwitcher.switchSelected.test.svelte";
import ContentSwitcher from "./ContentSwitcher.test.svelte";
import { renderAndFlush } from "./helpers";

describe("ContentSwitcher", () => {
  it("renders with default props", async () => {
    await renderAndFlush(ContentSwitcher);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("bx--content-switcher");
    expect(tablist).not.toHaveClass("bx--content-switcher--sm");
    expect(tablist).not.toHaveClass("bx--content-switcher--xl");
    expect(tablist).not.toHaveClass("bx--content-switcher--low-contrast");
    expect(tablist).not.toHaveClass("bx--content-switcher--auto-width");

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

  // Selection must be in the first render. Committing it a microtask later
  // fades the fill in if anything recalculates styles in between.
  it("renders the initial selection synchronously on mount", () => {
    render(ContentSwitcher);
    expect(screen.getAllByRole("tab")[0]).toHaveClass(
      "bx--content-switcher--selected",
    );
  });

  it("renders a mount-time `selected` Switch synchronously", () => {
    render(ContentSwitcherSwitchSelected, { props: { second: true } });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
  });

  it("renders the initial selectedId synchronously", () => {
    render(ContentSwitcherSelectedId, { props: { selectedId: "switch-b" } });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
  });

  it.each<[ComponentProps<typeof ContentSwitcherModifiers>, string]>([
    [{ size: "sm" }, "bx--content-switcher--sm"],
    [{ size: "xl" }, "bx--content-switcher--xl"],
    [{ lowContrast: true }, "bx--content-switcher--low-contrast"],
    [{ autoWidth: true }, "bx--content-switcher--auto-width"],
  ])("applies %o -> %s", (props, className) => {
    render(ContentSwitcherModifiers, { props });

    expect(screen.getByRole("tablist")).toHaveClass(className);
  });

  it("combines the low contrast and icon-only modifiers", async () => {
    await renderAndFlush(ContentSwitcherLowContrastIconOnly);

    // Both modifiers must coexist on the tablist; this is the precondition for
    // the low-contrast rule that recolors the selected icon to `$icon-primary`
    // (the icon-only default of `$icon-inverse` is invisible on the light card).
    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("bx--content-switcher--low-contrast");
    expect(tablist).toHaveClass("bx--content-switcher--icon-only");
  });

  it("does not dispatch change event on initial render", async () => {
    const onChange = vi.fn();
    await renderAndFlush(ContentSwitcher, { props: { onChange } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not dispatch change event on initial render with selectedIndex", async () => {
    const onChange = vi.fn();
    await renderAndFlush(ContentSwitcher, {
      props: { selectedIndex: 1, onChange },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("updates when selectedIndex changes", async () => {
    const { rerender } = await renderAndFlush(ContentSwitcherSelectedIndex);

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
    await renderAndFlush(ContentSwitcher);

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

  it.each(["altKey", "ctrlKey", "metaKey"])(
    "leaves ArrowRight with %s held to the browser",
    async (modifier) => {
      await renderAndFlush(ContentSwitcher);
      const tabs = screen.getAllByRole("tab");

      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
        [modifier]: true,
      });
      tabs[0].dispatchEvent(event);
      await tick();

      expect(event.defaultPrevented).toBe(false);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    },
  );

  it("handles keyboard navigation", async () => {
    await renderAndFlush(ContentSwitcher);

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
    await renderAndFlush(ContentSwitcherNested);

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

  // Fixture order: A (enabled), B (disabled), C (enabled), D (disabled)
  describe.each(["automatic", "manual"] as const)(
    "skips disabled switches during keyboard navigation (%s)",
    (selectionMode) => {
      // Each step is [key, expected focused index]. Focus starts on A.
      it.each([
        // A -> (skip B) -> C -> (skip D, wrap) -> A
        [
          "ArrowRight wraps past a trailing disabled switch",
          [
            ["{ArrowRight}", 2],
            ["{ArrowRight}", 0],
          ],
        ],
        // A -> wraps left past D to C
        ["ArrowLeft skips a disabled switch", [["{ArrowLeft}", 2]]],
        // End lands on C (last enabled), Home returns to A
        [
          "End and Home land on the enabled ends",
          [
            ["{End}", 2],
            ["{Home}", 0],
          ],
        ],
      ] as const)("%s", async (_name, steps) => {
        render(ContentSwitcherDisabledNav, { props: { selectionMode } });

        const tabs = screen.getAllByRole("tab");
        await user.tab();
        expect(document.activeElement).toBe(tabs[0]);

        for (const [key, focused] of steps) {
          // biome-ignore lint/performance/noAwaitInLoops: key presses are sequential
          await user.keyboard(key);
          expect(document.activeElement).toBe(tabs[focused]);

          // Automatic selection follows focus. Manual selection stays on A.
          const selected = selectionMode === "automatic" ? focused : 0;
          expect(
            tabs.map((tab) =>
              tab.classList.contains("bx--content-switcher--selected"),
            ),
          ).toEqual(tabs.map((_, i) => i === selected));
        }
      });
    },
  );

  it("renders custom content", () => {
    render(ContentSwitcherCustom);

    const customContent = screen.getByTestId("custom-content");
    expect(customContent).toHaveTextContent("Custom Content");

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toContainElement(customContent);
    expect(tabs[0]).not.toHaveTextContent("Provide text");
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
    const onChange = vi.fn();
    render(ContentSwitcher, { props: { onChange } });

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("should handle mouse events", async () => {
    const onMouseenter = vi.fn();
    const onMouseover = vi.fn();
    const onMouseleave = vi.fn();
    render(ContentSwitcher, {
      props: { onMouseenter, onMouseover, onMouseleave },
    });

    const switcher = screen.getByRole("tablist");
    await user.hover(switcher);

    expect(onMouseenter).toHaveBeenCalled();
    expect(onMouseover).toHaveBeenCalled();

    await user.unhover(switcher);
    expect(onMouseleave).toHaveBeenCalled();
  });

  it("should handle click events on container", async () => {
    const onClick = vi.fn();
    render(ContentSwitcher, { props: { onClick } });

    const switcher = screen.getByRole("tablist");
    await user.click(switcher);

    expect(onClick).toHaveBeenCalled();
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

  it("follows a keyed reorder with selectedIndex, panels and arrow keys", async () => {
    const { rerender } = await renderAndFlush(ContentSwitcherKeyed);

    await rerender({ items: ["c", "b", "a"] });
    await tick();

    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    const a = screen.getByRole("tab", { name: "A" });
    expect(a).toHaveAttribute("aria-selected", "true");
    expect(a).toHaveAttribute("aria-controls", "a-panel");

    a.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "C" })).toHaveFocus();
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
      await renderAndFlush(ContentSwitcherSelectionMode);

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

    it("moves from the focused switch after the selected switch is clicked", async () => {
      await renderAndFlush(ContentSwitcherSelectionMode);
      const tabs = screen.getAllByRole("tab");

      await user.click(tabs[0]);
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(document.activeElement).toBe(tabs[2]);

      await user.click(tabs[0]);
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(tabs[1]);
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
      await renderAndFlush(ContentSwitcherSelectionMode);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

      await user.click(tabs[2]);
      expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
      expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
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
  });

  describe("selectedId", () => {
    it("keeps selectedId on the same logical switch when a prior switch is removed", async () => {
      await renderAndFlush(ContentSwitcherSelectedId, {
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
      await renderAndFlush(ContentSwitcherSelectedId, {
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

    it("updates selectedId and selectedIndex when a switch is clicked", async () => {
      await renderAndFlush(ContentSwitcherSelectedId, {
        props: { selectedId: "switch-a" },
      });

      await user.click(screen.getByRole("tab", { name: "Switch C" }));

      expect(screen.getByTestId("selected-id")).toHaveTextContent("switch-c");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(screen.getByRole("tab", { name: "Switch C" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("updates selectedId when an arrow key moves the selection", async () => {
      await renderAndFlush(ContentSwitcherSelectedId, {
        props: { selectedId: "switch-a" },
      });

      screen.getByRole("tab", { name: "Switch A" }).focus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByTestId("selected-id")).toHaveTextContent("switch-b");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
    });

    it("follows a selectedId set by the parent", async () => {
      const { rerender } = await renderAndFlush(ContentSwitcherSelectedId, {
        props: { selectedId: "switch-a" },
      });

      await rerender({ selectedId: "switch-c" });
      await tick();

      expect(screen.getByRole("tab", { name: "Switch C" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    });

    it("lets selectedId win over selectedIndex", async () => {
      await renderAndFlush(ContentSwitcherSelectedId, {
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
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 2, onChange },
      });

      await rerender({ show: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      const last = screen.getByRole("tab", { name: "Last" });
      expect(last).toHaveAttribute("aria-selected", "true");
      expect(last).toHaveAttribute("tabindex", "0");
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it("keeps a middle switch selected when an earlier switch is removed", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 1, onChange },
      });

      await rerender({ showFirst: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(screen.getByRole("tab", { name: "Middle" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("does not dispatch change when clicking the re-anchored switch", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 2, onChange },
      });

      await rerender({ show: false });
      await tick();
      onChange.mockClear();

      await user.click(screen.getByRole("tab", { name: "Last" }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("moves to the next switch when the selected switch is removed", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 1, onChange },
      });
      onChange.mockClear();

      await rerender({ show: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("keeps the selected switch selected when a switch is inserted before it", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 1, show: false, onChange },
      });
      onChange.mockClear();

      await rerender({ show: true });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it("keeps selectedIndex when a later switch is removed", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherDynamicBound, {
        props: { selectedIndex: 0, onChange },
      });
      onChange.mockClear();

      await rerender({ show: false });
      await tick();

      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("out-of-range selectedIndex", () => {
    it("clamps an index past the end to the last switch", async () => {
      const onChange = vi.fn();
      await renderAndFlush(ContentSwitcherOutOfRange, {
        props: { selectedIndex: 7, onChange },
      });
      await tick();

      const last = screen.getByRole("tab", { name: "Last" });
      expect(last).toHaveAttribute("aria-selected", "true");
      expect(last).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(onChange).not.toHaveBeenCalled();

      await user.tab();
      expect(document.activeElement).toBe(last);
    });

    it("clamps a negative index to the first switch", async () => {
      const onChange = vi.fn();
      await renderAndFlush(ContentSwitcherOutOfRange, {
        props: { selectedIndex: -1, onChange },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("selects the new last switch when the selected trailing switch is removed", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherOutOfRange, {
        props: { selectedIndex: 2, onChange },
      });

      await rerender({ showLast: false });
      await tick();

      const middle = screen.getByRole("tab", { name: "Middle" });
      expect(middle).toHaveAttribute("aria-selected", "true");
      expect(middle).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it("clamps a programmatic out-of-range write", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherOutOfRange, {
        props: { onChange },
      });

      await rerender({ selectedIndex: 9 });
      await tick();

      expect(screen.getByRole("tab", { name: "Last" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
      expect(onChange).toHaveBeenCalledWith(2);
    });
  });

  describe("Switch selected prop", () => {
    it("selects the switch when `selected` turns true after mount", async () => {
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherSwitchSelected, {
        props: { onChange },
      });

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
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it("re-selects after another switch was clicked", async () => {
      const { rerender } = await renderAndFlush(ContentSwitcherSwitchSelected);
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
      const onChange = vi.fn();
      const { rerender } = await renderAndFlush(ContentSwitcherSwitchSelected, {
        props: { onChange },
      });
      await rerender({ second: true });
      onChange.mockClear();

      await rerender({ second: false });

      expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("honors `selected` at mount without dispatching change", async () => {
      const onChange = vi.fn();
      await renderAndFlush(ContentSwitcherSwitchSelected, {
        props: { second: true, onChange },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("default slot `selected` prop", () => {
    it("reflects selection in the text branch", async () => {
      const { rerender } = await renderAndFlush(ContentSwitcherSlotSelected);

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
      await renderAndFlush(ContentSwitcherSlotSelected);

      expect(screen.getByTestId("icon-slot-one")).toHaveTextContent("on");
      expect(screen.getByTestId("icon-slot-two")).toHaveTextContent("off");

      await user.click(screen.getByRole("tab", { name: "Icon two" }));
      expect(screen.getByTestId("icon-slot-one")).toHaveTextContent("off");
      expect(screen.getByTestId("icon-slot-two")).toHaveTextContent("on");
    });
  });

  describe("disabled selected switch", () => {
    const tab = (name: string) => screen.getByRole("tab", { name });

    it("moves the tab stop to the first enabled switch", async () => {
      await renderAndFlush(ContentSwitcherDisabledSelected);

      expect(tab("A")).toHaveAttribute("aria-selected", "true");
      expect(tab("A")).toHaveAttribute("tabindex", "-1");
      expect(tab("B")).toHaveAttribute("tabindex", "0");
      expect(tab("C")).toHaveAttribute("tabindex", "-1");
    });

    it("reaches the fallback with Tab without changing selection", async () => {
      const onChange = vi.fn();
      await renderAndFlush(ContentSwitcherDisabledSelected, {
        props: { onChange },
      });

      await user.tab();
      await user.tab();

      expect(document.activeElement).toBe(tab("B"));
      expect(tab("A")).toHaveAttribute("aria-selected", "true");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("ArrowRight moves off the fallback (automatic)", async () => {
      const onChange = vi.fn();
      await renderAndFlush(ContentSwitcherDisabledSelected, {
        props: { onChange },
      });

      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(tab("C"));
      expect(tab("C")).toHaveAttribute("aria-selected", "true");
      expect(tab("C")).toHaveAttribute("tabindex", "0");
      expect(tab("B")).toHaveAttribute("tabindex", "-1");
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it("ArrowRight moves focus off the fallback without selecting (manual)", async () => {
      const onChange = vi.fn();
      await renderAndFlush(ContentSwitcherDisabledSelected, {
        props: { selectionMode: "manual", onChange },
      });

      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(tab("C"));
      expect(tab("A")).toHaveAttribute("aria-selected", "true");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("returns the tab stop to the selection when it is re-enabled", async () => {
      const { rerender } = await renderAndFlush(
        ContentSwitcherDisabledSelected,
      );

      await rerender({ disabledFirst: false });
      await tick();

      expect(tab("A")).toHaveAttribute("tabindex", "0");
      expect(tab("B")).toHaveAttribute("tabindex", "-1");
    });

    it("has no tab stop when every switch is disabled", async () => {
      const { rerender } = await renderAndFlush(
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
