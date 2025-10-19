import { render, screen, waitFor } from "@testing-library/svelte";
import type ComboBoxComponent from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ComboBoxSlot from "./ComboBox.slot.test.svelte";
import ComboBox from "./ComboBox.test.svelte";
import ComboBoxCustom from "./ComboBoxCustom.test.svelte";
import ComboBoxGenerics from "./ComboBoxGenerics.test.svelte";

describe("ComboBox", () => {
  const getInput = () => {
    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    return input;
  };

  const getClearButton = () => {
    return screen.getByRole("button", { name: "Clear selected item" });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(ComboBox);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(getInput()).toHaveAttribute("placeholder", "Select contact method");
  });

  it("should open menu on click", async () => {
    render(ComboBox);

    await user.click(getInput());

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should handle item selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox);

    await user.click(getInput());
    await user.click(screen.getByText("Email"));

    expect(consoleLog).toHaveBeenCalledWith("select", {
      selectedId: "1",
      selectedItem: { id: "1", text: "Email", price: 200 },
    });
    expect(getInput()).toHaveValue("Email");
  });

  it("should handle keyboard navigation", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Slack");
  });

  it("should handle clear selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    await user.click(getClearButton());

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(getInput()).toHaveValue("");
  });

  it("should handle clear selection via keyboard navigation (Enter)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(getInput()).toHaveValue("");
  });

  it("should handle clear selection via keyboard navigation (Space)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard(" ");
    await tick();

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    // Wait for binding updates to complete
    await tick();
    expect(getInput()).toHaveValue("");
  });

  it("should use custom translations when translateWithId is provided", () => {
    const customTranslations = {
      clearSelection: "Remove selected item",
      clearAll: "Remove all items",
    } as const;

    const props = {
      selectedId: "1",
      value: "Email",
      translateWithIdSelection: (id: keyof typeof customTranslations) =>
        customTranslations[id],
    } satisfies ComponentProps<ComboBox>;

    render(ComboBox, { props });

    const clearButton = screen.getByRole("button", {
      name: "Remove selected item",
    });
    expect(clearButton).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    render(ComboBox, { props: { disabled: true } });

    expect(getInput()).toBeDisabled();
    expect(screen.getByText("Contact")).toHaveClass("bx--label--disabled");
  });

  it("should handle hidden label", () => {
    render(ComboBox, {
      props: {
        labelText: "Hidden Label",
        hideLabel: true,
      },
    });

    expect(screen.getByText("Hidden Label")).toHaveClass("bx--visually-hidden");
  });

  it("should handle invalid state", () => {
    render(ComboBox, {
      props: {
        invalid: true,
        invalidText: "Invalid selection",
      },
    });

    expect(screen.getByRole("listbox")).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("Invalid selection")).toBeInTheDocument();
  });

  it("should handle warning state", () => {
    render(ComboBox, {
      props: {
        warn: true,
        warnText: "Warning message",
      },
    });

    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should handle helper text", () => {
    render(ComboBox, { props: { helperText: "Helper message" } });

    expect(screen.getByText("Helper message")).toBeInTheDocument();
  });

  it("should handle light variant", () => {
    render(ComboBox, { props: { light: true } });

    expect(getInput()).toHaveClass("bx--text-input--light");
  });

  test.each([
    ["sm", "bx--list-box--sm"],
    ["xl", "bx--list-box--xl"],
  ] as const)("should handle size variants", (size, className) => {
    render(ComboBox, { props: { size } });
    expect(screen.getByRole("listbox")).toHaveClass(className);
  });

  it("should handle filtering items", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.type(input, "em");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Email");

    await user.clear(input);
    expect(input).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.click(document.body);
    expect(input).not.toHaveFocus();

    await user.keyboard("{Tab}");
    expect(input).toHaveFocus();

    await user.type(input, "a");
    await user.click(screen.getAllByRole("option")[1]);
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(input).not.toHaveFocus();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("should clear input when clicking clear button", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, { props: { selectedId: "1" } });

    expect(consoleLog).not.toBeCalled();
    await user.click(getClearButton());

    expect(getInput()).toHaveValue("");
    expect(consoleLog).toHaveBeenCalledWith("clear", "clear");
  });

  it("should handle disabled items", async () => {
    render(ComboBoxCustom);

    await user.click(getInput());
    const disabledOption = screen.getByRole("option", { name: /Fax/ });
    expect(disabledOption).toHaveAttribute("disabled", "true");
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");

    await user.click(disabledOption);
    expect(getInput()).toHaveValue("");

    // Dropdown remains open
    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should handle custom item display", async () => {
    render(ComboBoxCustom);

    await user.click(getInput());
    const options = screen.getAllByRole("option");

    expect(options[0]).toHaveTextContent("Item Slack");
    expect(options[1]).toHaveTextContent("Item Email");
    expect(options[2]).toHaveTextContent("Item Fax");
  });

  it("should handle top direction", async () => {
    render(ComboBoxCustom, { props: { direction: "top" } });

    await user.click(screen.getAllByRole("button")[0]);
    expect(screen.getByRole("listbox")).toHaveClass("bx--list-box--up");
  });

  it("should clear filter on selection clear", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    await user.click(getClearButton());
    expect(getInput()).toHaveValue("");
  });

  it("should programmatically clear selection", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("should not re-focus textbox if clearOptions.focus is false", async () => {
    render(ComboBoxCustom, {
      props: {
        selectedId: "1",
        clearOptions: { focus: false },
      },
    });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(input).not.toHaveFocus();
  });

  it("should close menu on Escape key", async () => {
    render(ComboBox);

    expect(getInput()).toHaveValue("");

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveFocus();
  });

  it("should close menu and clear selection on Escape key", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(getInput()).toHaveValue("Email");

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveFocus();
  });

  it("should use custom shouldFilterItem function", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Banana" },
          { id: "3", text: "Cherry" },
        ],
        shouldFilterItem: (item: { text: string }, value: string) =>
          item.text.startsWith(value),
      },
    });
    const input = getInput();
    await user.click(input);
    await user.type(input, "B");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("should use custom itemToString function", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Banana" },
        ],
        itemToString: (item: { text: string }) => `Item ${item.text}`,
      },
    });
    const input = getInput();
    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Item Apple");
    await user.click(options[1]);
    expect(input).toHaveValue("Item Banana");
  });

  it("should open menu if open prop is true on mount", () => {
    render(ComboBox, { props: { open: true } });
    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should skip disabled items during keyboard navigation", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B", disabled: true },
          { id: "3", text: "C" },
        ],
      },
    });
    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}"); // should highlight A
    await user.keyboard("{ArrowDown}"); // should skip B and highlight C
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("C");
  });

  it("should not show helper text if warn is true", () => {
    render(ComboBox, { props: { helperText: "Help", warn: true } });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("should not show helper text if invalid is true", () => {
    render(ComboBox, { props: { helperText: "Help", invalid: true } });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("should not open menu when input is focused via keyboard", async () => {
    render(ComboBox);

    await user.keyboard("{Tab}");
    expect(getInput()).toHaveFocus();

    const dropdown = screen.queryAllByRole("listbox")[1];
    expect(dropdown).toBeUndefined();
  });

  it("should preserve custom value when allowCustomValue is true and user clicks away", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Value");
    await user.click(document.body);
    expect(input).toHaveValue("Custom Value");
  });

  it("should preserve custom value when allowCustomValue is true and menu closes", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "My Custom Text");
    await user.keyboard("{Tab}");
    expect(input).toHaveValue("My Custom Text");
  });

  it("should clear custom value when allowCustomValue is false (default behavior)", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Value");
    await user.click(document.body);
    expect(input).toHaveValue("");
  });

  it("should preserve custom value when allowCustomValue is true and Enter is pressed", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "New Custom Entry");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("New Custom Entry");
  });

  it("should still allow selecting items from list when allowCustomValue is true", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    expect(input).toHaveValue("Email");
  });

  it("should show all items when reopening after selection when clearFilterOnOpen is true", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: true } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Slack");
    expect(options[1]).toHaveTextContent("Email");
    expect(options[2]).toHaveTextContent("Fax");
  });

  it("should retain filter when reopening by default (clearFilterOnOpen is false)", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: false } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Email");
  });

  it("should clear filter on open but restore value on close without selection", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: true, selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(input);
    expect(input).toHaveValue("");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);

    await user.click(document.body);
    expect(input).toHaveValue("Email");
  });

  it("should reset value when menu closes with no selectedItem, input not focused, and allowCustomValue is false", async () => {
    render(ComboBox, { props: { allowCustomValue: false } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Text");

    await user.click(document.body);
    expect(input).not.toHaveFocus();

    // Value should be reset when:
    // - no selectedItem
    // - input is not focused (ref.contains(document.activeElement) is false)
    // - allowCustomValue is false
    expect(input).toHaveValue("");
  });

  describe("Typeahead", () => {
    it("should autocomplete with typeahead when typing", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
            { id: "3", text: "Banana", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Ap");

      // Should show "Apple" with "ple" highlighted
      expect(input).toHaveValue("Apple");
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(5);
    });

    it("should filter items using prefix matching when typeahead is enabled", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
            { id: "3", text: "Cherry", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "B");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("Banana");
    });

    it("should ignore shouldFilterItem when typeahead is enabled", async () => {
      const customFilter = vi.fn(() => true);
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
          shouldFilterItem: customFilter,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");

      // shouldFilterItem should not be called when typeahead is enabled
      expect(customFilter).not.toHaveBeenCalled();
    });

    it("should use case-insensitive prefix matching with typeahead", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "apricot", price: 200 },
            { id: "3", text: "AVOCADO", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "a");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Apple");
      expect(options[1]).toHaveTextContent("apricot");
      expect(options[2]).toHaveTextContent("AVOCADO");
    });

    it("should not autocomplete when deleting characters", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      // Delete all characters
      await user.clear(input);
      await user.type(input, "A");

      // Type another character
      await user.keyboard("p");
      expect(input).toHaveValue("Apple");

      // Now delete the suggestion and one character
      await user.keyboard("{Backspace}");
      await user.keyboard("{Backspace}");

      // Should have just "A" after deleting
      expect(input).toHaveValue("A");
    });

    it("should show all items when input is empty with typeahead", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
            { id: "3", text: "Cherry", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
    });

    it("should update autocomplete suggestion as user types", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
            { id: "3", text: "Avocado", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      // Clear and type "Ap" - should suggest "Apple"
      await user.clear(input);
      await user.type(input, "Ap");
      expect(input).toHaveValue("Apple");

      // Clear and type "Apr" - should suggest "Apricot"
      await user.clear(input);
      await user.type(input, "Apr");
      expect(input).toHaveValue("Apricot");
    });

    it("should allow selecting autocompleted item", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      await user.keyboard("{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedId: "1",
        selectedItem: { id: "1", text: "Apple", price: 100 },
      });
    });

    it("should not show suggestion when no items match prefix", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Z");

      expect(input).toHaveValue("Z");
      expect(screen.queryByRole("option")).not.toBeInTheDocument();
    });

    it("should work with typeahead and keyboard navigation", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
            { id: "3", text: "Avocado", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      // Navigate down to next item
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("Apricot");
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

      const shouldFilterItem = (item: Product, value: string) =>
        item.category.toLowerCase().includes(value.toLowerCase()) ||
        item.text.toLowerCase().includes(value.toLowerCase());
      expectTypeOf(shouldFilterItem).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(shouldFilterItem).parameter(1).toEqualTypeOf<string>();
      expectTypeOf(shouldFilterItem).returns.toEqualTypeOf<boolean>();

      type SelectEvent = CustomEvent<{
        selectedId: string;
        selectedItem: Product;
      }>;
      expectTypeOf<
        SelectEvent["detail"]["selectedItem"]
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

      const shouldFilterItem = (item: Tag, value: string) => {
        expectTypeOf(item).toHaveProperty("color");
        expectTypeOf(item).toHaveProperty("usageCount");
        return (
          item.color.includes(value) ||
          item.usageCount > Number.parseInt(value, 10)
        );
      };

      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Tag>();
      expectTypeOf(shouldFilterItem).parameter(0).toEqualTypeOf<Tag>();
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
      render(ComboBoxGenerics);

      const input = screen.getByRole("combobox");
      await user.click(input);

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Laptop");
      expect(options[0]).toHaveTextContent("$999");
      expect(options[0]).toHaveTextContent("Electronics");

      await user.click(screen.getByText("Laptop"));

      expect(consoleLog).toHaveBeenCalledWith("selected:", {
        id: "1",
        text: "Laptop",
        price: 999,
        category: "Electronics",
      });
    });

    it("should support generic types with ComponentProps and ComponentEvents", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
        category: string;
        inStock: boolean;
      };

      type ComponentType = ComboBoxComponent<Product>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      type ItemsProp = NonNullable<Props["items"]>;
      expectTypeOf<ItemsProp>().toEqualTypeOf<readonly Product[]>();

      const itemToString = (item: Product) => item.text;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      const shouldFilterItem = (item: Product, value: string) =>
        item.category.includes(value);
      expectTypeOf(shouldFilterItem).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(shouldFilterItem).parameter(1).toEqualTypeOf<string>();
      expectTypeOf(shouldFilterItem).returns.toEqualTypeOf<boolean>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      type SelectedItem = SelectEventDetail["selectedItem"];
      expectTypeOf<SelectedItem>().toEqualTypeOf<Product>();
    });

    it("should default to ComboBoxItem when generic is not specified", () => {
      type ComponentType = ComboBoxComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toHaveProperty("length");

      type ItemElement = NonNullable<Props["items"]>[number];
      expectTypeOf<ItemElement>().toHaveProperty("id");
      expectTypeOf<ItemElement>().toHaveProperty("text");

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      type SelectedItem = SelectEventDetail["selectedItem"];
      expectTypeOf<SelectedItem>().toHaveProperty("id");
      expectTypeOf<SelectedItem>().toHaveProperty("text");
    });

    it("should enforce ComboBoxItem constraint on generic type", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
      };

      type ComponentType = ComboBoxComponent<Product>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      type BaseComponentType = ComboBoxComponent<ComboBoxItem>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["items"]>>().toEqualTypeOf<
        readonly ComboBoxItem[]
      >();
    });

    describe("Id generic parameter", () => {
      it("should default Id to any when not specified", () => {
        type ComponentType = ComboBoxComponent;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["selectedId"]>().toEqualTypeOf<any | undefined>();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<SelectEventDetail["selectedId"]>().toEqualTypeOf<any>();
      });

      it("should support different ID types (string, number, union)", () => {
        // String ID
        type StringItem = { id: string; text: string };
        type StringComponent = ComboBoxComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedId"]
        >().toEqualTypeOf<string | undefined>();

        // Number ID
        type NumberItem = { id: number; text: string };
        type NumberComponent = ComboBoxComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedId"]
        >().toEqualTypeOf<number | undefined>();

        // Union ID
        type UnionId = "a" | "b" | "c";
        type UnionItem = { id: UnionId; text: string };
        type UnionComponent = ComboBoxComponent<UnionItem>;
        type UnionEvents = ComponentEvents<UnionComponent>;
        type UnionSelectDetail =
          UnionEvents["select"] extends CustomEvent<infer T> ? T : never;
        expectTypeOf<
          UnionSelectDetail["selectedId"]
        >().toEqualTypeOf<UnionId>();
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

        type ComponentType = ComboBoxComponent<InferredItem>;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        expectTypeOf<Props["selectedId"]>().toEqualTypeOf<
          InferredId | undefined
        >();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        expectTypeOf<
          SelectEventDetail["selectedId"]
        >().toEqualTypeOf<InferredId>();
        expectTypeOf<
          SelectEventDetail["selectedItem"]
        >().toEqualTypeOf<InferredItem>();
      });
    });
  });

  it("supports custom label slot", () => {
    render(ComboBoxSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

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

      const menu = screen.getAllByRole("listbox")[1];
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeGreaterThan(0);
    });

    it("should reset scroll position when menu reopens", async () => {
      const largeItems = createLargeItemList(500);
      const { rerender } = render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
        },
      });

      await user.click(getInput());

      const menu = screen.getAllByRole("listbox")[1];
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
        const menuAfterReopen = screen.getAllByRole("listbox")[1];
        expectTypeOf(menuAfterReopen).toEqualTypeOf<HTMLElement>();
        expect(menuAfterReopen).toBeInTheDocument();
        return menuAfterReopen;
      });

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
      });
    });

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

      const menu = screen.getAllByRole("listbox")[1];
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

    it("should use default item height when not specified", async () => {
      const largeItems = createLargeItemList(500);
      render(ComboBox, {
        props: {
          items: largeItems,
          virtualize: true,
        },
      });

      await user.click(getInput());

      const menu = screen.getAllByRole("listbox")[1];
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
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

      const menu = screen.getAllByRole("listbox")[1];
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

      const menu = screen.getAllByRole("listbox")[1];
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

      const menu = screen.getAllByRole("listbox")[1];
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(15);
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
      const menu = screen.getAllByRole("listbox")[1];
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();
      expect(menu.style.maxHeight).toBe("400px");
      expect(menu.style.overflowY).toBe("auto");
    });
  });
});
