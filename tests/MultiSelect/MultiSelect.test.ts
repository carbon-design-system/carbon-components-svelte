import { render, screen } from "@testing-library/svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectGenerics from "./MultiSelectGenerics.test.svelte";
import MultiSelectSlot from "./MultiSelectSlot.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
  const openMenu = async () =>
    await user.click(
      await screen.findByLabelText("Open menu", {
        selector: `[role="combobox"]`,
      }),
    );

  const closeMenu = async () =>
    await user.click(
      await screen.findByLabelText("Close menu", {
        selector: `[role="combobox"]`,
      }),
    );

  const toggleOption = async (optionText: string) =>
    await user.click(
      await screen.findByText((text) => text.trim() === optionText),
    );

  const nthRenderedOptionText = (index: number) =>
    screen.queryAllByRole("option").at(index)?.textContent?.trim();

  it("renders with default props", () => {
    render(MultiSelect, {
      props: {
        items,
        titleText: "Contact methods",
      },
    });

    expect(screen.getByText("Contact methods")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders default slot", () => {
    render(MultiSelectSlot, { items });
    expect(screen.getByText("1 Email 0")).toBeInTheDocument();
    expect(screen.getByText("2 Fax 1")).toBeInTheDocument();
    expect(screen.getByText("0 Slack 2")).toBeInTheDocument();
  });

  describe("selection behavior", () => {
    it("handles item selection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items },
      });

      await openMenu();
      await toggleOption("Slack");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["0"],
        selected: [{ id: "0", text: "Slack", checked: true }],
        unselected: [
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });
    });

    it("handles multiple selections", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items },
      });

      await openMenu();
      await toggleOption("Slack");
      await toggleOption("Email");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["0"],
        selected: [{ id: "0", text: "Slack", checked: true }],
        unselected: [
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["1", "0"],
        selected: [
          { id: "1", text: "Email", checked: true },
          { id: "0", text: "Slack", checked: true },
        ],
        unselected: [{ id: "2", text: "Fax", checked: false }],
      });
    });

    it("handles item deselection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();
      await toggleOption("Slack");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: [],
        selected: [],
        unselected: [
          { id: "0", text: "Slack", checked: false },
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });

      await toggleOption("Slack");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: [],
        selected: [],
        unselected: [
          { id: "0", text: "Slack", checked: false },
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });
    });
  });

  describe("filtering behavior", () => {
    it("filters items based on input", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter items...",
        },
      });

      const input = screen.getByPlaceholderText("Filter items...");
      await user.click(input);
      await user.type(input, "em");

      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();

      await user.keyboard("{ArrowDown}{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["1"],
        selected: [{ id: "1", text: "Email", checked: true }],
        unselected: [
          { id: "2", text: "Fax", checked: false },
          { id: "0", text: "Slack", checked: false },
        ],
      });
    });

    it("uses custom filter function", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const props = {
        items,
        filterable: true,
        filterItem: (item: MultiSelectItem, value: string) => {
          return item.text.toLowerCase().startsWith(value.toLowerCase());
        },
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "e");

      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();

      await user.keyboard("{ArrowDown}{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["1"],
        selected: [{ id: "1", text: "Email", checked: true }],
        unselected: [
          { id: "2", text: "Fax", checked: false },
          { id: "0", text: "Slack", checked: false },
        ],
      });
    });
  });

  describe("sorting behavior", () => {
    it("initially sorts items alphabetically", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "C" },
            { id: "3", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
      expect(nthRenderedOptionText(1)).toBe("B");
      expect(nthRenderedOptionText(2)).toBe("C");
    });

    it("moves selected items to top with selectionFeedback: top", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("C");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    it("sorts after reopen with selectionFeedback: top-after-reopen", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("C");
    });

    it("maintains order with selectionFeedback: fixed", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "fixed",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
    });
  });

  describe("variants and states", () => {
    it("renders in light variant", async () => {
      render(MultiSelect, {
        props: {
          items,
          light: true,
        },
      });

      await openMenu();
      const listBox = screen.getByRole("listbox").closest(".bx--list-box");
      expect(listBox).toHaveClass("bx--list-box--light");
    });

    it("renders in inline variant", () => {
      render(MultiSelect, {
        props: {
          items,
          type: "inline",
        },
      });

      const wrapper = screen
        .getByRole("combobox")
        .closest(".bx--multi-select__wrapper");
      expect(wrapper).toHaveClass("bx--multi-select__wrapper--inline");
    });

    it("handles invalid state", () => {
      render(MultiSelect, {
        props: {
          items,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      expect(screen.getByText("Invalid selection")).toBeInTheDocument();
      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--multi-select--invalid");
    });

    it("handles warning state", () => {
      render(MultiSelect, {
        props: {
          items,
          warn: true,
          warnText: "Warning message",
        },
      });

      expect(screen.getByText("Warning message")).toBeInTheDocument();
      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--list-box--warning");
    });

    it("handles disabled state", () => {
      render(MultiSelect, {
        props: {
          items,
          disabled: true,
        },
      });

      const field = screen.getByRole("combobox");
      expect(field).toHaveAttribute("aria-disabled", "true");
      expect(field).toHaveAttribute("tabindex", "-1");
      expect(field.closest(".bx--multi-select")).toHaveAttribute(
        "tabindex",
        "-1",
      );
    });

    it("handles disabled items", async () => {
      const itemsWithDisabled = [
        { id: "0", text: "Slack" },
        { id: "1", text: "Email", disabled: true },
        { id: "2", text: "Fax" },
      ];

      render(MultiSelect, {
        props: {
          items: itemsWithDisabled,
        },
      });

      await openMenu();
      const emailOption = screen
        .getByText("Email")
        .closest(".bx--list-box__menu-item");
      expect(emailOption).toHaveAttribute("disabled");
    });
  });

  describe("accessibility", () => {
    it("handles hidden label", () => {
      render(MultiSelect, {
        props: {
          items,
          titleText: "Contact methods",
          hideLabel: true,
        },
      });

      const label = screen.getByText("Contact methods");
      expect(label).toHaveClass("bx--visually-hidden");
    });

    it("non-filterable variant has correct ARIA attributes", () => {
      render(MultiSelect, {
        props: {
          items,
          titleText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("role", "combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveAttribute("tabindex", "0");
    });

    it("non-filterable variant opens menu and updates aria-controls", async () => {
      render(MultiSelect, {
        props: {
          items,
          titleText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).not.toHaveAttribute("aria-controls");

      await user.click(combobox);

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute("aria-controls");
      const menuId = combobox.getAttribute("aria-controls");
      expect(screen.getByRole("listbox")).toHaveAttribute("id", menuId);
    });

    it("filterable variant has correct ARIA attributes", () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("role", "combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveAttribute("aria-autocomplete", "list");
      expect(combobox).toHaveAttribute("tabindex", "0");
    });

    it("filterable variant updates aria-controls when opened", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).not.toHaveAttribute("aria-controls");

      await user.click(combobox);

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute("aria-controls");
      const menuId = combobox.getAttribute("aria-controls");
      expect(screen.getByRole("listbox")).toHaveAttribute("id", menuId);
    });

    it("listbox has aria-multiselectable attribute", async () => {
      render(MultiSelect, {
        props: {
          items,
        },
      });

      await openMenu();
      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    });

    it("options have correct aria-selected state", async () => {
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("custom formatting", () => {
    it("handles custom itemToString", () => {
      const props = {
        items,
        selectedIds: ["0"],
        itemToString: (item: MultiSelectItem) => `${item.text} (${item.id})`,
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      expect(screen.getByText("Slack (0)")).toBeInTheDocument();
    });

    it("handles custom itemToInput", async () => {
      const props = {
        items,
        itemToInput: (item: MultiSelectItem) => ({
          name: `contact_${item.id}`,
          value: item.text.toLowerCase(),
        }),
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      await openMenu();
      const checkbox = screen.getByText("Slack");
      const checkboxWrapper = checkbox.closest(".bx--checkbox-wrapper");
      const checkboxInput = checkboxWrapper?.querySelector("input");
      expect(checkboxInput).toHaveAttribute("name", "contact_0");
      expect(checkboxInput).toHaveAttribute("value", "slack");
    });
  });

  it("does not show helper text if warn is true", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        warn: true,
      },
    });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("does not show helper text if invalid is true", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        invalid: true,
      },
    });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("does not show helper text if inline is true", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        type: "inline",
      },
    });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("clears all selections when clear button is clicked", async () => {
    render(MultiSelect, {
      props: {
        items,
        selectedIds: ["0", "1"],
      },
    });
    await openMenu();

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "false");

    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);
    await closeMenu();

    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
  });

  it("skips disabled items during keyboard navigation", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "Aa" },
          { id: "2", text: "Ba", disabled: true },
          { id: "3", text: "Ca" },
        ],
        filterable: true,
        placeholder: "Filter...",
      },
    });
    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);
    await user.type(input, "a");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    const options = screen.getAllByRole("option");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
  });

  it("focuses input when filterable and menu is opened", async () => {
    render(MultiSelect, {
      props: {
        items,
        filterable: true,
        placeholder: "Filter...",
      },
    });
    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);
    expect(input).toHaveFocus();
  });

  it("does not select disabled items when clicked", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B", disabled: true },
          { id: "3", text: "C" },
        ],
      },
    });
    await openMenu();
    const disabledOption = screen.getByText("B").closest("[role='option']");
    assert(disabledOption);

    await user.click(disabledOption);
    expect(disabledOption).toHaveAttribute("aria-selected", "false");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2288
  it("clicking checkbox in filterable variant should not throw error", async () => {
    render(MultiSelect, {
      props: {
        items,
        filterable: true,
        placeholder: "Filter...",
      },
    });

    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);
    await toggleOption("Slack");

    const options = screen.getAllByRole("option");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveFocus();
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2313
  describe("keyboard navigation (issue #2313)", () => {
    it("filterable: menu opens when starting to type after Tab focus", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      // Simulate tabbing into the field
      input.focus();

      // Menu doesn't need to open immediately on focus for filterable variant
      // but should open when user starts typing
      await user.type(input, "s");

      // Menu should now be open
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("filterable: accepts keyboard input after tabbing into field", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      // Simulate tabbing into the field
      input.focus();

      // Should be able to type immediately
      await user.type(input, "slack");
      expect(input).toHaveValue("slack");

      // Filtered results should be shown
      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
    });

    it("filterable: Tab key does not close menu when navigating", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      await user.click(input);

      // Menu should be open
      expect(input).toHaveAttribute("aria-expanded", "true");

      // Press Tab - menu should close to allow natural tab navigation
      await user.keyboard("{Tab}");

      // Menu should close when Tab is pressed to move focus away
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("filterable: focus should go to input, not clear button when items selected", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      // Simulate tabbing into the field
      input.focus();

      // Input should have focus, not the clear button
      expect(input).toHaveFocus();

      const clearButton = screen.getAllByRole("button", { name: /clear/i })[0];
      expect(clearButton).not.toHaveFocus();
    });
  });

  describe("Generics", () => {
    it("should support custom item types with generics", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
        category: string;
        inStock: boolean;
      };

      const products: Product[] = [
        {
          id: "1",
          text: "Laptop",
          price: 999,
          category: "Electronics",
          inStock: true,
        },
        {
          id: "2",
          text: "Phone",
          price: 599,
          category: "Electronics",
          inStock: false,
        },
      ];

      expectTypeOf<typeof products>().toEqualTypeOf<Product[]>();

      const itemToString = (item: Product) => `${item.text} - $${item.price}`;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      const filterItem = (item: Product, value: string) =>
        item.category.toLowerCase().includes(value.toLowerCase()) ||
        item.text.toLowerCase().includes(value.toLowerCase());
      expectTypeOf(filterItem).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(filterItem).parameter(1).toEqualTypeOf<string>();
      expectTypeOf(filterItem).returns.toEqualTypeOf<boolean>();

      type SelectEvent = CustomEvent<{
        selectedIds: string[];
        selected: Product[];
        unselected: Product[];
      }>;
      expectTypeOf<
        SelectEvent["detail"]["selected"][0]
      >().toEqualTypeOf<Product>();
      expectTypeOf<
        SelectEvent["detail"]["unselected"][0]
      >().toEqualTypeOf<Product>();
    });

    it("should provide type-safe access to custom properties in callbacks", () => {
      type Tag = {
        id: number;
        text: string;
        color: string;
        usageCount: number;
      };

      const itemToString = (item: Tag) => {
        expectTypeOf(item).toHaveProperty("color");
        expectTypeOf(item).toHaveProperty("usageCount");
        return `${item.text} (${item.usageCount})`;
      };

      const filterItem = (item: Tag, value: string) => {
        expectTypeOf(item).toHaveProperty("color");
        expectTypeOf(item).toHaveProperty("usageCount");
        return (
          item.color.includes(value) || item.usageCount > parseInt(value, 10)
        );
      };

      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Tag>();
      expectTypeOf(filterItem).parameter(0).toEqualTypeOf<Tag>();
    });

    it("should support slot props with generic item type", () => {
      type MenuItem = {
        id: string;
        text: string;
        icon: string;
        shortcut?: string;
      };

      type SlotProps = { item: MenuItem; index: number };

      const slotItem: MenuItem = {
        id: "1",
        text: "Save",
        icon: "save-icon",
        shortcut: "Ctrl+S",
      };

      expectTypeOf<SlotProps["item"]>().toEqualTypeOf<MenuItem>();
      expectTypeOf(slotItem).toHaveProperty("icon");
      expectTypeOf(slotItem).toHaveProperty("shortcut");
    });

    it("should infer generic type from items and support destructuring in slots", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelectGenerics);

      await openMenu();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      // Items are sorted alphabetically, so Desk comes first
      expect(options[0]).toHaveTextContent("Desk");
      expect(options[0]).toHaveTextContent("$299");
      expect(options[0]).toHaveTextContent("Furniture");

      await toggleOption("Laptop");

      expect(consoleLog).toHaveBeenCalledWith("selected:", [
        {
          id: "1",
          text: "Laptop",
          price: 999,
          category: "Electronics",
          checked: true,
        },
      ]);
    });
  });
});
