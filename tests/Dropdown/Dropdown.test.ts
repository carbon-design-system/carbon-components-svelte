import { render, screen, within } from "@testing-library/svelte";
import type DropdownComponent from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { isSvelte5, user } from "../setup-tests";
import Dropdown from "./Dropdown.test.svelte";
import DropdownGenerics from "./DropdownGenerics.test.svelte";
import DropdownSlot from "./DropdownSlot.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("Dropdown", () => {
  it("should render with default props", () => {
    render(Dropdown, {
      props: { items, selectedId: "0", labelText: "Contact" },
    });

    expect(screen.getByText("Contact")).toBeInTheDocument();
    const button = screen.getByLabelText("Contact");
    expect(within(button).getByText("Slack")).toBeInTheDocument();
  });

  it("should handle custom item display text", () => {
    const props = {
      items,
      selectedId: "0",
      labelText: "Contact",
      itemToString: (item: (typeof items)[number]) =>
        `${item.text} (${item.id})`,
    };

    render(Dropdown, { props });

    const button = screen.getByLabelText("Contact");
    expect(within(button).getByText("Slack (0)")).toBeInTheDocument();
  });

  it("should handle hidden label", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        labelText: "Contact",
        hideLabel: true,
      },
    });

    const label = screen.getByText("Contact");
    expect(label).toHaveClass("bx--visually-hidden");
    // Even with hidden label, the button should still be accessible via labelText
    const button = screen.getByLabelText("Contact");
    expect(button).toBeInTheDocument();
  });

  it("should handle light variant", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        light: true,
      },
    });

    const button = screen.getByRole("button");
    expect(button.closest(".bx--dropdown")).toHaveClass("bx--dropdown--light");
  });

  it("should handle inline variant", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        type: "inline",
      },
    });

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Slack");
    expect(button.closest(".bx--dropdown__wrapper")).toHaveClass(
      "bx--dropdown__wrapper--inline",
    );
  });

  it("should handle size variants", async () => {
    const { rerender } = render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        size: "sm",
      },
    });

    const button = screen.getByRole("button");
    expect(button.closest(".bx--dropdown")).toHaveClass("bx--dropdown--sm");

    await rerender({ items, selectedId: "0", size: "xl" });
    expect(button.closest(".bx--dropdown")).toHaveClass("bx--dropdown--xl");
  });

  it("should handle invalid state", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        invalid: true,
        invalidText: "Invalid selection",
      },
    });

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Slack");
    expect(button.closest(".bx--dropdown")).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(screen.getByText("Invalid selection")).toBeInTheDocument();
  });

  it("should handle warning state", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        warn: true,
        warnText: "Warning message",
      },
    });

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Slack");
    expect(button.closest(".bx--dropdown")).toHaveClass(
      "bx--dropdown--warning",
    );
    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        disabled: true,
      },
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("disabled");
    expect(screen.getByRole("button")).toHaveTextContent("Slack");
  });

  it("should handle helper text", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        helperText: "Help text",
      },
    });

    expect(screen.getByText("Help text")).toHaveClass("bx--form__helper-text");
  });

  it("should handle item selection", async () => {
    const selectHandler = vi.fn();
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        onselect: selectHandler,
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    const menuItemText = screen.getByText("Email");
    const menuItem = menuItemText.closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.click(menuItem);

    expect(selectHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { selectedId: "1", selectedItem: items[1] },
      }),
    );
  });

  it("should handle keyboard navigation", async () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      "Slack",
    );

    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveTextContent("Email");
  });

  it("should handle disabled items", async () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax" },
    ];

    render(Dropdown, {
      props: {
        items: itemsWithDisabled,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    const menuItemText = screen.getByText("Email");
    const menuItem = menuItemText.closest(".bx--list-box__menu-item");
    expect(menuItem).not.toBeNull();
    expect(menuItem).toHaveAttribute("disabled");
  });

  it("should handle custom slot content", async () => {
    render(DropdownSlot);

    await user.click(screen.getByLabelText("Custom slot dropdown"));

    const customItems = screen.getAllByTestId("custom-item");
    expect(customItems).toHaveLength(3);
    expect(customItems[0]).toHaveTextContent("Item 1: Option 1");
    expect(customItems[1]).toHaveTextContent("Item 2: Option 2");
    expect(customItems[2]).toHaveTextContent("Item 3: Option 3");
  });

  it("should close on outside click", async () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should handle direction prop", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        direction: "top",
      },
    });

    const dropdown = screen.getByRole("button").closest(".bx--dropdown");
    expect(dropdown).toHaveClass("bx--list-box--up");
  });

  it("should handle keyboard navigation with disabled items", async () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax" },
    ];

    render(Dropdown, {
      props: {
        items: itemsWithDisabled,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Fax");
  });

  it("should handle keyboard navigation wrapping around", async () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Fax");

    await user.click(button);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Slack");
  });

  it("should handle empty items array", () => {
    render(Dropdown, {
      props: {
        items: [],
        selectedId: undefined,
      },
    });

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    // In Svelte 5, null and undefined are rendered as empty strings in the DOM (expected behavior).
    // See: https://svelte.dev/docs/svelte/v5-migration-guide
    // When label is undefined, it renders as "" instead of "undefined", so the button's
    // accessible name falls back to the aria-label from ListBoxMenuIcon ("Open menu").
    if (isSvelte5) {
      expect(button).toHaveTextContent("Open menu");
    } else {
      expect(button).toHaveTextContent("undefined");
    }
  });

  it("should handle translateWithId prop", () => {
    const translateWithId = (id: "open" | "close") => {
      const translations = {
        open: "Open dropdown",
        close: "Close dropdown",
      };
      return translations[id];
    };

    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        translateWithId,
      },
    });

    const button = screen.getByRole("button");
    expect(
      within(button).getByRole("img", { name: "Open dropdown" }),
    ).toBeInTheDocument();
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

      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Tag>();
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
      render(DropdownGenerics);

      const button = screen.getByLabelText("Products");
      await user.click(button);

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

      type ComponentType = DropdownComponent<Product>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      const itemToString = (item: Product) => item.text;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<
        SelectEventDetail["selectedItem"]
      >().toEqualTypeOf<Product>();
    });

    it("should default to DropdownItem when generic is not specified", () => {
      type ComponentType = DropdownComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly DropdownItem[]
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<
        SelectEventDetail["selectedItem"]
      >().toEqualTypeOf<DropdownItem>();
    });
  });

  it("should support typeahead when typing with menu open", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
          { id: "3", text: "Date" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    // Type 'b' to find Banana
    await user.keyboard("b");

    // Banana should be highlighted (not selected)
    const bananaOption = screen.getByRole("option", { name: "Banana" });
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");

    // Selected item should still be Apple
    expect(button).toHaveTextContent("Apple");

    // Press Enter to select Banana
    await user.keyboard("{Enter}");
    expect(button).toHaveTextContent("Banana");
  });

  it("should support typeahead with multiple characters", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Apricot" },
          { id: "2", text: "Banana" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    // Type 'apr' to find Apricot
    await user.keyboard("apr");

    const apricotOption = screen.getByRole("option", { name: "Apricot" });
    expect(apricotOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("should skip disabled items in typeahead search", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana", disabled: true },
          { id: "2", text: "Blueberry" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    // Type 'b' - should skip Banana and find Blueberry
    await user.keyboard("b");

    const blueberryText = screen.getByText("Blueberry");
    const blueberryOption = blueberryText.closest(".bx--list-box__menu-item");
    expect(blueberryOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("should be case-insensitive in typeahead search", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    // Type 'B' (uppercase) to find Banana
    await user.keyboard("B");

    const bananaText = screen.getByText("Banana");
    const bananaOption = bananaText.closest(".bx--list-box__menu-item");
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("should wrap around to beginning in typeahead search", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
        selectedId: "2",
      },
    });

    const button = screen.getByRole("button");
    await user.click(button);

    // Navigate down to beyond the last item, which should wrap
    await user.keyboard("{ArrowDown}");

    // Now type 'b' - should wrap around to find Banana
    await user.keyboard("b");

    const bananaText = screen.getByText("Banana");
    const bananaOption = bananaText.closest(".bx--list-box__menu-item");
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });
});
