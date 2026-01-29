import { render, screen, waitFor, within } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import MultiSelectLabelSlot from "./MultiSelect.slot.test.svelte";
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
        labelText: "Contact methods",
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

  // Regression: ?? for itemToString so item.text "" is used (not id)
  it("displays empty string when item.text is empty (nullish coalescing)", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "" },
          { id: "2", text: "Email" },
        ],
        labelText: "Contact",
        itemToString: (item: { id: string; text: string }) =>
          item.text ?? item.id,
      },
    });
    await openMenu();
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("");
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", async () => {
    render(MultiSelect, {
      props: {
        items: [{ id: "1", text: "Email" }],
        labelText: "Contact",
        ariaLabel: "",
      },
    });
    await openMenu();
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "");
  });

  describe("selection behavior", () => {
    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
    it("does not fire select event on initial render", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      expect(consoleLog).not.toHaveBeenCalled();

      await openMenu();
      await toggleOption("Email");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["0", "1"],
        selected: [
          { id: "0", text: "Slack", checked: true },
          { id: "1", text: "Email", checked: true },
        ],
        unselected: [{ id: "2", text: "Fax", checked: false }],
      });
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
    it("does not fire select event on initial render without selectedIds", () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items },
      });

      expect(consoleLog).not.toHaveBeenCalled();
    });

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
      const emailOption = screen.getByRole("option", { name: "Email" });
      expect(emailOption).toHaveAttribute("disabled");
    });
  });

  describe("accessibility", () => {
    it("handles hidden label", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
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
          labelText: "Contact methods",
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
          labelText: "Contact methods",
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

    it("options have correct aria-checked state for screen reader announcement", async () => {
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-checked", "true");
      expect(options[1]).toHaveAttribute("aria-checked", "false");
      expect(options[2]).toHaveAttribute("aria-checked", "false");

      await toggleOption("Email");
      expect(options[1]).toHaveAttribute("aria-checked", "true");
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
      const checkbox = screen.getByRole("checkbox", { name: "Slack" });
      expect(checkbox).toHaveAttribute("name", "contact_0");
      expect(checkbox).toHaveAttribute("value", "slack");
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
    const disabledOption = screen.getByRole("option", { name: "B" });

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
    it("filterable: menu opens when tabbing into field", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      await user.tab();
      expect(input).toHaveFocus();

      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("filterable: first character shows correctly after tabbing", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      await user.tab();
      expect(input).toHaveFocus();

      await user.type(input, "s");
      expect(input).toHaveValue("s");

      await user.type(input, "lack");
      expect(input).toHaveValue("slack");

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
      expect(input).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Tab}");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("filterable: focus goes to input, not clear button", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      const clearButton = screen.getAllByRole("button", { name: /clear/i })[0];

      expect(clearButton).toHaveAttribute("tabindex", "-1");
      await user.tab();

      expect(input).toHaveFocus();
      expect(clearButton).not.toHaveFocus();
      expect(input).toHaveAttribute("aria-expanded", "true");
    });

    it("filterable: clear button is not keyboard accessible but works with mouse", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      const clearButton = screen.getAllByRole("button", { name: /clear/i })[0];

      expect(clearButton).toHaveAttribute("tabindex", "-1");
      await user.click(clearButton);

      await user.click(input);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
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
          item.color.includes(value) ||
          item.usageCount > Number.parseInt(value, 10)
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

    it("should support generic types with ComponentProps and ComponentEvents", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
        category: string;
        inStock: boolean;
      };

      type ComponentType = MultiSelectComponent<Product>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      const itemToString = (item: Product) => item.text;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      const itemToInput = (item: Product) => ({
        name: item.id,
        value: item.id,
      });
      expectTypeOf(itemToInput).parameter(0).toEqualTypeOf<Product>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail["selected"][0]>().toEqualTypeOf<Product>();
      expectTypeOf<
        SelectEventDetail["unselected"][0]
      >().toEqualTypeOf<Product>();
    });

    it("should default to MultiSelectItem when generic is not specified", () => {
      type ComponentType = MultiSelectComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly MultiSelectItem[]
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<
        SelectEventDetail["selected"][0]
      >().toEqualTypeOf<MultiSelectItem>();
      expectTypeOf<
        SelectEventDetail["unselected"][0]
      >().toEqualTypeOf<MultiSelectItem>();
    });

    it("should enforce MultiSelectItem constraint on generic type", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
      };

      type ComponentType = MultiSelectComponent<Product>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      type BaseComponentType = MultiSelectComponent<MultiSelectItem>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["items"]>>().toEqualTypeOf<
        readonly MultiSelectItem[]
      >();
    });

    describe("Id generic parameter", () => {
      it("should default Id to any when not specified", () => {
        type ComponentType = MultiSelectComponent;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
          // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
          readonly any[] | undefined
        >();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<SelectEventDetail["selectedIds"]>().toEqualTypeOf<any[]>();
      });

      it("should support different ID types (string, number, union)", () => {
        // String ID
        type StringItem = { id: string; text: string };
        type StringComponent = MultiSelectComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedIds"]
        >().toEqualTypeOf<readonly string[] | undefined>();

        // Number ID
        type NumberItem = { id: number; text: string };
        type NumberComponent = MultiSelectComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedIds"]
        >().toEqualTypeOf<readonly number[] | undefined>();

        // Union ID
        type UnionId = "a" | "b" | "c";
        type UnionItem = { id: UnionId; text: string };
        type UnionComponent = MultiSelectComponent<UnionItem>;
        type UnionEvents = ComponentEvents<UnionComponent>;
        type UnionSelectDetail =
          UnionEvents["select"] extends CustomEvent<infer T> ? T : never;
        expectTypeOf<UnionSelectDetail["selectedIds"]>().toEqualTypeOf<
          UnionId[]
        >();
      });

      it("should work with 'as const' for literal type inference", () => {
        const items = [
          { id: "option1", text: "Option 1" },
          { id: "option2", text: "Option 2" },
          { id: "option3", text: "Option 3" },
        ] as const;

        type InferredItem = (typeof items)[number];
        type InferredId = InferredItem["id"];

        expectTypeOf<InferredId>().toEqualTypeOf<
          "option1" | "option2" | "option3"
        >();

        type ComponentType = MultiSelectComponent<InferredItem>;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
          readonly InferredId[] | undefined
        >();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        expectTypeOf<SelectEventDetail["selectedIds"]>().toEqualTypeOf<
          InferredId[]
        >();
        expectTypeOf<
          SelectEventDetail["selected"][0]
        >().toEqualTypeOf<InferredItem>();
      });
    });
  });

  it("supports custom label slot", () => {
    render(MultiSelectLabelSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  describe("virtualization", () => {
    const createLargeItemList = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
      }));
    };

    it("should enable virtualization for large lists", async () => {
      const largeItems = createLargeItemList(500);
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

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])("should scroll to selected item when menu opens $description", async ({
      virtualize,
    }) => {
      const largeItems = createLargeItemList(500);
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
    });

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])("should scroll to selected item when menu reopens $description", async ({
      virtualize,
    }) => {
      const largeItems = createLargeItemList(500);
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
    });

    it("should scroll to top when no items are selected", async () => {
      const largeItems = createLargeItemList(500);
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
      const largeItems = createLargeItemList(500);
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
      const largeItems = createLargeItemList(500);
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
      const smallItems = createLargeItemList(50);
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

    it("should use default item height when not specified", async () => {
      const largeItems = createLargeItemList(500);
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
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
    });

    it("should handle virtualization with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 60,
            containerHeight: 300,
          },
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeLessThan(15);
    });

    it("should calculate scroll position correctly with custom item height", async () => {
      const largeItems = createLargeItemList(500);
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

      // Click on the checkbox directly (more reliable than clicking the option)
      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];
      expect(firstCheckbox).toBeDefined();

      // Get the current checked state
      const wasChecked = (firstCheckbox as HTMLInputElement).checked;

      // Click the checkbox to toggle it
      await user.click(firstCheckbox);
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify selection works - the checkbox should have toggled
      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole("checkbox");
        const firstUpdatedCheckbox = updatedCheckboxes[0];
        expect((firstUpdatedCheckbox as HTMLInputElement).checked).toBe(
          !wasChecked,
        );
      });
    });

    it("should override default item height when specified", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 100,
            containerHeight: 500,
          },
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(15);
    });

    it("should maintain selection when virtualized", async () => {
      const largeItems = createLargeItemList(500);
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
      const largeItems = createLargeItemList(500);
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
      // Verify the item is selected - check if any checkbox is checked
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        const checkedCheckboxes = checkboxes.filter(
          (cb) => (cb as HTMLInputElement).checked,
        );
        expect(checkedCheckboxes.length).toBeGreaterThan(0);

        // Also verify we can find Item 2 if it's visible
        const item2Checkbox = checkboxes.find((cb) => {
          const label = cb.closest("label");
          return label?.textContent?.trim() === "Item 2";
        });
        if (item2Checkbox) {
          expect((item2Checkbox as HTMLInputElement).checked).toBe(true);
        }
      });
    });

    it("should apply max-height style when virtualized", async () => {
      const largeItems = createLargeItemList(500);
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
      const largeItems = createLargeItemList(150);
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
      const smallItems = createLargeItemList(100);
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

    it("should not virtualize lists with exactly 100 items when virtualize is undefined", async () => {
      const items = createLargeItemList(100);
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();

      const options = screen.getAllByRole("option");
      // Should render all 100 items (threshold is 100, so > 100 is needed)
      expect(options.length).toBe(100);
    });

    it("should explicitly disable virtualization when virtualize is false, even with large lists", async () => {
      const largeItems = createLargeItemList(100);
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
      const smallItems = createLargeItemList(50);
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
      const largeItems = createLargeItemList(150);
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
  });
});
