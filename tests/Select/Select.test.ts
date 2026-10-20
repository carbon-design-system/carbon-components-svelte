import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type SelectComponent from "carbon-components-svelte/Select/Select.svelte";
import type SelectItemComponent from "carbon-components-svelte/Select/SelectItem.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import SelectFalsy from "./Select.falsy.test.svelte";
import SelectGroup from "./Select.group.test.svelte";
import SelectManyItems from "./Select.manyItems.test.svelte";
import Select from "./Select.test.svelte";
import SelectToggle from "./Select.toggle.test.svelte";

describe("Select", () => {
  // Items register in one batched flush on mount. A dropped or reordered
  // registration shows up as a late item coerced to a string.
  it("keeps a late item's numeric value after many items register at once", async () => {
    const onUpdate = vi.fn();
    render(SelectManyItems, { count: 40, onUpdate });

    await user.selectOptions(screen.getByLabelText("Select label"), "39");

    expect(onUpdate).toHaveBeenCalledWith(39);
  });

  it("renders with default props", () => {
    render(Select);

    const label = screen.getByText("Select label");
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveClass("bx--visually-hidden");

    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).not.toBeDisabled();
    expect(selectElement).not.toHaveAttribute("aria-invalid");

    const options = within(selectElement).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue("option-1");
    expect(options[0]).toHaveTextContent("Option 1");
  });

  it("renders with selected value", () => {
    render(Select, { selected: "option-2" });

    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).toHaveValue("option-2");
  });

  it("emits events", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    const onUpdate = vi.fn();
    render(Select, { onChange, onInput, onUpdate });

    const selectElement = screen.getByLabelText("Select label");
    await user.selectOptions(selectElement, "option-2");

    expect(onChange).toHaveBeenCalledOnce();
    expect(onInput).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith("option-2");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2871
  it("does not dispatch update event on initial render", () => {
    const onUpdate = vi.fn();
    render(Select, { onUpdate });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2871
  it("does not dispatch update event when toggled into view", async () => {
    const onUpdate = vi.fn();
    render(SelectToggle, { open: false, onUpdate });

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByLabelText("Toggled select")).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("renders default size", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).not.toHaveClass("bx--select-input--sm");
    expect(selectElement).not.toHaveClass("bx--select-input--xl");
  });

  it("renders extra small size variant", () => {
    render(Select, { size: "xs" });
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).toHaveClass("bx--select-input--xs");
    expect(selectElement).not.toHaveClass("bx--select-input--sm");
  });

  it("renders small size variant", () => {
    render(Select, { size: "sm" });
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).toHaveClass("bx--select-input--sm");
    expect(selectElement).not.toHaveClass("bx--select-input--xl");
  });

  it("renders extra large size variant", () => {
    render(Select, { size: "xl" });
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).not.toHaveClass("bx--select-input--sm");
    expect(selectElement).toHaveClass("bx--select-input--xl");
  });

  it("renders default variant", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).not.toHaveClass("bx--select--inline");
    expect(selectWrapper.parentElement).toHaveClass("bx--form-item");
    expect(selectWrapper.parentElement).not.toHaveClass(
      "bx--select__form-item--inline",
    );
  });

  it("renders inline variant", () => {
    render(Select, { inline: true });
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).toHaveClass("bx--select--inline");
    // The form item stays at its content width in a flex row.
    expect(selectWrapper.parentElement).toHaveClass(
      "bx--form-item",
      "bx--select__form-item--inline",
    );
  });

  it("renders disabled state", () => {
    render(Select, { disabled: true });
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).toBeDisabled();
  });

  it("renders read-only state", () => {
    render(Select, { readonly: true });
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);

    expect(selectWrapper).toHaveClass("bx--select--readonly");
    expect(selectElement).toHaveAttribute("aria-readonly", "true");
    expect(selectElement).not.toBeDisabled();
  });

  it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
    const { container } = render(Select, { readonly: true });

    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).toHaveAttribute(
      "aria-describedby",
      "readonly-test-select",
    );

    const description = container.querySelector("#readonly-test-select");
    expect(description).toHaveTextContent("Read-only");
    expect(description).toHaveClass("bx--visually-hidden");
  });

  it("supports overriding the read-only assistive text", () => {
    const { container } = render(Select, {
      readonly: true,
      readonlyText: "Schreibgeschützt",
    });

    expect(container.querySelector("#readonly-test-select")).toHaveTextContent(
      "Schreibgeschützt",
    );
  });

  it("does not render a read-only description or aria-describedby when not readonly", () => {
    const { container } = render(Select);

    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).not.toHaveAttribute("aria-describedby");
    expect(container.querySelector("#readonly-test-select")).toBeNull();
  });

  it("suppresses invalid and warn states when read-only", () => {
    render(Select, {
      readonly: true,
      invalid: true,
      invalidText: "Invalid selection",
      warn: true,
      warnText: "Warning message",
    });

    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);

    expect(selectWrapper).not.toHaveClass("bx--select--invalid");
    expect(selectWrapper).not.toHaveClass("bx--select--warning");
    expect(selectElement).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
    expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
  });

  it("suppresses invalid and warn states when disabled", () => {
    render(Select, {
      disabled: true,
      invalid: true,
      invalidText: "Invalid selection",
      warn: true,
      warnText: "Warning message",
    });

    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);

    expect(selectWrapper).not.toHaveClass("bx--select--invalid");
    expect(selectWrapper).not.toHaveClass("bx--select--warning");
    expect(selectElement).not.toHaveAttribute("aria-invalid");
    expect(selectWrapper.querySelector(".bx--select__invalid-icon")).toBeNull();
    expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
    expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
  });

  it.each(["ArrowDown", "ArrowUp", " ", "Home", "End", "p", "P"])(
    "prevents %s keydown when read-only",
    (key) => {
      render(Select, { readonly: true });
      const selectElement = screen.getByLabelText("Select label");
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      const preventDefault = vi.spyOn(event, "preventDefault");

      selectElement.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
    },
  );

  it("does not prevent Tab keydown when read-only", () => {
    render(Select, { readonly: true });
    const selectElement = screen.getByLabelText("Select label");
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, "preventDefault");

    selectElement.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("prevents Alt+Down keydown when read-only", async () => {
    render(Select, { readonly: true });
    const selectElement = screen.getByLabelText("Select label");

    expect(
      await fireEvent.keyDown(selectElement, {
        key: "ArrowDown",
        altKey: true,
      }),
    ).toBe(false);
  });

  it.each([
    { key: "Tab", shiftKey: true },
    { key: "c", ctrlKey: true },
    { key: "c", metaKey: true },
  ])("does not prevent %o keydown when read-only", async (init) => {
    render(Select, { readonly: true });
    const selectElement = screen.getByLabelText("Select label");

    expect(await fireEvent.keyDown(selectElement, init)).toBe(true);
  });

  it("does not prevent typeahead when not read-only", async () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");

    expect(await fireEvent.keyDown(selectElement, { key: "p" })).toBe(true);
  });

  it("prevents mousedown default and focuses when read-only", () => {
    render(Select, { readonly: true });
    const selectElement = screen.getByLabelText("Select label");
    const focus = vi.spyOn(selectElement, "focus");
    const event = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, "preventDefault");

    selectElement.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
  });

  it("does not prevent mousedown when not read-only", async () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");

    expect(await fireEvent.mouseDown(selectElement)).toBe(true);
  });

  describe("inline variant", () => {
    it("describes the field as read-only", () => {
      const { container } = render(Select, { inline: true, readonly: true });

      expect(screen.getByLabelText("Select label")).toHaveAttribute(
        "aria-describedby",
        "readonly-test-select",
      );
      expect(
        container.querySelector("#readonly-test-select"),
      ).toHaveTextContent("Read-only");
    });

    it("prevents keydown and mousedown when read-only", async () => {
      render(Select, { inline: true, readonly: true });
      const selectElement = screen.getByLabelText("Select label");

      expect(await fireEvent.keyDown(selectElement, { key: "ArrowDown" })).toBe(
        false,
      );
      expect(await fireEvent.mouseDown(selectElement)).toBe(false);
    });

    it("sets aria-invalid when invalid", () => {
      render(Select, { inline: true, invalid: true, invalidText: "Bad" });

      expect(screen.getByLabelText("Select label")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
  });

  it("renders no label when noLabel is set", () => {
    const { container } = render(Select, { noLabel: true });

    expect(container.querySelector("label")).toBeNull();
  });

  it("renders valid by default", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);

    expect(selectWrapper).not.toHaveClass("bx--select--invalid");
    expect(selectElement).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "announces the invalid message (inline: %s)",
    (inline) => {
      render(Select, {
        inline,
        invalid: true,
        invalidText: "Invalid selection",
      });

      expect(screen.getByText("Invalid selection")).toHaveAttribute(
        "role",
        "alert",
      );
    },
  );

  it("renders invalid state", () => {
    render(Select, {
      invalid: true,
      invalidText: "Invalid selection",
    });

    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);

    expect(selectWrapper).toHaveClass("bx--select--invalid");
    expect(selectElement).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid selection")).toHaveTextContent(
      "Invalid selection",
    );
  });

  it("renders without warning by default", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);

    expect(selectWrapper).not.toHaveClass("bx--select--warning");
    expect(screen.queryByText(/warning/i)).not.toBeInTheDocument();
  });

  it("renders warning state", () => {
    render(Select, {
      warn: true,
      warnText: "Warning message",
    });

    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).toHaveClass("bx--select--warning");
    expect(screen.getByText("Warning message")).toHaveTextContent(
      "Warning message",
    );
  });

  it("renders warning state for inline variant", () => {
    render(Select, {
      id: "test-select",
      inline: true,
      warn: true,
      warnText: "Warning message",
    });

    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).toHaveClass("bx--select--warning");

    const warnElement = screen.getByText("Warning message");
    expect(warnElement).toHaveAttribute("id", "warn-test-select");
    expect(warnElement).toHaveClass("bx--form-requirement");

    const warningIcon = selectWrapper.querySelector(
      ".bx--select__invalid-icon--warning",
    );
    expect(warningIcon).toBeInTheDocument();
  });

  describe("aria-describedby", () => {
    it("has no aria-describedby when no messages are present", () => {
      render(Select, { id: "test-select" });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).not.toHaveAttribute("aria-describedby");
    });

    it("prioritizes warning over helper text", () => {
      render(Select, {
        id: "test-select",
        warn: true,
        warnText: "Warning message",
        helperText: "Helper text",
      });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).toHaveAttribute(
        "aria-describedby",
        "warn-test-select",
      );

      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    });

    it("works correctly for inline variant with invalid state", () => {
      render(Select, {
        id: "test-select",
        inline: true,
        invalid: true,
        invalidText: "Error message",
      });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).toHaveAttribute(
        "aria-describedby",
        "error-test-select",
      );
    });

    it("works correctly for inline variant with helper text", () => {
      render(Select, {
        id: "test-select",
        inline: true,
        helperText: "Helper text",
      });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).toHaveAttribute(
        "aria-describedby",
        "helper-test-select",
      );

      const helperElement = screen.getByText("Helper text");
      expect(helperElement).toHaveAttribute("id", "helper-test-select");
    });
  });

  it("renders with SelectItemGroup", () => {
    render(SelectGroup);

    const optgroup = document.querySelector('optgroup[label="Category 1"]');
    const selectElement = optgroup?.closest("select");
    assert(selectElement);
    const optgroups = selectElement.querySelectorAll("optgroup");

    expect(optgroups).toHaveLength(2);
    expect(optgroups[0]).toHaveAttribute("label", "Category 1");
    expect(optgroups[1]).toHaveAttribute("label", "Category 2");

    // Options in native select elements need querySelectorAll
    const options = selectElement.querySelectorAll("option");
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveAttribute("disabled");
    expect(options[0]).toHaveAttribute("hidden");
  });

  it("renders `text` instead of `value` if `text` is an empty string", () => {
    render(SelectFalsy);

    expect(screen.getByLabelText("Falsy text")).toHaveValue("-1");
    expect(screen.getByRole("option", { name: "" })).toBeInTheDocument();
  });

  it("renders value if `text` is undefined", () => {
    render(SelectFalsy);

    expect(screen.getByLabelText("Undefined text")).toHaveValue("2");
    expect(screen.getByRole("option", { name: "2" })).toBeInTheDocument();
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1977
  it("should not render label element when labelText is empty string", () => {
    const { container } = render(Select, { props: { labelText: "" } });
    expect(container.querySelector("label")).toBeNull();
  });
});

describe("Select Generics", () => {
  it("should enforce string | number constraint on generic type", () => {
    type StringLiteral = "option1" | "option2" | "option3";
    type ComponentType = SelectComponent<StringLiteral>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<Props["selected"]>().toEqualTypeOf<
      StringLiteral | undefined
    >();

    type NumberLiteral = 1 | 2 | 3;
    type NumberComponentType = SelectComponent<NumberLiteral>;
    type NumberProps = ComponentProps<NumberComponentType>;
    expectTypeOf<NumberProps["selected"]>().toEqualTypeOf<
      NumberLiteral | undefined
    >();

    type BaseComponentType = SelectComponent<string | number>;
    type BaseProps = ComponentProps<BaseComponentType>;
    expectTypeOf<BaseProps["selected"]>().toEqualTypeOf<
      string | number | undefined
    >();
  });

  it("should type SelectItem value to match Select generic", () => {
    type CustomValue = "option1" | "option2" | "option3";

    type ComponentType = SelectItemComponent<CustomValue>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();
  });

  it("should default SelectItem to string | number when generic is not specified", () => {
    type ComponentType = SelectItemComponent;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<Props["value"]>().toEqualTypeOf<string | number | undefined>();
  });
});
