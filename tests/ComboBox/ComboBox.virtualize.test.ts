import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { virtualWindowLayer } from "../utils/virtual-window-layer";
import ComboBox from "./ComboBox.test.svelte";
import { getInput } from "./helpers";

describe("ComboBox", () => {
  describe("virtualization", () => {
    const createLargeItemList = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
        price: i * 10,
      }));
    };

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])(
      "should reset scroll position when menu reopens $description",
      async ({ virtualize }) => {
        render(ComboBox, {
          props: {
            items: createLargeItemList(500),
            virtualize,
          },
        });

        const input = getInput();
        await user.click(input);

        const menu = screen.getByRole("listbox");
        expect(screen.getByText("Item 1")).toBeInTheDocument();

        menu.scrollTop = 2000;
        await fireEvent.scroll(menu);
        await tick();

        expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
        expect(screen.getByText("Item 60")).toBeInTheDocument();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

        // The reopened menu starts at the top, so it must never render the
        // window the previous scroll position pointed at, even for a frame.
        const rendered: string[] = [];
        const observer = new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              rendered.push(node.textContent ?? "");
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        await user.click(input);
        await tick();
        observer.disconnect();

        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.queryByText("Item 60")).not.toBeInTheDocument();
        expect(rendered.some((text) => text.includes("Item 1"))).toBe(true);
        expect(rendered.some((text) => text.includes("Item 60"))).toBe(false);
      },
    );

    it("should work with filtering when virtualized", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
          shouldFilterItem: (
            item: { id: string; text: string },
            value: string,
          ) => item.text.toLowerCase().includes(value.toLowerCase()),
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Item 1");

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) {
        expect(option.textContent).toMatch(/Item 1/i);
      }
    });

    it("should accept virtualization configuration object", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: {
            itemHeight: 50,
            containerHeight: 400,
            overscan: 5,
            threshold: 50,
            maxItems: 20,
          },
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeLessThanOrEqual(20);
    });

    it("should not virtualize lists below threshold", async () => {
      const smallItems = createLargeItemList(50);
      render(ComboBox, {
        props: {
          items: smallItems,
          virtualize: {
            threshold: 100,
          },
        },
      });

      await user.click(getInput());

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(50);
    });

    it("should handle virtualization with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: {
            itemHeight: 60,
            containerHeight: 300,
          },
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeLessThan(15);
    });

    it("should calculate scroll position correctly with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: {
            itemHeight: 80,
            containerHeight: 400,
          },
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      const spacer = menu.querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe("40000px");
      expect(screen.getByText("Item 1")).toBeInTheDocument();

      menu.scrollTop = 800;
      await fireEvent.scroll(menu);
      await tick();

      // 800px at 80px per row puts row 10 ("Item 11") at the top.
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
      await user.click(screen.getByText("Item 11"));

      expect(getInput()).toHaveValue("Item 11");
    });

    it("should default itemHeight to the size row height", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          size: "sm",
          virtualize: true,
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      // 500 items at 32px (sm), spacer height 16000px
      const spacer = menu.querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe("16000px");
    });

    it.each([
      [{ fluid: true }, "32000px"],
      [{ fluid: true, condensed: true }, "20000px"],
      [{ fluid: true, portalMenu: true }, "20000px"],
    ])("should size rows for %o as %s total", async (props, height) => {
      render(ComboBox, {
        props: { items: createLargeItemList(500), virtualize: true, ...props },
      });

      await user.click(getInput());

      const spacer = screen
        .getByRole("listbox")
        .querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe(height);
    });

    it("should pin the window when virtualize sets optimizeFastScroll", async () => {
      render(ComboBox, {
        props: {
          items: createLargeItemList(500),
          virtualize: { optimizeFastScroll: true },
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      const layer = virtualWindowLayer(menu);
      expect(layer.style.position).toBe("sticky");
      expect(layer.style.height).toBe("0px");

      menu.scrollTop = 2000;
      await fireEvent.scroll(menu);

      // 2000px down, the window starts 3 rows of overscan above row 50, at
      // 1880px. The sticky layer sits at 2000px, so the rows move back 120px.
      expect(layer.style.transform).toBe("translateY(-120px)");
    });

    it("should not pin the window by default", async () => {
      render(ComboBox, {
        props: { items: createLargeItemList(500), virtualize: true },
      });

      await user.click(getInput());

      const layer = virtualWindowLayer(screen.getByRole("listbox"));
      expect(layer.style.position).toBe("");
      expect(layer.style.transform).toBe("translateY(0px)");
    });

    it("should use explicit itemHeight instead of the size default", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          size: "sm",
          virtualize: { itemHeight: 50 },
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      const spacer = menu.querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe("25000px");
    });

    it("should maintain selection when virtualized", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
          selectedId: "250",
        },
      });

      const input = getInput();
      expect(input).toHaveValue("Item 251");

      await user.click(input);

      const selectedOption = screen.getByRole("option", { name: "Item 251" });
      expect(selectedOption).toHaveAttribute("aria-selected", "true");
    });

    it("keeps focus on the field while clicking virtualized options", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
        },
      });

      const input = getInput();
      await user.click(input);
      expect(input).toHaveFocus();

      const option = screen.getByRole("option", { name: "Item 1" });
      await user.click(option);

      expect(input).toHaveValue("Item 1");
      expect(input).toHaveFocus();
    });

    it("should handle keyboard navigation with virtualization", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // ArrowDown twice selects index 1, which is "Item 2" (items are 0-indexed)
      expect(input).toHaveValue("Item 2");
    });

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])(
      "should start keyboard navigation at selected item $description",
      async ({ virtualize }) => {
        const largeItems = createLargeItemList(500);
        render(ComboBox, {
          props: {
            items: largeItems,
            selectedId: "250", // Item 251, in the middle
            virtualize,
            // Use a filter that shows all items so we can test navigation
            shouldFilterItem: () => true,
          },
        });

        const input = getInput();
        await user.click(input);

        await waitFor(() => {
          const menu = screen.getByRole("listbox");
          expect(menu).toBeVisible();
        });

        await user.keyboard("{ArrowDown}");
        await user.keyboard("{Enter}");

        expect(input).toHaveValue("Item 252");
      },
    );

    it("should only scroll when highlighted item is outside viewport", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          selectedId: "250", // Item 251, in the middle
          virtualize: true,
          // Use a filter that shows all items so we can test scrolling behavior
          shouldFilterItem: () => true,
        },
      });

      const input = getInput();
      await user.click(input);

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expect(menu).toBeVisible();
        // Menu should have scrolled to show selected item at top
        // Item 251 is at index 250, itemHeight=40, so scroll should be 10000
        expect(menu.scrollTop).toBe(10000);
      });

      const menu = screen.getByRole("listbox");
      const initialScrollTop = menu.scrollTop;

      // Navigate within visible viewport (ArrowDown a few times)
      // These items should already be visible, so scroll shouldn't change much
      await user.keyboard("{ArrowDown}"); // 250 -> 251
      await user.keyboard("{ArrowDown}"); // 251 -> 252
      await user.keyboard("{ArrowDown}"); // 252 -> 253

      // Scroll position should remain similar (might change slightly due to overscan)
      // but shouldn't jump significantly
      await waitFor(() => {
        const newScrollTop = menu.scrollTop;
        // Allow some tolerance for overscan adjustments
        expect(Math.abs(newScrollTop - initialScrollTop)).toBeLessThan(200);
      });

      // Now navigate far outside viewport - should scroll
      // Navigate down many items to go outside visible range
      await user.keyboard(
        "{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}",
      );

      await waitFor(() => {
        expect(menu.scrollTop).toBeGreaterThan(initialScrollTop + 500);
      });
    });

    it("should apply max-height style when virtualized", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: {
            containerHeight: 400,
          },
        },
      });

      await user.click(getInput());

      // The ListBoxMenu itself has the style applied
      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();
      expect(menu.style.maxHeight).toBe("400px");
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should automatically enable virtualization for lists with more than 100 items when virtualize is undefined", async () => {
      const largeItems = createLargeItemList(150);
      render(ComboBox, {
        props: {
          items: largeItems,
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeLessThan(150);
      expect(options.length).toBeGreaterThan(0);
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should not virtualize lists with 100 or fewer items when virtualize is undefined", async () => {
      const smallItems = createLargeItemList(100);
      render(ComboBox, {
        props: {
          items: smallItems,
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(100);
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should explicitly disable virtualization when virtualize is false, even with large lists", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: false,
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(500);
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should respect threshold when virtualize is true with fewer than 100 items", async () => {
      const smallItems = createLargeItemList(50);
      render(ComboBox, {
        props: {
          items: smallItems,
          virtualize: true,
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Even though virtualize=true, the threshold check prevents virtualization
      expect(options.length).toBe(50);
      // virtualConfig is still created, so max-height applies even though it isn't virtualized
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should virtualize when virtualize is true with more than 100 items", async () => {
      const largeItems = createLargeItemList(150);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeLessThan(150);
      expect(options.length).toBeGreaterThan(0);
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });
  });
});
