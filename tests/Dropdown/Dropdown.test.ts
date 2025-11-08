import { render, screen } from "@testing-library/svelte";
import { expectTypeOf } from "vitest";
import { user } from "../setup-tests";
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
      props: { items, selectedId: "0", titleText: "Contact" },
    });

    expect(screen.getByText("Contact")).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button.querySelector(".bx--list-box__label")).toHaveTextContent(
      "Slack",
    );
  });

  it("should handle custom item display text", () => {
    const props = {
      items,
      selectedId: "0",
      titleText: "Contact",
      itemToString: (item: (typeof items)[number]) =>
        `${item.text} (${item.id})`,
    };

    render(Dropdown, { props });

    const button = screen.getByRole("button");
    expect(button.querySelector(".bx--list-box__label")).toHaveTextContent(
      "Slack (0)",
    );
  });

  it("should handle hidden label", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        titleText: "Contact",
        hideLabel: true,
      },
    });

    const label = screen.getByText("Contact");
    expect(label).toHaveClass("bx--visually-hidden");
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
    const { component } = render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    const selectHandler = vi.fn();
    component.$on("select", selectHandler);

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

    await user.click(screen.getByRole("button"));

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
    expect(button).toHaveTextContent("undefined");
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
      button.querySelector(".bx--list-box__menu-icon svg"),
    ).toHaveAttribute("aria-label", "Open dropdown");
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

      const button = screen.getByRole("button");
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
  });
});
