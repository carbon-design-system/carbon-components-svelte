import { fireEvent, render, screen } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import MultiSelectReal from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { closeMenu, openMenu, toggleOption } from "./helpers";
import MultiSelectFluidForm from "./MultiSelect.fluidForm.test.svelte";
import MultiSelectFluidSkeleton from "./MultiSelect.fluidSkeleton.test.svelte";
import MultiSelectFluidSlot from "./MultiSelect.fluidSlot.test.svelte";
import MultiSelectSkeleton from "./MultiSelect.skeleton.test.svelte";
import MultiSelectLabelSlot from "./MultiSelect.slot.test.svelte";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectDuplicateIds from "./MultiSelectDuplicateIds.test.svelte";
import MultiSelectGenerics from "./MultiSelectGenerics.test.svelte";
import MultiSelectItemSlot from "./MultiSelectItemSlot.test.svelte";
import MultiSelectItemToStringId from "./MultiSelectItemToStringId.test.svelte";
import MultiSelectRestProps from "./MultiSelectRestProps.test.svelte";
import MultiSelectSlot from "./MultiSelectSlot.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
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

  it("selects the full filter value on focus when selectTextOnFocus is true", async () => {
    render(MultiSelectReal, {
      props: {
        items: [],
        filterable: true,
        selectTextOnFocus: true,
        value: "Slack",
      },
    });

    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Slack".length);
  });

  it("does not select all filter text on focus when selectTextOnFocus is false (default)", async () => {
    render(MultiSelectReal, {
      props: { items: [], filterable: true, value: "Slack" },
    });

    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(input.selectionEnd);
  });

  it("does not select text on focus when disabled", async () => {
    render(MultiSelectReal, {
      props: {
        items: [],
        filterable: true,
        selectTextOnFocus: true,
        disabled: true,
        value: "Slack",
      },
    });

    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
  });

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

    it.each([{ filterable: false }, { filterable: true }])(
      "resolves aria-describedby to the non-fluid error text when %o",
      ({ filterable }) => {
        render(MultiSelect, {
          props: {
            id: "test-multiselect",
            items,
            labelText: "Contact methods",
            filterable,
            invalid: true,
            invalidText: "Invalid selection",
          },
        });

        expect(screen.getByRole("combobox")).toHaveAttribute(
          "aria-describedby",
          "error-test-multiselect",
        );

        const description = document.querySelector("#error-test-multiselect");
        expect(description).toHaveTextContent("Invalid selection");
        expect(description).toHaveClass("bx--form-requirement");
      },
    );

    it("resolves aria-describedby to the non-fluid warning text", () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact methods",
          warn: true,
          warnText: "Warning message",
        },
      });

      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-describedby",
        "warn-test-multiselect",
      );

      const description = document.querySelector("#warn-test-multiselect");
      expect(description).toHaveTextContent("Warning message");
      expect(description).toHaveClass("bx--form-requirement");
    });
  });

  it("renders default slot", async () => {
    render(MultiSelectSlot, { items });
    await openMenu();
    expect(screen.getByText("1 Email 0")).toBeInTheDocument();
    expect(screen.getByText("2 Fax 1")).toBeInTheDocument();
    expect(screen.getByText("0 Slack 2")).toBeInTheDocument();
  });

  it("should clear the hover highlight when the cursor leaves the menu", async () => {
    render(MultiSelect, { props: { items } });

    await openMenu();

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await fireEvent.mouseLeave(screen.getByRole("listbox"));
    expect(emailOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("does not toggle a hover-highlighted item on Enter", async () => {
    render(MultiSelect, { props: { items } });

    await openMenu();

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");
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

    await user.hover(byText("Option 3"));
    expect(byText("Option 3")).toHaveAttribute("data-highlighted", "true");
    expect(byText("Option 1")).toHaveAttribute("data-highlighted", "false");
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

    it.each(["disabled", "readonly"] as const)(
      "suppresses invalid and warn states when %s",
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
        expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
        expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
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
        const consoleLog = vi.spyOn(console, "log");
        render(MultiSelect, {
          props: { items, disabled: true, selectedIds: ["1"] },
        });

        await user.click(screen.getByRole("combobox"));
        await user.keyboard(key);
        expect(consoleLog).not.toHaveBeenCalledWith(
          "select",
          expect.anything(),
        );
      },
    );

    it("opens an enabled field on ArrowDown", async () => {
      render(MultiSelect, { props: { items } });

      const field = screen.getByRole("combobox");
      field.focus();
      await user.keyboard("{ArrowDown}");
      expect(field).toHaveAttribute("aria-expanded", "true");
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

  it("passes the click event as the clear event detail", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultiSelect, { props: { items, selectedIds: ["0", "1"] } });

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(MouseEvent));
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

  it("should not infinite loop when all items are disabled", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "Aa", disabled: true },
          { id: "2", text: "Ba", disabled: true },
          { id: "3", text: "Ca", disabled: true },
        ],
        filterable: true,
        placeholder: "Filter...",
      },
    });
    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");

    // No item should be selected since all are disabled.
    const options = screen.getAllByRole("option");
    for (const option of options) {
      expect(option).toHaveAttribute("aria-selected", "false");
    }
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
          readonly any[] | undefined>();

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

    it("does not render fluid classes by default", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toBeNull();
      expect(document.querySelector(".bx--list-box__divider")).toBeNull();
    });

    it("renders fluid variant and suppresses helper text", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
          helperText: "Helper text",
        },
      });

      const combobox = getCombobox();
      expect(combobox.closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid",
      );
      expect(
        document.querySelector(".bx--list-box__divider"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(combobox).not.toHaveAttribute("aria-describedby");
    });

    it("renders the error message inside the fluid wrapper", () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          fluid: true,
          items,
          labelText: "Contact methods",
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      const message = screen.getByText("Invalid selection");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--list-box__wrapper--fluid")).not.toBeNull();
      expect(message.closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--invalid",
      );
      expect(getCombobox()).toHaveAttribute(
        "aria-describedby",
        "error-test-multiselect",
      );
    });

    it("renders the warning message inside the fluid wrapper", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
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
        render(MultiSelect, {
          props: {
            fluid: true,
            items,
            labelText: "Contact methods",
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

    it("ignores fluid for the inline variant", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          fluid: true,
          type: "inline",
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toBeNull();
    });

    it("inherits fluid from the FluidForm context", () => {
      render(MultiSelectFluidForm);

      expect(getCombobox().closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid",
      );
    });

    it("marks the label as slotted when fluid", () => {
      render(MultiSelectFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(MultiSelectFluidSlot, { props: { fluid: false } });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
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

  it("renders skeleton state", () => {
    render(MultiSelectSkeleton);

    const skeleton = screen.getByTestId("multi-select-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass(
      "bx--skeleton",
      "bx--multi-select",
      "bx--list-box",
      "bx--form-item",
    );
    expect(skeleton.children).toHaveLength(1);
    expect(skeleton.children[0]).toHaveClass("bx--list-box__field");
  });

  it("renders fluid skeleton state", () => {
    render(MultiSelectFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-multi-select-skeleton");
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
