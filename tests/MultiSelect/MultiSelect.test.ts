import { fireEvent, render, screen } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import MultiSelectReal from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import MultiSelectLabelSlot from "./MultiSelect.slot.test.svelte";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectDuplicateIds from "./MultiSelectDuplicateIds.test.svelte";
import MultiSelectGenerics from "./MultiSelectGenerics.test.svelte";
import MultiSelectItemSlot from "./MultiSelectItemSlot.test.svelte";
import MultiSelectItemToStringId from "./MultiSelectItemToStringId.test.svelte";
import MultiSelectRestProps from "./MultiSelectRestProps.test.svelte";
import MultiSelectSlot from "./MultiSelectSlot.test.svelte";
import { closeMenu, openMenu, toggleOption } from "./helpers";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
  it("does not apply selectTextOnFocus when filterable is false", () => {
    render(MultiSelectReal, {
      props: { items: [], filterable: false, selectTextOnFocus: true },
    });

    const field = screen.getByRole("combobox");
    expect(field.tagName).not.toBe("INPUT");
  });

  it("forwards a maxlength attribute to the filterable input via restProps", () => {
    render(MultiSelectReal, {
      props: { items: [], filterable: true, maxlength: 10 },
    });

    expect(screen.getByRole("combobox")).toHaveAttribute("maxlength", "10");
  });

  describe("rest props", () => {
    it.each([
      { filterable: false, fieldClass: "bx--list-box__field" },
      { filterable: true, fieldClass: "bx--text-input" },
    ])(
      "forwards rest props to the trigger when filterable is $filterable",
      ({ filterable, fieldClass }) => {
        render(MultiSelectRestProps, {
          props: { items, labelText: "Contact methods", filterable },
        });

        const trigger = screen.getByRole("combobox");
        expect(trigger).toHaveAttribute("aria-invalid", "true");
        expect(trigger).toHaveAttribute("aria-required", "true");
        expect(trigger).toHaveAttribute("data-custom", "passthrough");
        expect(trigger).toHaveClass(fieldClass);
        expect(trigger).toHaveClass("custom-class");
      },
    );
  });

  describe("field accessible name and description", () => {
    it("names the non-filterable trigger with the field label", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      // aria-label would beat the <label for> association in accessible-name
      // precedence, so the trigger must not carry one.
      const trigger = screen.getByRole("combobox", {
        name: "Contact methods",
      });
      expect(trigger).not.toHaveAttribute("aria-label");

      // The name must not flip to "Close menu" while the menu is open.
      await user.click(trigger);
      expect(
        screen.getByRole("combobox", { name: "Contact methods" }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    it.each([{ filterable: false }, { filterable: true }])(
      "describes the field with the selection count when %o",
      ({ filterable }) => {
        render(MultiSelect, {
          props: {
            id: "test-multiselect",
            items,
            labelText: "Contact methods",
            filterable,
            selectedIds: ["0", "1"],
          },
        });

        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute(
          "aria-describedby",
          "selection-test-multiselect",
        );

        const description = document.querySelector(
          "#selection-test-multiselect",
        );
        expect(description).toHaveTextContent("2 selected");
        expect(description).toHaveClass("bx--visually-hidden");
      },
    );

    it("omits the selection count description when nothing is selected", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      expect(screen.getByRole("combobox")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("appends the selection count description to existing helper text", () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact methods",
          helperText: "Helper text",
          selectedIds: ["0"],
        },
      });

      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-describedby",
        "selection-test-multiselect helper-test-multiselect",
      );
    });
  });

  it("renders default slot", async () => {
    render(MultiSelectSlot, { items });
    await openMenu();
    expect(screen.getByText("1 Email 0")).toBeInTheDocument();
    expect(screen.getByText("2 Fax 1")).toBeInTheDocument();
    expect(screen.getByText("0 Slack 2")).toBeInTheDocument();
  });

  it("keeps the keyboard highlight while the pointer moves over the menu", async () => {
    render(MultiSelect, { props: { items } });

    await openMenu();
    await user.keyboard("{ArrowDown}");

    // Items sort by text, so Email comes first.
    const emailOption = screen.getByRole("option", { name: "Email" });
    const faxOption = screen.getByRole("option", { name: "Fax" });
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await user.hover(faxOption);
    expect(faxOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await fireEvent.mouseLeave(screen.getByRole("listbox"));
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("does not highlight a hovered item, so Enter toggles nothing", async () => {
    render(MultiSelect, { props: { items } });

    await openMenu();

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
    expect(emailOption).toHaveAttribute("aria-checked", "false");

    await user.keyboard("{Enter}");
    expect(emailOption).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should not leave the option checkbox independently focusable", async () => {
    render(MultiSelect, { props: { items } });
    await openMenu();

    const option = screen.getByRole("option", { name: "Slack" });
    const checkbox = option.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveAttribute("tabindex", "-1");
  });

  it("should hide the decorative option checkbox from the accessibility tree", async () => {
    render(MultiSelect, { props: { items } });
    await openMenu();

    const option = screen.getByRole("option", { name: "Slack" });
    const checkbox = option.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveStyle({ display: "none" });
  });

  it("should pass selected and highlighted to the default slot", async () => {
    render(MultiSelectItemSlot, { props: { selectedIds: ["1"] } });

    await openMenu();

    const customItems = screen.getAllByTestId("custom-item");
    const byText = (text: string) => {
      const el = customItems.find((item) => item.textContent?.includes(text));
      if (!el) throw new Error(`No custom item matching "${text}"`);
      return el;
    };

    // selectedIds ["1"] is "Option 2". Items may be sorted selected-to-top,
    // so assert by content rather than position.
    expect(byText("Option 2")).toHaveAttribute("data-selected", "true");
    expect(byText("Option 1")).toHaveAttribute("data-selected", "false");
    expect(byText("Option 3")).toHaveAttribute("data-selected", "false");

    await user.keyboard("{End}");
    expect(byText("Option 3")).toHaveAttribute("data-highlighted", "true");
    expect(byText("Option 1")).toHaveAttribute("data-highlighted", "false");
  });

  // Regression: ?? for itemToString so item.text "" is used (not id).
  // Renders the real component so the built-in default itemToString runs.
  it("displays empty string when item.text is empty (nullish coalescing)", async () => {
    render(MultiSelectReal, {
      props: {
        items: [
          { id: "1", text: "" },
          { id: "2", text: "Email" },
        ],
        labelText: "Contact",
      },
    });
    await openMenu();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0].textContent?.trim()).toBe("");
    expect(options[1]).toHaveTextContent("Email");
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

  it("leaves aria-label off the role-less list box wrapper", () => {
    const { container } = render(MultiSelect, {
      props: { items: [{ id: "1", text: "Email" }], labelText: "Contact" },
    });
    const wrapper = container.querySelector(".bx--list-box");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).not.toHaveAttribute("aria-label");
  });

  describe("variants and states", () => {
    it.each([
      { direction: "top" as const, hasUpClass: true },
      { direction: "bottom" as const, hasUpClass: false },
      { direction: undefined, hasUpClass: false },
    ])(
      "applies the upward list box class only for direction=$direction",
      ({ direction, hasUpClass }) => {
        render(MultiSelect, { props: { items, direction } });

        const listBox = screen
          .getByRole("combobox")
          .closest(".bx--multi-select");
        if (hasUpClass) {
          expect(listBox).toHaveClass("bx--list-box--up");
        } else {
          expect(listBox).not.toHaveClass("bx--list-box--up");
        }
      },
    );

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

    it("marks the list box invalid", () => {
      render(MultiSelect, {
        props: {
          items,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--multi-select--invalid");
    });

    // Regression: filterable + invalid rendered two WarningFilled icons
    it("renders only one invalid icon when filterable", () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          filterable: true,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      const icons = container.querySelectorAll(".bx--list-box__invalid-icon");
      expect(icons).toHaveLength(1);
    });

    // Regression: filterable + warn rendered two WarningAltFilled icons
    it("renders only one warning icon when filterable", () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          filterable: true,
          warn: true,
          warnText: "Warning message",
        },
      });

      const icons = container.querySelectorAll(".bx--list-box__invalid-icon");
      expect(icons).toHaveLength(1);
    });

    it("marks the list box with the warning class", () => {
      render(MultiSelect, {
        props: {
          items,
          warn: true,
          warnText: "Warning message",
        },
      });

      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--list-box--warning");
    });

    it.each(["disabled", "readonly"] as const)(
      "drops the invalid and warning markers when %s",
      (state) => {
        const { container } = render(MultiSelect, {
          props: {
            items,
            [state]: true,
            invalid: true,
            invalidText: "Invalid selection",
            warn: true,
            warnText: "Warning message",
          },
        });

        const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
        expect(wrapper).not.toHaveClass("bx--multi-select--invalid");
        expect(wrapper).not.toHaveClass("bx--list-box--warning");
        expect(wrapper).not.toHaveAttribute("data-invalid");
        expect(
          container.querySelector(".bx--list-box__invalid-icon"),
        ).toBeNull();
      },
    );

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

    it.each(["{ArrowDown}", "{ArrowUp}", "{Enter}", " ", "{End}"])(
      "does not open a disabled field on %s after a click focuses it",
      async (key) => {
        render(MultiSelect, {
          props: { items, disabled: true, selectedIds: ["1"] },
        });

        const field = screen.getByRole("combobox");
        await user.click(field);
        expect(field).toHaveFocus();

        await user.keyboard(key);
        expect(field).toHaveAttribute("aria-expanded", "false");
      },
    );

    it.each(["{Delete}", "{Backspace}"])(
      "does not clear a disabled field's selection on %s",
      async (key) => {
        const onSelect = vi.fn();
        render(MultiSelect, {
          props: { onSelect, items, disabled: true, selectedIds: ["1"] },
        });

        await user.click(screen.getByRole("combobox"));
        await user.keyboard(key);
        expect(onSelect).not.toHaveBeenCalled();
      },
    );

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

  describe("focus outline", () => {
    // Carbon resets the field's own `:focus` outline to transparent and relies
    // on a `--input-focused` class to render the visible, theme-aware outline.
    it("toggles the input-focused class on the default field wrapper", async () => {
      render(MultiSelect, { props: { items, labelText: "Contact methods" } });

      // The outline renders on the field wrapper, not the focusable field
      // itself, so Carbon's transparent `:focus` reset cannot win by specificity.
      const field = screen.getByRole("combobox");
      const wrapper = field.closest(".bx--list-box__field--wrapper");
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(field);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(field);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("keeps the input-focused class while the menu is open", () => {
      // Selecting an item bounces focus to the option and back; tying the
      // outline to `open` (not just focus) keeps it stable mid-interaction.
      render(MultiSelect, { props: { items, open: true } });

      const wrapper = screen
        .getByRole("combobox")
        .closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("toggles the input-focused class on the filterable field", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      const input = screen.getByRole("combobox");
      const field = input.closest(".bx--list-box__field");
      expect(field).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(input);
      await tick();
      expect(field).toHaveClass("bx--list-box__field--wrapper--input-focused");

      fireEvent.blur(input);
      await tick();
      expect(field).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });

  describe("accessibility", () => {
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
      // ARIA 1.2 comboboxes reference the popup via aria-controls only;
      // aria-owns restructures the accessibility tree and can double-read.
      expect(combobox).not.toHaveAttribute("aria-owns");
      const menuId = combobox.getAttribute("aria-controls");
      expect(screen.getByRole("listbox")).toHaveAttribute("id", menuId);
    });

    it("clicking the label opens the menu and focuses the field (non-filterable)", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      await user.click(screen.getByText("Contact methods"));

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveFocus();
    });

    it("keeps focus on the field while clicking options (non-filterable)", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(combobox).toHaveFocus();

      // Focus must never move to the option — a focus bounce makes screen
      // readers re-announce the entire field on every click.
      const option = screen.getByRole("option", { name: "Email" });
      await user.click(option);

      expect(option).toHaveAttribute("aria-checked", "true");
      expect(combobox).toHaveFocus();
    });

    it("keeps focus on the input while clicking options (filterable)", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(combobox).toHaveFocus();

      const option = screen.getByRole("option", { name: "Email" });
      await user.click(option);

      expect(option).toHaveAttribute("aria-checked", "true");
      expect(combobox).toHaveFocus();
    });

    it("keeps focus on the field while clicking virtualized options", async () => {
      const largeItems = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
      }));
      render(MultiSelect, {
        props: {
          items: largeItems,
          virtualize: true,
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(combobox).toHaveFocus();

      const option = screen.getByRole("option", { name: "Item 1" });
      await user.click(option);

      expect(option).toHaveAttribute("aria-checked", "true");
      expect(combobox).toHaveFocus();
    });

    it("forwards a native input event when the filter text is cleared via the clear button", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Em");
      expect(input).toHaveValue("Em");

      const inputSpy = vi.fn();
      input.addEventListener("input", inputSpy);

      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);

      expect(input).toHaveValue("");
      expect(inputSpy).toHaveBeenCalled();
    });

    it("uses the singular clear label when exactly one item is selected", () => {
      render(MultiSelect, {
        props: { items, selectedIds: ["0"] },
      });

      expect(
        screen.getByRole("button", { name: "Clear selected item" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Clear all selected items" }),
      ).not.toBeInTheDocument();
    });

    it("uses the plural clear label when more than one item is selected", () => {
      render(MultiSelect, {
        props: { items, selectedIds: ["0", "1"] },
      });

      expect(
        screen.getByRole("button", { name: "Clear all selected items" }),
      ).toBeInTheDocument();
    });

    // The count tag follows the field's size like the selected-item tags:
    // a 16px tag fits a 24px field, an 18px tag a 32px one.
    it.each([
      ["xs", "bx--tag--xs"],
      ["sm", "bx--tag--sm"],
      [undefined, undefined],
      ["lg", undefined],
    ] as const)("sizes the count tag for a %s field", (size, sizeClass) => {
      render(MultiSelect, {
        props: { items, selectedIds: ["0", "1"], size },
      });

      const tag = screen
        .getByRole("button", { name: "Clear all selected items" })
        .closest(".bx--tag");
      const sizeClasses = [...(tag?.classList ?? [])].filter((name) =>
        /^bx--tag--(xs|sm|lg)$/.test(name),
      );
      expect(sizeClasses).toEqual(sizeClass ? [sizeClass] : []);
    });

    it("moves focus directly to the next control when tabbing away with the menu open", async () => {
      render(MultiSelect, { props: { items } });
      const nextInput = document.createElement("input");
      nextInput.setAttribute("aria-label", "Next control");
      document.body.appendChild(nextInput);

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard(" ");
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      await user.tab();

      expect(document.activeElement).toBe(nextInput);
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      document.body.removeChild(nextInput);
    });

    it("re-filters options when the filter value is updated externally, not just by typing", async () => {
      const { rerender } = render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      await openMenu();
      expect(screen.getAllByRole("option")).toHaveLength(3);

      // Simulate a parent reassigning the `bind:value`d `value`.
      await rerender({ items, filterable: true, value: "Email" });

      expect(screen.getAllByRole("option")).toHaveLength(1);
      expect(screen.getByRole("option", { name: "Email" })).toBeInTheDocument();
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
      expect(combobox).not.toHaveAttribute("aria-owns");
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
    it("handles custom itemToString", async () => {
      const props = {
        items,
        selectedIds: ["0"],
        itemToString: (item: MultiSelectItem) => `${item.text} (${item.id})`,
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      await openMenu();
      expect(screen.getByText("Slack (0)")).toBeInTheDocument();
    });

    it("renders option checkboxes without itemToInput", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      const option = screen.getByRole("option", { name: "Slack" });
      const checkbox = option.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toHaveAttribute("title");
      expect(option).toHaveTextContent("Slack");
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
      const option = screen.getByRole("option", { name: "Slack" });
      const checkbox = option.querySelector('input[type="checkbox"]');
      // The option checkbox is decorative and excluded from native form
      // participation; itemToInput's `name` targets the always-mounted
      // hidden inputs instead (see MultiSelect.form.test.ts).
      expect(checkbox).not.toHaveAttribute("name", "contact_0");
      expect(checkbox).toHaveAttribute("value", "slack");
    });

    it("labels options with itemToInput's labelText", async () => {
      render(MultiSelect, {
        props: {
          items,
          itemToInput: (item: MultiSelectItem) => ({
            labelText: `${item.text} (label)`,
          }),
        },
      });

      await openMenu();
      expect(
        screen.getByRole("option", { name: "Slack (label)" }),
      ).toBeInTheDocument();
    });
  });

  // Inline shows it under the field, as inline TextInput and Select do;
  // hiding it also left `aria-describedby` pointing at nothing.
  it("shows helper text under an inline field and describes it", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        type: "inline",
      },
    });
    const helper = screen.getByText("Help");
    expect(helper).toHaveClass("bx--form__helper-text");
    const ids = (
      document
        .querySelector("[aria-describedby]")
        ?.getAttribute("aria-describedby") ?? ""
    ).split(" ");
    expect(ids).toContain(helper.id);
    for (const id of ids) expect(document.getElementById(id)).not.toBeNull();
  });

  it("passes the click event as the clear event detail", async () => {
    const onClear = vi.fn();
    render(MultiSelect, {
      props: { items, selectedIds: ["0", "1"], onClear },
    });

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledWith(expect.any(MouseEvent));
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

  it("highlights disabled items during keyboard navigation without selecting them", async () => {
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

    // The disabled item is reachable (APG), but Enter on it is a no-op.
    const options = screen.getAllByRole("option");
    expect(options[1]).toHaveClass("bx--list-box__menu-item--highlighted");
    await user.keyboard("{Enter}");
    expect(options[1]).toHaveAttribute("aria-selected", "false");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
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
  describe("Generics", () => {
    it("sortItem should return number, not Item", () => {
      type Item = { id: string; text: string };

      const sortItem: ComponentProps<MultiSelectComponent<Item>>["sortItem"] = (
        a: Item,
        b: Item,
      ) => a.text.localeCompare(b.text, "en", { numeric: true });

      expectTypeOf(sortItem).returns.toEqualTypeOf<number>();
      expectTypeOf(sortItem).parameters.toEqualTypeOf<[Item, Item]>();
    });

    it("sortItem accepts false to opt out of sorting", () => {
      type Item = { id: string; text: string };

      expectTypeOf<false>().toMatchTypeOf<
        ComponentProps<MultiSelectComponent<Item>>["sortItem"]
      >();
    });

    it('itemToString may return string or Item["id"] (matches default text ?? id)', () => {
      type Row = { id: number; text: string };

      type ItemToString = NonNullable<
        ComponentProps<MultiSelectComponent<Row>>["itemToString"]
      >;

      expectTypeOf<ItemToString>().returns.toEqualTypeOf<string | number>();

      const showText = (item: Row) => item.text;
      const showId = (item: Row) => item.id;
      // `text` must be optional so `?? id` is typed as `string | number` (required `text` would infer only `string`).
      const showFallback = (item: { id: number; text?: string }) =>
        item.text ?? item.id;

      expectTypeOf(showText).returns.toEqualTypeOf<string>();
      expectTypeOf(showId).returns.toEqualTypeOf<number>();
      expectTypeOf(showFallback).returns.toEqualTypeOf<string | number>();

      expectTypeOf(showText).toMatchTypeOf<ItemToString>();
      expectTypeOf(showId).toMatchTypeOf<ItemToString>();
      expectTypeOf(showFallback).toMatchTypeOf<ItemToString>();
    });

    it('itemToString may return numeric Item["id"] for option labels', async () => {
      render(MultiSelectItemToStringId);
      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options.map((o) => o.textContent?.trim())).toEqual(["101", "102"]);
    });

    it("should infer generic type from items and support destructuring in slots", async () => {
      const onSelect = vi.fn();
      render(MultiSelectGenerics, { props: { onSelect } });

      await openMenu();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      // Items are sorted alphabetically, so Desk comes first
      expect(options[0]).toHaveTextContent("Desk");
      expect(options[0]).toHaveTextContent("$299");
      expect(options[0]).toHaveTextContent("Furniture");

      await toggleOption("Laptop");

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith([
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

    it("types the clear event detail as the originating DOM event", () => {
      type Events = ComponentEvents<MultiSelectComponent>;
      type ClearDetail =
        Events["clear"] extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ClearDetail>().toEqualTypeOf<KeyboardEvent | MouseEvent>();
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
        type StringItem = { id: string; text: string };
        type StringComponent = MultiSelectComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedIds"]
        >().toEqualTypeOf<readonly string[] | undefined>();

        type NumberItem = { id: number; text: string };
        type NumberComponent = MultiSelectComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedIds"]
        >().toEqualTypeOf<readonly number[] | undefined>();

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

  describe("readonly", () => {
    it("should apply readonly class on the listbox", () => {
      const { container } = render(MultiSelect, {
        props: { items, labelText: "Contact", readonly: true },
      });

      expect(
        container.querySelector(".bx--multi-select--readonly"),
      ).toBeTruthy();
    });

    it("opens the menu for review on click when readonly (default)", async () => {
      const { container } = render(MultiSelect, {
        props: { items, labelText: "Contact", readonly: true },
      });

      const trigger = await screen.findByRole("combobox");
      // Read-only conveys read-only semantics, not disabled/unavailable.
      expect(trigger).toHaveAttribute("aria-readonly", "true");
      expect(trigger).not.toHaveAttribute("aria-disabled", "true");
      expect(container.querySelector(".bx--list-box")).not.toHaveAttribute(
        "aria-disabled",
      );

      await user.click(trigger);

      // The menu opens so the selected values can be reviewed/navigated.
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(items.length);
    });

    it("opens the menu for review on click when readonly + filterable", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          filterable: true,
          placeholder: "Select",
        },
      });

      const input = screen.getByRole("combobox");
      assert(input instanceof HTMLInputElement);

      // Read-only, not disabled: the input stays non-editable but reviewable.
      expect(input).toHaveAttribute("readonly");
      expect(input).toHaveAttribute("aria-readonly", "true");
      expect(input).not.toHaveAttribute("aria-disabled", "true");

      await user.click(input);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("prevents the browser default (page scroll) on Space when readonly + filterable", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          filterable: true,
          placeholder: "Select",
        },
      });

      const input = screen.getByRole("combobox");

      // A readonly input cannot insert a space, so an un-prevented Space falls
      // through to the browser's default page scroll. The handler must
      // preventDefault while still opening the menu for review.
      const event = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      await tick();

      expect(event.defaultPrevented).toBe(true);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("does not toggle a selection when an option is clicked while readonly", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0"],
        },
      });

      const trigger = await screen.findByRole("combobox");
      await user.click(trigger);

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");

      // Clicking an option must not change the selection in read-only.
      await user.click(options[1]);
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");

      // Nor may clicking a selected option clear it.
      await user.click(options[0]);
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("marks the open menu and its checkboxes as read-only", async () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0"],
        },
      });

      const trigger = await screen.findByRole("combobox");
      await user.click(trigger);

      // The listbox itself advertises that it cannot be modified.
      expect(screen.getByRole("listbox")).toHaveAttribute(
        "aria-readonly",
        "true",
      );

      // Each option's checkbox is read-only so a browse-mode toggle is blocked.
      const checkboxes = container.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      expect(checkboxes.length).toBe(items.length);
      for (const checkbox of checkboxes) {
        expect(checkbox).toHaveAttribute("aria-readonly", "true");
      }
    });

    it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
      const { container } = render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          readonly: true,
        },
      });

      // VoiceOver does not surface aria-readonly, so the state is also exposed
      // as a visually-hidden description referenced by the combobox.
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute(
        "aria-describedby",
        "readonly-test-multiselect",
      );

      const description = container.querySelector("#readonly-test-multiselect");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");
    });

    it("supports overriding the read-only assistive text", () => {
      const { container } = render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          readonly: true,
          readonlyText: "Schreibgeschützt",
        },
      });

      expect(
        container.querySelector("#readonly-test-multiselect"),
      ).toHaveTextContent("Schreibgeschützt");
    });

    it("includes the selected count in the read-only description", () => {
      const { container } = render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0", "1"],
        },
      });

      // The count badge is hidden from AT in read-only, so the count is folded
      // into the description to keep the collapsed field reviewable.
      expect(
        container.querySelector("#readonly-test-multiselect"),
      ).toHaveTextContent("Read-only, 2 selected");
    });

    it("appends the read-only description to existing helper text", () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          helperText: "Helper text",
          readonly: true,
        },
      });

      // Both ids are referenced so the help text is not lost in read-only.
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-describedby",
        "readonly-test-multiselect helper-test-multiselect",
      );
    });

    it("should not clear selection when readonly", async () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0", "1"],
        },
      });

      const closeIcon = container.querySelector(".bx--tag__close-icon");
      assert(closeIcon);
      await user.click(closeIcon);

      expect(
        container.querySelectorAll(".bx--tag--filter").length,
      ).toBeGreaterThan(0);
    });
  });

  // Regression: checkbox ids are scoped by the MultiSelect `id` so that two
  // instances sharing the same item ids do not emit duplicate DOM ids (which
  // would make a label click on one instance toggle the other instance's input).
  it("scopes checkbox ids per instance to avoid clashes between instances", () => {
    const { container } = render(MultiSelectDuplicateIds);

    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[id^="checkbox-"]'),
    );
    const ids = checkboxes.map((checkbox) => checkbox.id);

    // Two instances of 3 items each.
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(ids.length);
    // Ids are scoped by the instance `id` prop.
    expect(ids).toEqual(
      expect.arrayContaining([
        "checkbox-first-0",
        "checkbox-first-1",
        "checkbox-first-2",
        "checkbox-second-0",
        "checkbox-second-1",
        "checkbox-second-2",
      ]),
    );

    // Each option's aria-labelledby resolves to the checkbox within the same instance.
    for (const option of container.querySelectorAll('[role="option"]')) {
      const labelledby = option.getAttribute("aria-labelledby");
      assert(labelledby);
      expect(container.querySelector(`#${labelledby}`)).not.toBeNull();
    }

    // Every option id is globally unique and prefixed by its instance id,
    // even though both instances share the same raw item ids.
    const optionIds = Array.from(
      container.querySelectorAll('[role="option"]'),
    ).map((option) => option.id);
    expect(optionIds).toHaveLength(6);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(optionIds).toEqual(
      expect.arrayContaining([
        "first-0",
        "first-1",
        "first-2",
        "second-0",
        "second-1",
        "second-2",
      ]),
    );
  });

  it("scopes aria-activedescendant to options within the same instance", async () => {
    const { container } = render(MultiSelectDuplicateIds);

    const comboboxes = Array.from(
      container.querySelectorAll<HTMLElement>('[role="combobox"]'),
    );
    expect(comboboxes).toHaveLength(2);

    const expectScopedActiveDescendant = async (
      combobox: HTMLElement,
      prefix: string,
    ) => {
      combobox.focus();
      await user.keyboard("{ArrowDown}");

      const activeDescendant = combobox.getAttribute("aria-activedescendant");
      assert(activeDescendant);
      expect(activeDescendant.startsWith(`${prefix}-`)).toBe(true);

      const active = container.querySelector(`#${activeDescendant}`);
      expect(active).not.toBeNull();
      expect(active?.getAttribute("role")).toBe("option");
      expect(combobox.closest(".bx--list-box")).toBe(
        active?.closest(".bx--list-box"),
      );
    };

    await expectScopedActiveDescendant(comboboxes[0], "first");
    await expectScopedActiveDescendant(comboboxes[1], "second");
  });

  describe("fluid variant", () => {
    const getCombobox = () => screen.getByRole("combobox");

    it("does not render the fluid divider by default", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      expect(document.querySelector(".bx--list-box__divider")).toBeNull();
    });

    it("renders the divider and leaves the field undescribed", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
          helperText: "Helper text",
        },
      });

      expect(
        document.querySelector(".bx--list-box__divider"),
      ).toBeInTheDocument();
      expect(getCombobox()).not.toHaveAttribute("aria-describedby");
    });

    it("marks the fluid wrapper invalid", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      expect(getCombobox().closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--invalid",
      );
    });

    it.each([
      { props: {}, neutral: true },
      { props: { invalid: true, invalidText: "Invalid" }, neutral: false },
      { props: { warn: true, warnText: "Warning" }, neutral: false },
      { props: { disabled: true }, neutral: false },
      { props: { readonly: true }, neutral: false },
    ])(
      "sets the neutral wrapper class only when no other fluid modifier applies (%o)",
      ({ props, neutral }) => {
        render(MultiSelect, {
          props: { fluid: true, items, labelText: "Contact methods", ...props },
        });

        const wrapper = document.querySelector(".bx--list-box__wrapper--fluid");
        if (neutral) {
          expect(wrapper).toHaveClass("bx--list-box__wrapper--fluid--neutral");
        } else {
          expect(wrapper).not.toHaveClass(
            "bx--list-box__wrapper--fluid--neutral",
          );
        }
      },
    );

    it.each([
      { props: {}, hoverable: true },
      { props: { invalid: true, invalidText: "Invalid" }, hoverable: true },
      { props: { warn: true, warnText: "Warning" }, hoverable: true },
      { props: { disabled: true }, hoverable: false },
      { props: { readonly: true }, hoverable: false },
    ])(
      "sets the hoverable wrapper class unless disabled or readonly (%o)",
      ({ props, hoverable }) => {
        render(MultiSelect, {
          props: { fluid: true, items, labelText: "Contact methods", ...props },
        });

        const wrapper = document.querySelector(".bx--list-box__wrapper--fluid");
        if (hoverable) {
          expect(wrapper).toHaveClass(
            "bx--list-box__wrapper--fluid--hoverable",
          );
        } else {
          expect(wrapper).not.toHaveClass(
            "bx--list-box__wrapper--fluid--hoverable",
          );
        }
      },
    );

    it("marks the wrapper as condensed when fluid", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          condensed: true,
          items,
          labelText: "Contact methods",
        },
      });

      expect(getCombobox().closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--condensed",
      );
    });

    it("ignores condensed when not fluid", () => {
      render(MultiSelect, {
        props: {
          condensed: true,
          items,
          labelText: "Contact methods",
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid--condensed"),
      ).toBeNull();
    });

    it("toggles the input-focused class on the fluid field wrapper", async () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = getCombobox();
      const wrapper = combobox.closest(".bx--list-box__field--wrapper");

      expect(wrapper).toHaveClass("bx--list-box__field--wrapper");
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(combobox);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(combobox);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("keeps the input-focused class while the fluid menu is open", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          open: true,
          items,
          labelText: "Contact methods",
        },
      });

      const wrapper = getCombobox().closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("renders filterable fluid classes and selection-count tag", async () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          filterable: true,
          items,
          labelText: "Contact methods",
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      const wrapper = getCombobox().closest(".bx--list-box__wrapper");
      expect(wrapper).toHaveClass("bx--list-box__wrapper--fluid");
      expect(wrapper).toHaveClass("bx--multi-select--filterable__wrapper");

      const fieldWrapper = getCombobox().closest(
        ".bx--list-box__field--wrapper",
      );
      expect(fieldWrapper).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      await user.click(getCombobox());
      expect(getCombobox()).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles the input-focused class on the filterable fluid field wrapper", async () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          filterable: true,
          items,
          placeholder: "Filter...",
        },
      });

      const input = getCombobox();
      const wrapper = input.closest(".bx--list-box__field--wrapper");

      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(input);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(input);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });
});
