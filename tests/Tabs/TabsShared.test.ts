import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import { mockScrollMetrics, renderManual } from "./helpers";
import Tabs from "./Tabs.test.svelte";
import TabsRegistration from "./TabsRegistration.test.svelte";
import TabsSelectedId from "./TabsSelectedId.test.svelte";

/**
 * Behavior `Tabs` and `TabsVertical` share. Each row picks the component the
 * fixtures render, the arrow keys that move along its axis, and the props that
 * make it measure horizontal overflow (a vertical list only does in the row
 * layout).
 */
const variants = [
  {
    name: "Tabs",
    vertical: false,
    next: "ArrowRight",
    prev: "ArrowLeft",
    overflowProps: {},
  },
  {
    name: "TabsVertical",
    vertical: true,
    next: "ArrowDown",
    prev: "ArrowUp",
    overflowProps: { orientation: "horizontal" },
  },
] as const;

describe.each(variants)(
  "$name (shared)",
  ({ vertical, next, prev, overflowProps }) => {
    it("should link each tab to its panel via aria-controls", async () => {
      render(Tabs, { props: { vertical } });
      await tick();

      const tabs = screen.getAllByRole("tab");
      const panels = screen.getAllByRole("tabpanel", { hidden: true });

      expect(tabs).toHaveLength(3);
      expect(panels).toHaveLength(3);

      tabs.forEach((tab, index) => {
        const panelId = tab.getAttribute("aria-controls");
        assert(panelId);
        expect(panelId).toBe(panels[index].id);
        // The pairing holds in both directions.
        expect(panels[index]).toHaveAttribute("aria-labelledby", tab.id);
      });
    });

    it("moves focus from the tab list to the selected panel with Tab", async () => {
      render(Tabs, { props: { vertical } });
      await tick();

      await user.tab();
      await user.tab();
      expect(screen.getByRole("tabpanel")).toHaveFocus();
    });

    it("should change tab on click and dispatch change", async () => {
      const onChange = vi.fn();
      render(Tabs, { props: { vertical, onChange } });

      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      await user.click(tab3);

      expect(tab3).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("Content 3")).toBeVisible();
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it("should not select disabled tabs", async () => {
      render(Tabs, { props: { vertical } });

      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      expect(tab2).toHaveAttribute("aria-disabled", "true");
      await user.click(tab2);

      expect(tab2).toHaveAttribute("aria-selected", "false");
      expect(screen.getByText("Content 1")).toBeVisible();
    });

    it(`should navigate with ${prev}/${next}, skipping disabled tabs`, async () => {
      const onChange = vi.fn();
      render(Tabs, { props: { vertical, onChange } });

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      await user.click(tab1);

      // Tab 2 is disabled, so the next key moves to Tab 3.
      await user.keyboard(`{${next}}`);
      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
      expect(onChange).toHaveBeenCalledWith(2);

      await user.keyboard(`{${prev}}`);
      expect(tab1).toHaveFocus();
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("keeps the tab stop on a selected disabled tab", async () => {
      render(Tabs, { props: { vertical, selected: 1 } });
      await tick();

      await user.tab();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
    });

    it("should prevent the default scroll on arrow navigation", async () => {
      render(Tabs, { props: { vertical } });

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      expect(await fireEvent.keyDown(tab1, { key: next })).toBe(false);
      expect(await fireEvent.keyDown(tab1, { key: prev })).toBe(false);
    });

    it.each(["altKey", "ctrlKey", "metaKey"])(
      `leaves ${next} with %s held to the browser`,
      async (modifier) => {
        render(Tabs, { props: { vertical } });
        const tab1 = screen.getByRole("tab", { name: "Tab 1" });

        const event = new KeyboardEvent("keydown", {
          key: next,
          bubbles: true,
          cancelable: true,
          [modifier]: true,
        });
        tab1.dispatchEvent(event);
        await tick();

        expect(event.defaultPrevented).toBe(false);
        expect(tab1).toHaveAttribute("aria-selected", "true");
      },
    );

    it("jumps to the last and first enabled tab with End and Home", async () => {
      const onChange = vi.fn();
      render(Tabs, { props: { vertical, onChange } });

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      await user.click(tab1);

      expect(await fireEvent.keyDown(tab1, { key: "End" })).toBe(false);
      await tick();
      expect(tab3).toHaveFocus();
      expect(tab3).toHaveAttribute("aria-selected", "true");
      expect(onChange).toHaveBeenCalledWith(2);

      expect(await fireEvent.keyDown(tab3, { key: "Home" })).toBe(false);
      await tick();
      expect(tab1).toHaveFocus();
      expect(tab1).toHaveAttribute("aria-selected", "true");
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("selects the tab after a selected prop update", async () => {
      const onChange = vi.fn();
      const { rerender } = render(Tabs, { props: { vertical, onChange } });
      await tick();

      await rerender({ selected: 2 });

      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("Content 3")).toBeVisible();
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it(`moves ${prev} from the focused tab, not the selected one`, async () => {
      const onChange = vi.fn();
      render(Tabs, { props: { vertical, extraTab: true, onChange } });
      await tick();

      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      const tab4 = screen.getByRole("tab", { name: "Tab 4" });
      tab4.focus();

      await user.keyboard(`{${prev}}`);
      expect(tab3).toHaveFocus();
      expect(tab3).toHaveAttribute("aria-selected", "true");
      expect(onChange).toHaveBeenCalledWith(2);
      expect(onChange).not.toHaveBeenCalledWith(3);
    });

    it(`focuses the selected tab when arrowing onto it with ${prev}`, async () => {
      const onChange = vi.fn();
      render(Tabs, { props: { vertical, onChange } });
      await tick();

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      tab3.focus();

      await user.keyboard(`{${prev}}`);
      expect(tab1).toHaveFocus();
      expect(tab1).toHaveAttribute("aria-selected", "true");
      expect(tab3).toHaveAttribute("aria-selected", "false");
      expect(onChange).not.toHaveBeenCalledWith(2);
    });

    it(`wraps ${next} from the focused tab, not the selected one`, async () => {
      render(Tabs, { props: { vertical } });
      await tick();

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      tab3.focus();

      await user.keyboard(`{${next}}`);
      expect(tab1).toHaveFocus();
      expect(tab1).toHaveAttribute("aria-selected", "true");
      expect(tab3).toHaveAttribute("aria-selected", "false");
    });

    describe('activation="manual"', () => {
      it("moves from the focused tab after focus returns to another tab", async () => {
        const { tab1, tab3 } = await renderManual(Tabs, { vertical });

        await user.keyboard(`{${next}}`);
        expect(tab3).toHaveFocus();

        tab1.focus();
        await user.keyboard(`{${next}}`);
        expect(tab3).toHaveFocus();
        expect(tab1).toHaveAttribute("aria-selected", "true");
      });

      it(`${next} moves focus without changing selection`, async () => {
        const onChange = vi.fn();
        const { tab1, tab3 } = await renderManual(Tabs, { vertical, onChange });

        await user.keyboard(`{${next}}`);
        expect(tab3).toHaveFocus();
        expect(tab1).toHaveAttribute("aria-selected", "true");
        expect(tab3).toHaveAttribute("aria-selected", "false");
        expect(screen.getByText("Content 1")).toBeVisible();
        expect(onChange).not.toHaveBeenCalledWith(2);
      });

      it.each([
        ["Enter", "{Enter}"],
        ["Space", " "],
      ])("%s selects the focused tab", async (_, key) => {
        const onChange = vi.fn();
        const { tab1, tab3 } = await renderManual(Tabs, { vertical, onChange });

        await user.keyboard(`{${next}}`);
        expect(tab3).toHaveFocus();
        expect(tab1).toHaveAttribute("aria-selected", "true");

        await user.keyboard(key);
        expect(tab3).toHaveAttribute("aria-selected", "true");
        expect(tab1).toHaveAttribute("aria-selected", "false");
        expect(screen.getByText("Content 3")).toBeVisible();
        expect(onChange).toHaveBeenCalledWith(2);
      });
    });

    it("renders a secondary label set after mount", async () => {
      render(TabsRegistration, { props: { vertical } });
      await tick();

      const nav = screen.getByRole("navigation");
      expect(nav).not.toHaveClass("bx--tabs--tall");
      expect(screen.queryByText("(3/4)")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Load count" }));
      await tick();
      await tick();

      expect(nav).toHaveClass("bx--tabs--tall");
      expect(screen.getByText("(3/4)")).toHaveClass(
        "bx--tabs__nav-item-secondary-label",
      );
    });

    it("does not dispatch change on mount with a selectedId past the first tab", async () => {
      const onChange = vi.fn();
      render(TabsSelectedId, {
        props: { vertical, selectedId: "tab-b", onChange },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("keeps selectedId on the same logical tab when a prior tab is removed", async () => {
      render(TabsSelectedId, {
        props: { vertical, selectedId: "tab-b", showTabA: true },
      });
      await tick();

      expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-b");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
      expect(screen.getByText("Content B")).toBeVisible();

      await user.click(screen.getByTestId("toggle-tab-a"));
      await tick();

      expect(
        screen.queryByRole("tab", { name: "Tab A" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-b");
      expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
      expect(screen.getByText("Content B")).toBeVisible();
    });

    it("falls back to the next tab when the selectedId tab is removed", async () => {
      render(TabsSelectedId, {
        props: { vertical, selectedId: "tab-b", showTabA: true },
      });
      await tick();

      await user.click(screen.getByTestId("toggle-tab-b"));
      await tick();

      expect(
        screen.queryByRole("tab", { name: "Tab B" }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-c");
      expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("Content C")).toBeVisible();
    });

    describe("bound selectedId", () => {
      it("follows a click on a tab", async () => {
        const onChange = vi.fn();
        render(TabsSelectedId, {
          props: { vertical, selectedId: "tab-a", onChange },
        });
        await tick();

        await user.click(screen.getByRole("tab", { name: "Tab C" }));

        expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-c");
        expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute(
          "aria-selected",
          "true",
        );
        expect(onChange.mock.calls).toEqual([[2]]);
      });

      it(`follows ${next}`, async () => {
        const onChange = vi.fn();
        render(TabsSelectedId, {
          props: { vertical, selectedId: "tab-a", onChange },
        });
        await tick();

        screen.getByRole("tab", { name: "Tab A" }).focus();
        await user.keyboard(`{${next}}`);

        expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-b");
        expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
          "aria-selected",
          "true",
        );
        expect(onChange.mock.calls).toEqual([[1]]);
      });
    });

    describe("overflow buttons", () => {
      const renderOverflowing = async () => {
        const result = render(Tabs, { props: { vertical, ...overflowProps } });
        const nav = screen.getByRole("tablist");
        mockScrollMetrics(nav, {
          scrollWidth: 600,
          clientWidth: 200,
          scrollLeft: 0,
        });
        await fireEvent.scroll(nav);
        const previous = result.container.querySelector(
          ".bx--tab--overflow-nav-button--previous",
        );
        const nextButton = result.container.querySelector(
          ".bx--tab--overflow-nav-button--next",
        );
        assert(previous && nextButton);
        return { nav, previous, nextButton };
      };

      it("toggle at the start and end of the list", async () => {
        const { nav, previous, nextButton } = await renderOverflowing();

        expect(nextButton).toHaveAttribute("aria-hidden", "true");
        expect(nextButton).toHaveAttribute("tabindex", "-1");
        expect(previous).toHaveClass("bx--tab--overflow-nav-button--hidden");
        expect(nextButton).not.toHaveClass(
          "bx--tab--overflow-nav-button--hidden",
        );

        nav.scrollLeft = 400;
        await fireEvent.scroll(nav);
        expect(previous).not.toHaveClass(
          "bx--tab--overflow-nav-button--hidden",
        );
        expect(nextButton).toHaveClass("bx--tab--overflow-nav-button--hidden");
      });

      it("scroll the list by 75% of its width on click", async () => {
        const { nav, previous, nextButton } = await renderOverflowing();
        const scrollBy = vi.fn();
        nav.scrollBy = scrollBy;

        await user.click(nextButton);
        expect(scrollBy).toHaveBeenLastCalledWith({
          left: 150,
          behavior: "smooth",
        });

        await user.click(previous);
        expect(scrollBy).toHaveBeenLastCalledWith({
          left: -150,
          behavior: "smooth",
        });
      });

      it("scrolls an arrowed-to tab into view without the native focus scroll", async () => {
        const { nav } = await renderOverflowing();
        const tab1 = screen.getByRole("tab", { name: "Tab 1" });
        const tab3 = screen.getByRole("tab", { name: "Tab 3" });
        nav.getBoundingClientRect = () => rect({ left: 0, right: 200 });
        tab3.getBoundingClientRect = () => rect({ left: 300, right: 400 });
        const focus = vi.spyOn(tab3, "focus");

        await user.click(tab1);
        // Tab 2 is disabled, so the next tab is Tab 3. A vertical list only
        // scrolls horizontally in the row layout, which arrows with Left/Right.
        await user.keyboard("{ArrowRight}");
        await tick();

        expect(tab3).toHaveFocus();
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        // Tab 3 ends 248px (400 - (200 - 48px margin)) past the visible edge.
        expect(nav.scrollLeft).toBe(248);
      });
    });

    describe("shared ResizeObserver", () => {
      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it("shares one ResizeObserver across instances", async () => {
        let created = 0;
        const Base = globalThis.ResizeObserver;
        vi.stubGlobal(
          "ResizeObserver",
          class extends Base {
            constructor(callback: ResizeObserverCallback) {
              super(callback);
              created++;
            }
          },
        );
        for (let i = 0; i < 3; i++) {
          render(Tabs, { props: { vertical, ...overflowProps } });
        }
        await tick();
        expect(created).toBe(1);
      });

      it("measures overflow from the observer's report and stops on unmount", async () => {
        let deliver: ResizeObserverCallback = () => {};
        const observed = new Set<Element>();
        vi.stubGlobal(
          "ResizeObserver",
          class {
            constructor(callback: ResizeObserverCallback) {
              deliver = callback;
            }
            observe(element: Element) {
              observed.add(element);
            }
            unobserve(element: Element) {
              observed.delete(element);
            }
            disconnect() {}
          },
        );
        const { container, unmount } = render(Tabs, {
          props: { vertical, ...overflowProps },
        });
        await tick();

        const nav = screen.getByRole("tablist");
        expect(observed.has(nav)).toBe(true);
        expect(
          container.querySelector(".bx--tab--overflow-nav-button"),
        ).not.toBeInTheDocument();

        mockScrollMetrics(nav, { scrollWidth: 600, clientWidth: 200 });
        deliver(
          [{ target: nav }] as unknown as ResizeObserverEntry[],
          {} as ResizeObserver,
        );
        await tick();

        expect(
          container.querySelector(".bx--tab--overflow-nav-button--next"),
        ).not.toHaveClass("bx--tab--overflow-nav-button--hidden");

        unmount();
        expect(observed.size).toBe(0);
      });
    });
  },
);
