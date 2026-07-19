import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import type DropdownComponent from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { isSvelte5 } from "../utils/svelte-version";
import { user } from "../utils/user";
import DropdownFluidForm from "./Dropdown.fluidForm.test.svelte";
import DropdownFluidSkeleton from "./Dropdown.fluidSkeleton.test.svelte";
import DropdownFluidSlot from "./Dropdown.fluidSlot.test.svelte";
import DropdownLabelChildren from "./Dropdown.slot.test.svelte";
import Dropdown from "./Dropdown.test.svelte";
import DropdownDuplicateIds from "./DropdownDuplicateIds.test.svelte";
import DropdownGenerics from "./DropdownGenerics.test.svelte";
import DropdownIconSlots from "./DropdownIconSlots.test.svelte";
import DropdownInModal from "./DropdownInModal.test.svelte";
import DropdownItemIcon from "./DropdownItemIcon.test.svelte";
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

  // Regression: ?? for itemToString so item.text "" is used (not id)
  it("should display empty string when item.text is empty (nullish coalescing)", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "1", text: "" },
          { id: "2", text: "Email" },
        ],
        labelText: "Contact",
        selectedId: "1",
      },
    });
    await user.click(screen.getByLabelText("Contact"));
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("");
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("should use empty aria-label when passed (nullish coalescing)", () => {
    const { container } = render(Dropdown, {
      props: {
        items: [{ id: "1", text: "Email" }],
        labelText: "Contact",
        "aria-label": "",
      },
    });
    const dropdown = container.querySelector(".bx--dropdown");
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveAttribute("aria-label", "");
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

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
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
    expect(screen.getByRole("combobox")).toHaveAttribute("disabled");
    expect(screen.getByRole("combobox")).toHaveTextContent("Slack");
  });

  it.each(["disabled", "readonly"] as const)(
    "should suppress invalid and warn states when %s",
    (state) => {
      const { container } = render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          [state]: true,
          invalid: true,
          invalidText: "Invalid selection",
          warn: true,
          warnText: "Warning message",
        },
      });

      const listbox = container.querySelector(".bx--dropdown");
      expect(listbox).not.toHaveAttribute("data-invalid");
      expect(listbox).not.toHaveClass("bx--dropdown--invalid");
      expect(listbox).not.toHaveClass("bx--dropdown--warning");
      expect(container.querySelector(".bx--list-box__invalid-icon")).toBeNull();
      expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
    },
  );

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

  it("should describe the button by helperText", () => {
    render(Dropdown, {
      props: { items, id: "dd", helperText: "Help" },
    });
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-describedby",
      "helper-dd",
    );
    expect(screen.getByText("Help")).toHaveAttribute("id", "helper-dd");
  });

  it("should describe the button by warnText when warn is true", () => {
    render(Dropdown, {
      props: { items, id: "dd", warn: true, warnText: "Warn" },
    });
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-describedby",
      "warn-dd",
    );
    expect(screen.getByText("Warn")).toHaveAttribute("id", "warn-dd");
  });

  it("should describe the button by invalidText when invalid is true", () => {
    render(Dropdown, {
      props: { items, id: "dd", invalid: true, invalidText: "Bad" },
    });
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-describedby",
      "error-dd",
    );
    expect(screen.getByText("Bad")).toHaveAttribute("id", "error-dd");
  });

  it("should not set aria-describedby when no message is shown", () => {
    render(Dropdown, { props: { items, id: "dd" } });
    expect(screen.getByRole("combobox")).not.toHaveAttribute(
      "aria-describedby",
    );
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

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      "Slack",
    );

    // Keyboard nav starts at selected item (index 0, Slack)
    // ArrowDown once: 0 -> 1 (Email)
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveTextContent("Email");
  });

  it("does not select a hover-highlighted item on Enter; closes without selecting", async () => {
    const selectHandler = vi.fn();
    render(Dropdown, {
      props: { items, selectedId: "0", onselect: selectHandler },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);
    expect(screen.getByRole("listbox")).toBeVisible();

    const fax = screen.getByText("Fax").closest(".bx--list-box__menu-item");
    assert(fax);
    await user.hover(fax);
    expect(fax).toHaveClass("bx--list-box__menu-item--highlighted");

    await user.keyboard("{Enter}");
    expect(selectHandler).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveTextContent("Slack");
  });

  // Regression: the Space keydown must cancel its default action so the
  // browser does not scroll the page (and does not synthesize a click)
  // before the keyup handler opens the menu.
  it("should prevent the default page scroll when opening with Space", async () => {
    render(Dropdown, { props: { items, selectedId: "0" } });

    const button = screen.getByRole("combobox");
    button.focus();
    expect(button).toHaveAttribute("aria-expanded", "false");

    const keydown = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(keydown);
    expect(keydown.defaultPrevented).toBe(true);

    // Space opens on keyup.
    await fireEvent.keyUp(button, { key: " " });
    await tick();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
  });

  it("should open the menu on ArrowDown and highlight the first enabled item", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    // Slack (id="0") is the first enabled item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it("should open the menu on ArrowUp and highlight the last enabled item", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{ArrowUp}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    // Fax (id="2") is the last enabled item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);
  });

  it("should open the menu on Alt+ArrowDown without moving the highlight", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(button).toHaveAttribute("aria-activedescendant", "");
  });

  it("should highlight the selected item when opening the menu on Alt+ArrowDown", async () => {
    render(Dropdown, { props: { items, selectedId: "1" } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    // Email (id="1") is the selected item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-1$/);
  });

  it("should close the menu on Alt+ArrowUp", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("should treat Alt+ArrowUp on a closed menu and Alt+ArrowDown on an open menu as no-ops", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    await tick();
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    // The highlight does not move.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
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

    const button = screen.getByRole("combobox");
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

  it("should pass selected and highlighted to the default slot", async () => {
    render(DropdownSlot, { props: { selectedId: "1" } });

    await user.click(screen.getByLabelText("Custom slot dropdown"));

    const customItems = screen.getAllByTestId("custom-item");

    // selectedId "1" is the second item, not index 1.
    expect(customItems[0]).toHaveAttribute("data-selected", "false");
    expect(customItems[1]).toHaveAttribute("data-selected", "true");
    expect(customItems[2]).toHaveAttribute("data-selected", "false");

    await user.hover(customItems[2]);
    expect(customItems[2]).toHaveAttribute("data-highlighted", "true");
    expect(customItems[0]).toHaveAttribute("data-highlighted", "false");
  });

  it("supports custom label slot", () => {
    render(DropdownLabelChildren);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should close on outside click", async () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should stay open when window click has a non-Node target", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        open: true,
      },
    });

    expect(screen.getByRole("listbox")).toBeVisible();

    const event = new Event("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: null });
    window.dispatchEvent(event);

    expect(screen.getByRole("listbox")).toBeVisible();
  });

  it("should handle direction prop", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        direction: "top",
      },
    });

    const dropdown = screen.getByRole("combobox").closest(".bx--dropdown");
    expect(dropdown).toHaveClass("bx--list-box--up");
  });

  it("should not infinite loop when all items are disabled", async () => {
    const allDisabledItems = [
      { id: "0", text: "Slack", disabled: true },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax", disabled: true },
    ];

    render(Dropdown, {
      props: {
        items: allDisabledItems,
        labelText: "Contact",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    // If the while loop has no guard, this would hang forever.
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");

    // No item should be selected since all are disabled.
    const options = screen.getAllByRole("option");
    for (const option of options) {
      expect(option).not.toHaveAttribute("aria-selected", "true");
    }
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

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Keyboard nav starts at selected item (index 0, Slack)
    // ArrowDown once: skips disabled Email (index 1), goes to Fax (index 2)
    await user.keyboard("{ArrowDown}");
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

    const button = screen.getByRole("combobox");
    await user.click(button);

    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Fax");

    await user.click(button);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Slack");
  });

  it("should render with no selected item when selectedId is not provided", async () => {
    render(Dropdown, {
      props: {
        items,
        label: "Choose an option",
        labelText: "Contact",
      },
    });

    const button = screen.getByLabelText("Contact");
    // Should display the label placeholder, not any item text
    expect(within(button).getByText("Choose an option")).toBeInTheDocument();

    // Open the dropdown and select an item
    await user.click(button);
    const menuItemText = screen.getByText("Email");
    const menuItem = menuItemText.closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.click(menuItem);

    // After selection, should display the selected item
    expect(within(button).getByText("Email")).toBeInTheDocument();
  });

  it("should handle empty items array", () => {
    render(Dropdown, {
      props: {
        items: [],
        selectedId: undefined,
      },
    });

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
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

      await user.click(options[0]);

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

    it("should enforce DropdownItem constraint on generic type", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
      };

      type ComponentType = DropdownComponent<Product>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      type BaseComponentType = DropdownComponent<DropdownItem>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["items"]>>().toEqualTypeOf<
        readonly DropdownItem[]
      >();
    });

    describe("Id generic parameter", () => {
      it("should allow selectedId to be undefined (optional)", () => {
        type ComponentType = DropdownComponent;
        type Props = ComponentProps<ComponentType>;

        // selectedId should accept undefined
        expectTypeOf<undefined>().toExtend<Props["selectedId"]>();

        // Should be an optional property (not required)
        expectTypeOf<Record<string, never>>().toExtend<
          Pick<Props, "selectedId">
        >();

        // With a specific item type, selectedId should still accept undefined
        type StringItem = { id: string; text: string };
        type StringComponent = DropdownComponent<StringItem>;
        type StringProps = ComponentProps<StringComponent>;
        expectTypeOf<undefined>().toExtend<StringProps["selectedId"]>();
      });

      it("should default Id to any when not specified", () => {
        type ComponentType = DropdownComponent;
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
        type StringComponent = DropdownComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedId"]
        >().toEqualTypeOf<string | undefined>();

        // Number ID
        type NumberItem = { id: number; text: string };
        type NumberComponent = DropdownComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedId"]
        >().toEqualTypeOf<number | undefined>();

        // Union ID
        type UnionId = "a" | "b" | "c";
        type UnionItem = { id: UnionId; text: string };
        type UnionComponent = DropdownComponent<UnionItem>;
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

        type ComponentType = DropdownComponent<InferredItem>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["selectedId"]>().toEqualTypeOf<
          InferredId | undefined
        >();

        type SelectEvent = ComponentEvents<ComponentType>["select"];
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

    const button = screen.getByRole("combobox");
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

  it("should clear the hover highlight when the cursor leaves the menu", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    await user.click(button);

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await fireEvent.mouseLeave(screen.getByRole("listbox"));
    expect(emailOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
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

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Type 'apr' to find Apricot
    await user.keyboard("apr");

    const apricotOption = screen.getByRole("option", { name: "Apricot" });
    expect(apricotOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  // The typeahead buffer must reset after a delay of inactivity so a
  // later keystroke starts a fresh search instead of appending to a
  // stale buffer. Without the reset, typing "b" then (after a delay) "c"
  // would search "bc" (no match) and leave Banana highlighted instead of
  // moving to Cherry. The selected item (Apple) is intentionally excluded
  // from the assertions because it always carries the highlighted class
  // regardless of typeahead state.
  it("should reset the typeahead buffer after the delay", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Fire keydown only (no keyup) so the menu stays open between keystrokes.
    await fireEvent.keyDown(button, { key: "b" });
    expect(screen.getByRole("option", { name: "Banana" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );

    // Wait past the delay so the buffer clears.
    await new Promise((resolve) => setTimeout(resolve, 600));

    // A fresh keystroke starts a new search ("c" -> Cherry) rather than
    // appending to the stale buffer ("bc" -> no match -> Banana highlighted).
    await fireEvent.keyDown(button, { key: "c" });
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
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

    const button = screen.getByRole("combobox");
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

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Type 'B' (uppercase) to find Banana
    await user.keyboard("B");

    const bananaText = screen.getByText("Banana");
    const bananaOption = bananaText.closest(".bx--list-box__menu-item");
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  // Regression: Space must not be added to the typeahead buffer.
  // Fire keydown only (without keyup) so the menu stays open — this exposes
  // the buffer state. If Space were treated as a typeahead character, the
  // buffer would be " " and the next 'c' keydown would search for " c"
  // (no match), leaving the previous highlight in place.
  it("should not include Space in typeahead buffer", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await fireEvent.keyDown(button, { key: " " });
    await fireEvent.keyDown(button, { key: "c" });

    const cherryOption = screen.getByRole("option", { name: "Cherry" });
    expect(cherryOption).toHaveClass("bx--list-box__menu-item--highlighted");
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

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Navigate down to beyond the last item, which should wrap
    await user.keyboard("{ArrowDown}");

    // Now type 'b' - should wrap around to find Banana
    await user.keyboard("b");

    const bananaText = screen.getByText("Banana");
    const bananaOption = bananaText.closest(".bx--list-box__menu-item");
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  // Regression: non-virtualized lists that overflow the menu's max-height
  // must still scroll the selected option into view when the menu opens.
  // Selected item is aligned to the top of the menu, matching the
  // virtualized branch's behavior.
  it("should scroll selected item to top of menu on open (non-virtualized)", async () => {
    const ITEM_HEIGHT = 40;
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        const role = this.getAttribute("role");
        if (role === "option") {
          // Option ids are scoped as `${dropdownId}-${itemId}`; the item id
          // (a numeric string here) is the last hyphen-delimited segment.
          const index = Number(this.getAttribute("id")?.split("-").pop());
          const top = index * ITEM_HEIGHT;
          return {
            top,
            bottom: top + ITEM_HEIGHT,
            height: ITEM_HEIGHT,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: top,
            toJSON: () => ({}),
          } as DOMRect;
        }
        if (role === "listbox") {
          return {
            top: 0,
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return new DOMRect();
      });

    try {
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
      }));

      render(Dropdown, {
        props: { items: manyItems, selectedId: "42", labelText: "Items" },
      });

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expect(menu.scrollTop).toBe(42 * ITEM_HEIGHT);
      });
    } finally {
      rectSpy.mockRestore();
    }
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
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      "should scroll to selected item when menu opens $description",
      async ({ virtualize }) => {
        const largeItems = createLargeItemList(500);
        render(Dropdown, {
          props: {
            items: largeItems,
            selectedId: "250", // Item 251, in the middle
            virtualize,
          },
        });

        const button = screen.getByRole("combobox");
        await user.click(button);

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
        const largeItems = createLargeItemList(500);
        const { rerender } = render(Dropdown, {
          props: {
            items: largeItems,
            selectedId: "250", // Item 251, in the middle
            virtualize,
          },
        });

        const button = screen.getByRole("combobox");
        await user.click(button);

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

        await waitFor(() => {
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
        });
      },
    );

    it("should scroll to top when no item is selected", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: undefined,
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        expect(menu).toBeVisible();
        // Should scroll to top when no selection
        expect(menu.scrollTop).toBe(0);
      });
    });

    it("should handle selected item at the end of list", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "499", // Last item
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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

    it("should default itemHeight to the size row height", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          size: "sm",
          virtualize: true,
        },
      });

      await user.click(screen.getByRole("combobox"));

      const menu = screen.getByRole("listbox");
      // 500 items at 32px (sm), spacer height 16000px
      const spacer = menu.querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe("16000px");
    });

    it("should accept virtualization configuration object", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: {
            itemHeight: 50,
            containerHeight: 400,
            overscan: 5,
            threshold: 50,
            maxItems: 20,
          },
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // With maxItems: 20, should render at most 20 items
      expect(options.length).toBeLessThanOrEqual(20);
    });

    it("should not virtualize lists below threshold", async () => {
      const smallItems = createLargeItemList(50);
      render(Dropdown, {
        props: {
          items: smallItems,
          selectedId: "0",
          virtualize: {
            threshold: 100, // Threshold is 100, list has 50 items
          },
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const options = screen.getAllByRole("option");
      // Should render all items when below threshold
      expect(options.length).toBe(50);
    });

    it("should use default item height when not specified", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
    });

    it("should handle virtualization with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: {
            itemHeight: 60,
            containerHeight: 300,
          },
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeLessThan(15);
    });

    it("should calculate scroll position correctly with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: {
            itemHeight: 80,
            containerHeight: 400,
          },
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();

      menu.scrollTop = 800;
      await tick();

      const optionsAfterScroll = screen.getAllByRole("option");
      expect(optionsAfterScroll.length).toBeGreaterThan(0);

      const firstVisibleOption = optionsAfterScroll[0];
      await user.click(firstVisibleOption);

      const buttonAfterClick = screen.getByRole("combobox");
      expect(buttonAfterClick.textContent).toBeTruthy();
    });

    it("should override default item height when specified in virtualize object", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: {
            itemHeight: 100,
            containerHeight: 500,
          },
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(15);
    });

    it("should maintain selection when virtualized", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "250",
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      expect(button).toHaveTextContent("Item 251");

      await user.click(button);

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
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // Keyboard nav starts at selected item (index 0, Item 1)
      // ArrowDown once: index 0 -> 1 (Item 2)
      // ArrowDown twice: index 1 -> 2 (Item 3)
      // Enter selects Item 3
      expect(button).toHaveTextContent("Item 3");
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
        render(Dropdown, {
          props: {
            items: largeItems,
            selectedId: "250", // Item 251, in the middle
            virtualize,
          },
        });

        const button = screen.getByRole("combobox");
        await user.click(button);

        await waitFor(() => {
          const menu = screen.getByRole("listbox");
          expect(menu).toBeVisible();
        });

        // Press ArrowDown - should move to next item (251 -> 252)
        await user.keyboard("{ArrowDown}");
        await user.keyboard("{Enter}");

        // Should have selected Item 252 (index 251)
        expect(button).toHaveTextContent("Item 252");
      },
    );

    it("should only scroll when highlighted item is outside viewport", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "250", // Item 251, in the middle
          virtualize: true,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: {
            containerHeight: 400,
          },
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      // The ListBoxMenu itself has the style applied
      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();
      expect(menu.style.maxHeight).toBe("400px");
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should automatically enable virtualization for lists with more than 100 items when virtualize is undefined", async () => {
      const largeItems = createLargeItemList(150);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      render(Dropdown, {
        props: {
          items: smallItems,
          selectedId: "0",
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

      const options = screen.getAllByRole("option");
      // Should render all 100 items (threshold is 100, so > 100 is needed)
      expect(options.length).toBe(100);
    });

    it("should explicitly disable virtualization when virtualize is false, even with large lists", async () => {
      const largeItems = createLargeItemList(500);
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: false,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      render(Dropdown, {
        props: {
          items: smallItems,
          selectedId: "0",
          virtualize: true, // Explicitly enabled, but below threshold
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "0",
          virtualize: true, // Explicitly enabled, above threshold
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);

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
      render(Dropdown, {
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
      render(DropdownInModal, {
        props: { modalOpen: true, dropdownOpen: true },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    describe("portaled menu accessible name", () => {
      it("should set aria-label from labelText and omit aria-labelledby on the menu", () => {
        render(Dropdown, {
          props: {
            items: [{ id: "0", text: "A" }],
            labelText: "Preferred channel",
            portalMenu: true,
            open: true,
          },
        });

        const menu = screen.getByRole("listbox", { name: "Preferred channel" });
        expect(menu).toHaveAttribute("aria-label", "Preferred channel");
        expect(menu).not.toHaveAttribute("aria-labelledby");
      });

      it("should use Dropdown aria-label prop for the portaled menu when set", () => {
        render(Dropdown, {
          props: {
            items: [{ id: "0", text: "A" }],
            labelText: "Field label",
            "aria-label": "Explicit popup label",
            portalMenu: true,
            open: true,
          },
        });

        const menu = screen.getByRole("listbox", {
          name: "Explicit popup label",
        });
        expect(menu).toHaveAttribute("aria-label", "Explicit popup label");
      });

      it("should default portaled menu aria-label to Choose an item without labelText or aria-label", () => {
        render(Dropdown, {
          props: {
            items: [{ id: "0", text: "A" }],
            portalMenu: true,
            open: true,
          },
        });

        const menu = screen.getByRole("listbox", { name: "Choose an item" });
        expect(menu).toHaveAttribute("aria-label", "Choose an item");
      });

      it("should resolve listbox accessible name when portaled outside an open Modal", () => {
        render(DropdownInModal, {
          props: { modalOpen: true, dropdownOpen: true },
        });

        const menu = screen.getByRole("listbox", { name: "Contact" });
        expect(menu).toHaveAttribute("aria-label", "Contact");
        expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
          document.body,
        );
      });
    });

    it("should close portaled menu when clicking outside", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          portalMenu: true,
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
        document.body,
      );

      await user.click(document.body);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2699
    it("should close after item click selection with portalMenu", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          portalMenu: true,
          onselect: selectHandler,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      const menuItemText = screen.getByText("Email");
      const menuItem = menuItemText.closest(".bx--list-box__menu-item");
      assert(menuItem);
      await user.click(menuItem);

      expect(selectHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { selectedId: "1", selectedItem: items[1] },
        }),
      );
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", () => {
      render(DropdownInModal, {
        props: {
          modalOpen: true,
          dropdownOpen: true,
          portalMenu: false,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });
  });

  describe("checkmark icon", () => {
    it("should render a checkmark icon for the selected item", async () => {
      render(Dropdown, {
        props: { items, selectedId: "1", labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      const options = screen.getAllByRole("option");
      // "Email" (index 1) is selected – should have the checkmark icon
      const selectedOption = options[1];
      const checkmark = selectedOption.querySelector(
        ".bx--list-box__menu-item__selected-icon",
      );
      expect(checkmark).toBeInTheDocument();

      // Non-selected options should not have the checkmark icon
      expect(
        options[0].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();
      expect(
        options[2].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();
    });

    it("should move the checkmark icon when selection changes", async () => {
      render(Dropdown, {
        props: { items, selectedId: "0", labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      let options = screen.getAllByRole("option");
      expect(
        options[0].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
      expect(
        options[1].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();

      // Select "Email"
      await user.click(options[1]);

      // Re-open the menu
      await user.click(screen.getByRole("combobox"));

      options = screen.getAllByRole("option");
      expect(
        options[0].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();
      expect(
        options[1].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
    });

    it("should not render a checkmark when no item is selected", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      const options = screen.getAllByRole("option");
      for (const option of options) {
        expect(
          option.querySelector(".bx--list-box__menu-item__selected-icon"),
        ).not.toBeInTheDocument();
      }
    });
  });

  // Regression: aria-controls should only be set when the menu is rendered,
  // since ListBoxMenu is removed from the DOM when closed.
  it("should only set aria-controls when the menu is open", async () => {
    render(Dropdown, {
      props: { items, selectedId: "0", labelText: "Contact" },
    });

    const button = screen.getByRole("combobox");
    expect(button).not.toHaveAttribute("aria-controls");

    await user.click(button);
    const menu = screen.getByRole("listbox");
    expect(button).toHaveAttribute("aria-controls", menu.id);

    await user.click(button);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-controls");
  });

  // Regression: translateWithId function prop should not be rendered as a DOM attribute.
  it("should not render translateWithId as a DOM attribute on the button", () => {
    const { container } = render(Dropdown, {
      props: {
        items,
        labelText: "Contact",
        translateWithId: (id: string) => id,
      },
    });
    const button = container.querySelector("button.bx--list-box__field");
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute("translateWithId");
    expect(button).not.toHaveAttribute("translatewithid");
  });

  describe("readonly", () => {
    it("should apply readonly class and aria-readonly", () => {
      const { container } = render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      expect(container.querySelector(".bx--dropdown--readonly")).toBeTruthy();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-readonly",
        "true",
      );
    });

    it("should not open menu on click when readonly", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      await user.click(screen.getByRole("combobox"));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not select on Enter when readonly", async () => {
      const onselect = vi.fn();
      render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true, onselect },
      });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("{Enter}");

      expect(onselect).not.toHaveBeenCalled();
    });
  });

  // Regression: option DOM ids must be scoped to the Dropdown instance id so
  // two Dropdowns sharing item ids don't emit duplicate (invalid) DOM ids, and
  // aria-activedescendant resolves unambiguously.
  describe("option id scoping", () => {
    it("should prefix each option id with the instance id", async () => {
      render(Dropdown, {
        props: { items, id: "contact", labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      const ids = screen.getAllByRole("option").map((option) => option.id);
      expect(ids).toEqual(["contact-0", "contact-1", "contact-2"]);
    });

    it("should keep option ids globally unique across instances", () => {
      render(DropdownDuplicateIds);

      const ids = screen.getAllByRole("option").map((option) => option.id);
      // Two dropdowns, three items each.
      expect(ids).toHaveLength(6);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual([
        "dropdown-a-0",
        "dropdown-a-1",
        "dropdown-a-2",
        "dropdown-b-0",
        "dropdown-b-1",
        "dropdown-b-2",
      ]);
    });

    it("should point aria-activedescendant at the scoped option id", async () => {
      render(Dropdown, {
        props: { items, id: "contact", selectedId: "0", labelText: "Contact" },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      // Opening highlights the selected item (index 0).
      expect(button).toHaveAttribute("aria-activedescendant", "contact-0");

      await user.keyboard("{ArrowDown}");
      expect(button).toHaveAttribute("aria-activedescendant", "contact-1");
    });
  });

  describe("item icons", () => {
    it("should render item.icon left of the label", () => {
      render(DropdownItemIcon);

      const withIcon = screen
        .getByTestId("item-0")
        .closest(".bx--list-box__menu-item");
      expect(
        withIcon?.querySelector(".bx--list-box__menu-item__icon svg"),
      ).toBeInTheDocument();

      const noIcon = screen
        .getByTestId("item-1")
        .closest(".bx--list-box__menu-item");
      expect(
        noIcon?.querySelector(".bx--list-box__menu-item__icon"),
      ).toBeNull();
    });

    it("should expose selected and highlighted on the item slot", () => {
      render(DropdownItemIcon);

      expect(screen.getByTestId("item-0")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("item-1")).toHaveAttribute(
        "data-selected",
        "false",
      );
    });

    it("should render the checkmark when iconRight is absent", () => {
      render(DropdownItemIcon);

      const selected = screen
        .getByTestId("item-0")
        .closest(".bx--list-box__menu-item");
      expect(
        selected?.querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
    });

    it("should prefer the icon slot over item.icon", () => {
      render(DropdownIconSlots);

      expect(screen.getByTestId("left-0")).toBeInTheDocument();
      expect(screen.getByTestId("left-1")).toBeInTheDocument();
    });

    it("should render iconRight instead of the checkmark", () => {
      render(DropdownIconSlots);

      expect(screen.getByTestId("right-0")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("right-1")).toHaveAttribute(
        "data-selected",
        "false",
      );
      expect(
        document.querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeNull();
    });
  });

  describe("fluid variant", () => {
    it("does not render fluid classes by default", () => {
      render(Dropdown, { props: { items, labelText: "Contact" } });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toBeNull();
      expect(document.querySelector(".bx--list-box__divider")).toBeNull();
    });

    it("renders fluid variant and suppresses helper text", () => {
      render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          fluid: true,
          helperText: "Helper text",
        },
      });

      const button = screen.getByLabelText("Contact");
      expect(button.closest(".bx--dropdown__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid",
      );
      expect(
        document.querySelector(".bx--list-box__divider"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(button).not.toHaveAttribute("aria-describedby");
    });

    it("renders the error message inside the fluid wrapper", () => {
      render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          fluid: true,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      const message = screen.getByText("Invalid selection");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--list-box__wrapper--fluid")).not.toBeNull();
      expect(message.closest(".bx--dropdown__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--invalid",
      );
      expect(screen.getByLabelText("Contact")).toHaveAttribute(
        "aria-describedby",
        "error-test-dropdown",
      );
    });

    it("renders the warning message inside the fluid wrapper", () => {
      render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          fluid: true,
          warn: true,
          warnText: "Warning message",
        },
      });

      const message = screen.getByText("Warning message");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--list-box__wrapper--fluid")).not.toBeNull();
    });

    it.each([{ disabled: true }, { readonly: true }])(
      "suppresses invalid and warn states when %o",
      (props) => {
        render(Dropdown, {
          props: {
            items,
            labelText: "Contact",
            fluid: true,
            invalid: true,
            invalidText: "Invalid selection",
            warn: true,
            warnText: "Warning message",
            ...props,
          },
        });

        expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
        expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
        expect(document.querySelector("[data-invalid]")).toBeNull();
      },
    );

    it("marks the wrapper as condensed when fluid", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true, condensed: true },
      });

      const button = screen.getByLabelText("Contact");
      expect(button.closest(".bx--dropdown__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--condensed",
      );
    });

    it("ignores condensed when not fluid", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", condensed: true },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid--condensed"),
      ).toBeNull();
    });

    it("ignores fluid for the inline variant", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true, type: "inline" },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toBeNull();
    });

    it("inherits fluid from the FluidForm context", () => {
      render(DropdownFluidForm);

      const button = screen.getByLabelText("Fluid form dropdown");
      expect(button.closest(".bx--dropdown__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid",
      );
    });

    it("marks the label as slotted when fluid", () => {
      render(DropdownFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(DropdownFluidSlot, { props: { fluid: false } });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
    });

    it("toggles the input-focused class on the fluid field wrapper", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true },
      });

      const button = screen.getByLabelText("Contact");
      const wrapper = button.closest(".bx--list-box__field--wrapper");

      expect(wrapper).toHaveClass("bx--list-box__field--wrapper");
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(button);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(button);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("keeps the input-focused class while the fluid menu is open", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true, open: true },
      });

      const wrapper = screen
        .getByRole("combobox")
        .closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });

  it("renders fluid skeleton state", () => {
    render(DropdownFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-dropdown-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--list-box__wrapper--fluid");
    expect(skeleton.children).toHaveLength(1);

    const listBox = skeleton.children[0];
    expect(listBox).toHaveClass("bx--skeleton", "bx--list-box");
    expect(listBox.children).toHaveLength(2);
    expect(listBox.children[0]).toHaveClass("bx--list-box__label");
    expect(listBox.children[1]).toHaveClass("bx--list-box__field");
  });
});
