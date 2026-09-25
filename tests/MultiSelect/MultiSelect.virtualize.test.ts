import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { createItems, openMenu } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectInModal from "./MultiSelectInModal.test.svelte";

describe("MultiSelect", () => {
  describe("virtualization", () => {
    it("should enable virtualization for large lists", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: true,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeGreaterThan(0);
    });

    it("should default itemHeight to the size row height", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          size: "sm",
          virtualize: true,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      // 500 items at 32px (sm), spacer height 16000px
      const spacer = menu.querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe("16000px");
    });

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])(
      "should scroll to selected item when menu opens $description",
      async ({ virtualize }) => {
        const largeItems = createItems(500);
        render(MultiSelect, {
          props: {
            items: largeItems,
            selectedIds: ["250"], // Item 251, in the middle
            virtualize,
            selectionFeedback: "fixed", // Keep items in original order
            sortItem: () => 0, // Disable sorting to maintain original order
          },
        });

        await openMenu();

        await waitFor(() => {
          const menu = screen.getByRole("listbox");
          expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
          expect(menu).toBeVisible();

          // The selected item should be visible
          const selectedOption = within(menu).getByRole("option", {
            name: "Item 251",
          });
          expect(selectedOption).toBeInTheDocument();
          expect(selectedOption).toHaveAttribute("aria-selected", "true");

          // The scroll position should be set to show the selected item at the top
          // Item 251 is at index 250, itemHeight=40
          // Expected scroll: 250 * 40 = 10000
          expect(menu.scrollTop).toBe(10000);
        });
      },
    );

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])(
      "should scroll to selected item when menu reopens $description",
      async ({ virtualize }) => {
        const largeItems = createItems(500);
        const { rerender } = render(MultiSelect, {
          props: {
            items: largeItems,
            selectedIds: ["250"], // Item 251, in the middle
            virtualize,
            selectionFeedback: "fixed", // Keep items in original order
            sortItem: () => 0, // Disable sorting to maintain original order
          },
        });

        await openMenu();

        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        expect(menu).toBeVisible();

        // Scroll away from the selected item
        menu.scrollTop = 0;
        await new Promise((resolve) => setTimeout(resolve, 100));

        rerender({ open: false });
        await tick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        rerender({ open: true });
        await tick();
        await new Promise((resolve) => setTimeout(resolve, 200));

        await waitFor(
          () => {
            const menuAfterReopen = screen.getByRole("listbox");
            expectTypeOf(menuAfterReopen).toEqualTypeOf<HTMLElement>();

            // Selected item should be visible after reopening
            const selectedOption = within(menuAfterReopen).getByRole("option", {
              name: "Item 251",
            });
            expect(selectedOption).toBeInTheDocument();
            expect(selectedOption).toHaveAttribute("aria-selected", "true");

            // Should have scrolled back to show the selected item at the top
            // Item 251 is at index 250, itemHeight=40, so scroll should be 10000
            expect(menuAfterReopen.scrollTop).toBe(10000);
          },
          { timeout: 3000 },
        );
      },
    );

    it("should scroll to top when no items are selected", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: [],
          virtualize: true,
        },
      });

      await openMenu();

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        expect(menu).toBeVisible();
        // Should scroll to top when no selection
        expect(menu.scrollTop).toBe(0);
      });
    });

    it("should handle selected items at the end of list", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["499"], // Last item
          virtualize: true,
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();

        // The selected item should be visible
        const selectedOption = within(menu).getByRole("option", {
          name: "Item 500",
        });
        expect(selectedOption).toBeInTheDocument();
        expect(selectedOption).toHaveAttribute("aria-selected", "true");

        // Scroll should be at the position to show last item at top
        // Item 500 is at index 499, itemHeight=40, so scroll should be 499 * 40 = 19960
        // But max scroll is 500 * 40 - 300 = 19700, so it should be capped at 19700
        expect(menu.scrollTop).toBe(19700);
      });
    });

    it("should accept virtualization configuration object", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 50,
            containerHeight: 400,
            overscan: 5,
            threshold: 50,
            maxItems: 20,
          },
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // With maxItems: 20, should render at most 20 items
      expect(options.length).toBeLessThanOrEqual(20);
    });

    it("should not virtualize lists below threshold", async () => {
      const smallItems = createItems(50);
      render(MultiSelect, {
        props: {
          items: smallItems,
          selectedIds: ["0"],
          virtualize: {
            threshold: 100, // Threshold is 100, list has 50 items
          },
        },
      });

      await openMenu();

      const options = screen.getAllByRole("option");
      // Should render all items when below threshold
      expect(options.length).toBe(50);
    });

    it.each([
      { itemHeight: 60, containerHeight: 300 },
      { itemHeight: 100, containerHeight: 500 },
    ])(
      "renders far fewer than 500 options for a custom itemHeight of $itemHeight",
      async ({ itemHeight, containerHeight }) => {
        const largeItems = createItems(500);
        render(MultiSelect, {
          props: {
            items: largeItems,
            selectedIds: ["0"],
            virtualize: { itemHeight, containerHeight },
          },
        });

        await openMenu();

        const menu = screen.getByRole("listbox");
        expect(menu).toBeVisible();

        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
        expect(options.length).toBeLessThan(15);
      },
    );

    it("should calculate scroll position correctly with custom item height", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 80,
            containerHeight: 400,
          },
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();

      menu.scrollTop = 800;
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const optionsAfterScroll = screen.getAllByRole("option");
      expect(optionsAfterScroll.length).toBeGreaterThan(0);

      // Click on the option (the option's own checkbox is decorative and
      // hidden from the accessibility tree; the option owns selection).
      const firstOption = optionsAfterScroll[0];
      const firstCheckbox = firstOption.querySelector('input[type="checkbox"]');

      // Get the current checked state
      assert(firstCheckbox instanceof HTMLInputElement);
      const wasChecked = firstCheckbox.checked;

      // Click the option to toggle it
      await user.click(firstOption);
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify selection works - the checkbox should have toggled
      await waitFor(() => {
        const updatedCheckbox = firstOption.querySelector(
          'input[type="checkbox"]',
        );
        assert(updatedCheckbox instanceof HTMLInputElement);
        expect(updatedCheckbox.checked).toBe(!wasChecked);
      });
    });

    it("should maintain selection when virtualized", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["250"],
          virtualize: true,
        },
      });

      await openMenu();

      // With auto-scroll, the selected item should be visible without manual scrolling
      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        const selectedOption = within(menu).getByRole("option", {
          name: "Item 251",
        });
        expect(selectedOption).toBeInTheDocument();
        expect(selectedOption).toHaveAttribute("aria-selected", "true");
      });
    });

    it("should handle keyboard navigation with virtualization", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: [],
          virtualize: true,
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ArrowDown twice selects index 1, which is "Item 2" (items are 0-indexed)
      // Verify the item is selected - check if any checkbox is checked.
      // The option checkboxes are decorative (hidden from the accessibility
      // tree), so query the underlying <input> elements directly rather than
      // via role.
      await waitFor(() => {
        const checkboxes = Array.from(
          screen
            .getAllByRole("option")
            .map((option) => option.querySelector('input[type="checkbox"]')),
        );
        const checkedCheckboxes = checkboxes.filter((cb) => {
          assert(cb instanceof HTMLInputElement);
          return cb.checked;
        });
        expect(checkedCheckboxes.length).toBeGreaterThan(0);

        // Also verify we can find Item 2 if it's visible
        const item2Checkbox = checkboxes.find((cb) => {
          const label = cb?.closest(".bx--checkbox-wrapper")?.textContent;
          return label?.trim() === "Item 2";
        });
        if (item2Checkbox) {
          assert(item2Checkbox instanceof HTMLInputElement);
          expect(item2Checkbox.checked).toBe(true);
        }
      });
    });

    it("should apply max-height style when virtualized", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            containerHeight: 400,
          },
        },
      });

      await openMenu();

      // The ListBoxMenu itself has the style applied
      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();
      expect(menu.style.maxHeight).toBe("400px");
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should automatically enable virtualization for lists with more than 100 items when virtualize is undefined", async () => {
      const largeItems = createItems(150);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
        },
      });

      await openMenu();

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
      const smallItems = createItems(100);
      render(MultiSelect, {
        props: {
          items: smallItems,
          selectedIds: ["0"],
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should render all items when at or below threshold
      expect(options.length).toBe(100);
      // Should not have max-height style when not virtualized
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should explicitly disable virtualization when virtualize is false, even with large lists", async () => {
      const largeItems = createItems(100);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: false,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should render all items when explicitly disabled
      expect(options.length).toBe(100);
      // Should not have max-height style when not virtualized
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should respect threshold when virtualize is true with fewer than 100 items", async () => {
      const smallItems = createItems(50);
      render(MultiSelect, {
        props: {
          items: smallItems,
          selectedIds: ["0"],
          virtualize: true, // Explicitly enabled, but below threshold
        },
      });

      await openMenu();

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
      const largeItems = createItems(150);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: true, // Explicitly enabled, above threshold
        },
      });

      await openMenu();

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

    // Regression: with virtualization, the data-last item is not mounted
    // until scrolled into view, so a per-item blur handler bound to it
    // never fires when focus leaves the menu. The menu must close based
    // on focus leaving the wrapper, not blur of a specific list index.
    it("closes menu when focus moves outside the wrapper (virtualized)", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: { items: largeItems, virtualize: true },
      });

      const externalButton = document.createElement("button");
      externalButton.textContent = "Outside";
      document.body.appendChild(externalButton);

      try {
        await openMenu();
        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");

        // The data-last item (index 499) is far below the viewport and
        // not mounted, so any close logic tied to it cannot fire.
        const visibleOptions = screen.getAllByRole("option");
        expect(visibleOptions.length).toBeLessThan(500);

        externalButton.focus();
        await tick();

        expect(combobox).toHaveAttribute("aria-expanded", "false");
      } finally {
        externalButton.remove();
      }
    });
  });

  describe("portalMenu", () => {
    afterEach(() => {
      const existingPortals = document.querySelectorAll(
        "[data-floating-portal]",
      );
      for (const portal of existingPortals) {
        portal.remove();
      }
    });

    it("should render menu in FloatingPortal when portalMenu is true", () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          portalMenu: true,
          open: true,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should render menu in FloatingPortal when inside Modal (portalMenu not passed)", () => {
      render(MultiSelectInModal, {
        props: { modalOpen: true, multiSelectOpen: true },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", () => {
      render(MultiSelectInModal, {
        props: {
          modalOpen: true,
          multiSelectOpen: true,
          portalMenu: false,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    // Regression: when portaled, the menu loses its `.bx--multi-select`
    // ancestor, so descendant CSS rules (e.g. checkbox-wrapper sizing) stop
    // matching and the checkbox/label visually shift down inside each row.
    // The menu must be wrapped with `bx--multi-select bx--list-box--expanded`
    // so those selectors keep matching.
    it("should wrap portaled menu with multi-select host classes", () => {
      render(MultiSelect, {
        props: {
          items: [{ id: "0", text: "Slack" }],
          portalMenu: true,
          open: true,
        },
      });

      const menu = screen.getByRole("listbox");
      const host = menu.parentElement;
      expect(host).toHaveClass("bx--multi-select");
      expect(host).toHaveClass("bx--list-box--expanded");
      expect(host?.parentElement).toHaveAttribute("data-floating-portal");
    });

    it("should close portaled menu when clicking outside", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          portalMenu: true,
        },
      });

      await openMenu();
      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
        document.body,
      );

      await user.click(document.body);
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("should close portaled menu when focus moves outside", async () => {
      const externalButton = document.createElement("button");
      externalButton.textContent = "Outside";
      document.body.appendChild(externalButton);

      try {
        render(MultiSelect, {
          props: {
            items: [
              { id: "0", text: "Slack" },
              { id: "1", text: "Email" },
            ],
            portalMenu: true,
          },
        });

        await openMenu();
        const combobox = screen.getByRole("combobox");
        const menu = screen.getByRole("listbox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");
        expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
          document.body,
        );

        externalButton.focus();
        await tick();

        expect(combobox).toHaveAttribute("aria-expanded", "false");
      } finally {
        externalButton.remove();
      }
    });
  });
});
