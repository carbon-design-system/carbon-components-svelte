import { render, screen } from "@testing-library/svelte";
import { MultiSelect } from "carbon-components-svelte";
import { user } from "../setup-tests";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
  /** Opens the dropdown. */
  const openMenu = async () =>
    await user.click(
      await screen.findByLabelText("Open menu", {
        selector: `[role="button"]`,
      }),
    );

  /** Closes the dropdown. */
  const closeMenu = async () =>
    await user.click(
      await screen.findByLabelText("Close menu", {
        selector: `[role="button"]`,
      }),
    );

  /** Toggles an option, identifying it by its `text` value. */
  const toggleOption = async (optionText: string) =>
    await user.click(
      await screen.findByText((text) => text.trim() === optionText),
    );

  /** Fetches the `text` value of the nth option in the MultiSelect component. */
  const nthRenderedOptionText = (index: number) =>
    screen.queryAllByRole("option").at(index)?.textContent?.trim();

  describe("sorting behavior", () => {
    it("initially sorts items alphabetically", async () => {
      render(MultiSelect, {
        items: [
          { id: "1", text: "C" },
          { id: "3", text: "A" },
          { id: "2", text: "B" },
        ],
      });

      // Initially, items should be sorted alphabetically.
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
      expect(nthRenderedOptionText(1)).toBe("B");
      expect(nthRenderedOptionText(2)).toBe("C");
    });

    it("immediately moves selected items to the top (with selectionFeedback: top)", async () => {
      render(MultiSelect, {
        items: [
          { id: "3", text: "C" },
          { id: "1", text: "A" },
          { id: "2", text: "B" },
        ],
        selectionFeedback: "top",
      });

      // Initially, items should be sorted alphabetically.
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("C");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    it("sorts newly-toggled items only after the dropdown is reoponed (with selectionFeedback: top-after-reopen)", async () => {
      render(MultiSelect, {
        items: [
          { id: "3", text: "C" },
          { id: "1", text: "A" },
          { id: "2", text: "B" },
        ],
      });

      // Initially, items should be sorted alphabetically.
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      // While the menu is still open, a newly-selected item should not move.
      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      // The newly-selected item should move after the menu is closed and
      // re-opened.
      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("C");

      // A deselected item should not move while the dropdown is still open.
      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("C");

      // The deselected item should move after closing and re-opening the dropdown.
      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    it("never moves selected items to the top (with selectionFeedback: fixed)", async () => {
      render(MultiSelect, {
        items: [
          { id: "3", text: "C" },
          { id: "1", text: "A" },
          { id: "2", text: "B" },
        ],
        selectionFeedback: "fixed",
      });

      // Items should be sorted alphabetically.
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      // A newly-selected item should not move after the selection is made.
      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      // The newly-selected item also shouldn't move after the dropdown is closed
      // and reopened.
      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
    });
  });

  describe("filtering behavior", () => {
    it("should filter items based on input value", async () => {
      render(MultiSelect, {
        items,
        filterable: true,
        placeholder: "Filter items...",
      });

      await openMenu();
      const input = screen.getByPlaceholderText("Filter items...");
      await user.type(input, "em");

      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();
    });

    it("should use custom filter function", async () => {
      render(MultiSelect, {
        items,
        filterable: true,
        filterItem: (item, value) =>
          item.text.toLowerCase().startsWith(value.toLowerCase()),
      });

      await openMenu();
      const input = screen.getByRole("combobox");
      await user.type(input, "e");

      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();
    });

    it("should clear filter on selection clear", async () => {
      render(MultiSelect, {
        items,
        filterable: true,
        selectedIds: ["0"],
      });

      const clearButton = screen.getByLabelText("Clear all selected items");
      await user.click(clearButton);

      const input = screen.getByRole("combobox");
      expect(input).toHaveValue("");
    });

    it("should show correct clear button label regardless of selection count", async () => {
      render(MultiSelect, {
        items,
        selectedIds: ["0"],
      });

      expect(
        screen.getByLabelText("Clear all selected items"),
      ).toBeInTheDocument();

      await openMenu();
      await toggleOption("Email");
      expect(
        screen.getByLabelText("Clear all selected items"),
      ).toBeInTheDocument();
    });

    it("should use custom translations when translateWithId is provided", async () => {
      const customTranslations = {
        clearSelection: "Remove selected item",
        clearAll: "Remove all items",
      } as const;

      render(MultiSelect, {
        items,
        selectedIds: ["0"],
        translateWithIdSelection: (id) => customTranslations[id],
      });

      expect(screen.getByLabelText("Remove all items")).toBeInTheDocument();

      await openMenu();
      await toggleOption("Email");
      expect(screen.getByLabelText("Remove all items")).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("should handle arrow keys for navigation", async () => {
      render(MultiSelect, { items });

      await openMenu();
      await user.keyboard("{ArrowDown}");

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveClass("bx--list-box__menu-item--highlighted");
    });

    it("should select item with Enter key", async () => {
      const { component } = render(MultiSelect, { items });
      const selectHandler = vi.fn();
      component.$on("select", selectHandler);

      await openMenu();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(selectHandler).toHaveBeenCalled();
    });

    it("should close menu with Escape key", async () => {
      render(MultiSelect, { items });

      await openMenu();
      await user.keyboard("{Escape}");

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("accessibility", () => {
    it("should handle hidden label", () => {
      render(MultiSelect, {
        items,
        titleText: "Contact methods",
        hideLabel: true,
      });

      const label = screen.getByText("Contact methods");
      expect(label).toHaveClass("bx--visually-hidden");
    });

    it("should handle custom aria-label", async () => {
      render(MultiSelect, {
        items,
        "aria-label": "Custom label",
      });

      await openMenu();
      const menu = screen.getByLabelText("Custom label");
      expect(menu).toBeInTheDocument();
    });
  });

  describe("variants and states", () => {
    it("should render in light variant", async () => {
      render(MultiSelect, {
        items,
        light: true,
      });

      await openMenu();
      const listBox = screen.getByRole("listbox").closest(".bx--list-box");
      expect(listBox).toHaveClass("bx--list-box--light");
    });

    it("should render in inline variant", () => {
      render(MultiSelect, {
        items,
        type: "inline",
      });

      const wrapper = screen
        .getByRole("button")
        .closest(".bx--multi-select__wrapper");
      expect(wrapper).toHaveClass("bx--multi-select__wrapper--inline");
    });

    it("should handle invalid state", () => {
      render(MultiSelect, {
        items,
        invalid: true,
        invalidText: "Invalid selection",
      });

      expect(screen.getByText("Invalid selection")).toBeInTheDocument();
      const wrapper = screen.getByRole("button").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--multi-select--invalid");
    });

    it("should handle warning state", () => {
      render(MultiSelect, {
        items,
        warn: true,
        warnText: "Warning message",
      });

      expect(screen.getByText("Warning message")).toBeInTheDocument();
      const wrapper = screen.getByRole("button").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--list-box--warning");
    });

    it("should handle disabled state", () => {
      render(MultiSelect, { items, disabled: true });

      const field = screen.getByRole("button");
      expect(field).toHaveAttribute("aria-disabled", "true");
      expect(field).toHaveAttribute("tabindex", "-1");
      expect(field.closest(".bx--multi-select")).toHaveAttribute(
        "tabindex",
        "-1",
      );
    });

    it("should handle disabled items", async () => {
      const itemsWithDisabled = [
        { id: "0", text: "Slack" },
        { id: "1", text: "Email", disabled: true },
        { id: "2", text: "Fax" },
      ];

      render(MultiSelect, {
        items: itemsWithDisabled,
      });

      await openMenu();
      const emailOption = screen
        .getByText("Email")
        .closest(".bx--list-box__menu-item");
      expect(emailOption).toHaveAttribute("disabled");
    });
  });

  describe("custom formatting", () => {
    it("should handle custom itemToString", () => {
      render(MultiSelect, {
        items,
        selectedIds: ["0"],
        itemToString: (item) => `${item.text} (${item.id})`,
      });

      expect(screen.getByText("Slack (0)")).toBeInTheDocument();
    });

    it("should handle custom itemToInput", async () => {
      render(MultiSelect, {
        items,
        itemToInput: (item) => ({
          name: `contact_${item.id}`,
          value: item.text.toLowerCase(),
        }),
      });

      await openMenu();
      const checkbox = screen.getByText("Slack");
      const checkboxWrapper = checkbox.closest(".bx--checkbox-wrapper");
      assert(checkboxWrapper);

      const checkboxInput = checkboxWrapper.querySelector("input");
      expect(checkboxInput).toHaveAttribute("name", "contact_0");
    });
  });
});
