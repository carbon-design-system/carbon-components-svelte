import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
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

    it("should enable virtualization for large lists", async () => {
      const largeItems = createLargeItemList(500);
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
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeGreaterThan(0);
    });

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])(
      "should reset scroll position when menu reopens $description",
      async ({ virtualize }) => {
        const largeItems = createLargeItemList(500);
        const { rerender } = render(ComboBox, {
          props: {
            items: largeItems,
            virtualize,
          },
        });

        await user.click(getInput());

        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        expect(menu).toBeVisible();
        expect(menu.style.maxHeight).toBeTruthy();
        expect(menu.style.overflowY).toBe("auto");

        menu.scrollTop = 1000;
        await new Promise((resolve) => setTimeout(resolve, 100));

        const scrollBeforeClose = menu.scrollTop;
        expect(scrollBeforeClose).toBeGreaterThan(0);

        rerender({ open: false });
        await tick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        rerender({ open: true });
        await tick();

        await waitFor(() => {
          const menuAfterReopen = screen.getByRole("listbox");
          expectTypeOf(menuAfterReopen).toEqualTypeOf<HTMLElement>();
          expect(menuAfterReopen).toBeInTheDocument();
          return menuAfterReopen;
        });

        await waitFor(() => {
          expect(screen.getByText("Item 1")).toBeInTheDocument();
        });
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

      // Should show filtered results
      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      // All visible options should match the filter
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
      // With maxItems: 20, should render at most 20 items
      expect(options.length).toBeLessThanOrEqual(20);
    });

    it("should not virtualize lists below threshold", async () => {
      const smallItems = createLargeItemList(50);
      render(ComboBox, {
        props: {
          items: smallItems,
          virtualize: {
            threshold: 100, // Threshold is 100, list has 50 items
          },
        },
      });

      await user.click(getInput());

      const options = screen.getAllByRole("option");
      // Should render all items when below threshold
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
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();

      menu.scrollTop = 800;
      await tick();

      const optionsAfterScroll = screen.getAllByRole("option");
      expect(optionsAfterScroll.length).toBeGreaterThan(0);

      const firstVisibleOption = optionsAfterScroll[0];
      await user.click(firstVisibleOption);

      const input = getInput();
      expect(input.value).toBeTruthy();
    });

    it("should override default item height when specified in virtualize object", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: {
            itemHeight: 100,
            containerHeight: 500,
          },
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(15);
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

      // Selected item should be visible and marked as active
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

        // Press ArrowDown - should move to next item (250 -> 251)
        await user.keyboard("{ArrowDown}");
        await user.keyboard("{Enter}");

        // Should have selected Item 252 (index 251)
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
        // Should have scrolled significantly to show the new highlighted item
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
      // Should virtualize, so fewer than 150 items rendered
      expect(options.length).toBeLessThan(150);
      expect(options.length).toBeGreaterThan(0);
      // Should have max-height style applied
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
      // Should render all items when at or below threshold
      expect(options.length).toBe(100);
      // Should not have max-height style when not virtualized
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
      // Should render all items when explicitly disabled
      expect(options.length).toBe(500);
      // Should not have max-height style when not virtualized
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should respect threshold when virtualize is true with fewer than 100 items", async () => {
      const smallItems = createLargeItemList(50);
      render(ComboBox, {
        props: {
          items: smallItems,
          virtualize: true, // Explicitly enabled, but below threshold
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should render all items because threshold (100) is not met
      // Even though virtualize=true, the threshold check prevents virtualization
      expect(options.length).toBe(50);
      // Should have max-height style applied (virtualConfig is created)
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should virtualize when virtualize is true with more than 100 items", async () => {
      const largeItems = createLargeItemList(150);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true, // Explicitly enabled, above threshold
        },
      });

      await user.click(getInput());

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should virtualize when above threshold
      expect(options.length).toBeLessThan(150);
      expect(options.length).toBeGreaterThan(0);
      // Should have max-height style applied
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });
  });
});
