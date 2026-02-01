import { render, screen, within } from "@testing-library/svelte";
import type SelectComponent from "carbon-components-svelte/Select/Select.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import SelectFalsy from "./Select.falsy.test.svelte";
import SelectGroup from "./Select.group.test.svelte";
import SelectSkeleton from "./Select.skeleton.test.svelte";
import SelectSlot from "./Select.slot.test.svelte";
import Select from "./Select.test.svelte";

describe("Select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const consoleLog = vi.spyOn(console, "log");
    render(Select);

    const selectElement = screen.getByLabelText("Select label");
    await user.selectOptions(selectElement, "option-2");

    expect(consoleLog).toHaveBeenCalledWith("change");
    expect(consoleLog).toHaveBeenCalledWith("input");
    expect(consoleLog).toHaveBeenCalledWith("update", "option-2");
    expect(consoleLog).toHaveBeenCalledTimes(3);
  });

  it("renders default size", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).not.toHaveClass("bx--select-input--sm");
    expect(selectElement).not.toHaveClass("bx--select-input--xl");
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
  });

  it("renders inline variant", () => {
    render(Select, { inline: true });
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).toHaveClass("bx--select--inline");
  });

  it("renders default theme", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).not.toHaveClass("bx--select--light");
  });

  it("renders light theme", () => {
    render(Select, { light: true });
    const selectElement = screen.getByLabelText("Select label");
    const selectWrapper = selectElement.closest(".bx--select");
    assert(selectWrapper);
    expect(selectWrapper).toHaveClass("bx--select--light");
  });

  it("renders enabled by default", () => {
    render(Select);
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).not.toBeDisabled();
  });

  it("renders disabled state", () => {
    render(Select, { disabled: true });
    const selectElement = screen.getByLabelText("Select label");
    expect(selectElement).toBeDisabled();
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

  it("renders without helper text by default", () => {
    render(Select);
    expect(screen.queryByText(/helper/i)).not.toBeInTheDocument();
  });

  it("renders helper text when provided", () => {
    render(Select, { helperText: "Helper text" });
    const helperElement = screen.getByText("Helper text");
    expect(helperElement).toHaveTextContent("Helper text");
  });

  describe("aria-describedby", () => {
    it("references error message when invalid", () => {
      render(Select, {
        id: "test-select",
        invalid: true,
        invalidText: "Error message",
      });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).toHaveAttribute(
        "aria-describedby",
        "error-test-select",
      );

      const errorElement = screen.getByText("Error message");
      expect(errorElement).toHaveAttribute("id", "error-test-select");
    });

    it("references warning message when warn and not invalid", () => {
      render(Select, {
        id: "test-select",
        warn: true,
        warnText: "Warning message",
      });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).toHaveAttribute(
        "aria-describedby",
        "warn-test-select",
      );

      const warnElement = screen.getByText("Warning message");
      expect(warnElement).toHaveAttribute("id", "warn-test-select");
    });

    it("references helper text when provided and not invalid or warn", () => {
      render(Select, {
        id: "test-select",
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

    it("has no aria-describedby when no messages are present", () => {
      render(Select, { id: "test-select" });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).not.toHaveAttribute("aria-describedby");
    });

    it("prioritizes error over warning", () => {
      render(Select, {
        id: "test-select",
        invalid: true,
        invalidText: "Error message",
        warn: true,
        warnText: "Warning message",
      });

      const selectElement = screen.getByLabelText("Select label");
      expect(selectElement).toHaveAttribute(
        "aria-describedby",
        "error-test-select",
      );
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

      // Helper text should not be rendered when warn is true
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

  it("renders visible label by default", () => {
    render(Select);
    const label = screen.getByText("Select label");
    expect(label).not.toHaveClass("bx--visually-hidden");
  });

  it("renders with hidden label", () => {
    render(Select, { hideLabel: true });
    const label = screen.getByText("Select label");
    expect(label).toHaveClass("bx--visually-hidden");
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

  it("renders skeleton state", () => {
    render(SelectSkeleton);

    const skeleton = screen.getByTestId("select-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.children[0]).toHaveClass("bx--skeleton");
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
    render(Select, { props: { labelText: "" } });
    expect(screen.queryByText("Select label")).not.toBeInTheDocument();
  });
});

describe("Select Generics", () => {
  it("should support custom value types with generics", () => {
    type CustomValue = "option1" | "option2" | "option3";

    const customValues: CustomValue[] = ["option1", "option2"];
    expectTypeOf<typeof customValues>().toEqualTypeOf<CustomValue[]>();

    type SelectedPropType = CustomValue | undefined;
    expectTypeOf<SelectedPropType>().toEqualTypeOf<CustomValue | undefined>();

    type UpdateEventDetail = CustomValue;
    expectTypeOf<UpdateEventDetail>().toEqualTypeOf<CustomValue>();
  });

  it("should default to string | number type when generic is not specified", () => {
    type DefaultValue = string | number;

    const defaultValues: DefaultValue[] = ["test", 123];
    expectTypeOf<typeof defaultValues>().toEqualTypeOf<DefaultValue[]>();

    type SelectedPropType = DefaultValue | undefined;
    expectTypeOf<SelectedPropType>().toEqualTypeOf<DefaultValue | undefined>();
  });

  it("should provide type-safe access to custom value types in event handlers", () => {
    type StatusValue = "pending" | "approved" | "rejected";

    const handleUpdate = (value: StatusValue) => {
      const testValue: StatusValue = value;
      expectTypeOf<typeof testValue>().toEqualTypeOf<StatusValue>();
      if (value === "approved") {
        const approvedValue: "approved" = value;
        expectTypeOf<typeof approvedValue>().toEqualTypeOf<"approved">();
      }
    };

    type HandleUpdateParam = Parameters<typeof handleUpdate>[0];
    expectTypeOf<HandleUpdateParam>().toEqualTypeOf<StatusValue>();

    const testValue: StatusValue = "approved";
    const _handlerParam: Parameters<typeof handleUpdate>[0] = testValue;
    expectTypeOf<HandleUpdateParam>().toEqualTypeOf<StatusValue>();
  });

  it("should work with number value types", () => {
    type NumericValue = 1 | 2 | 3 | 4 | 5;

    const numericValues: NumericValue[] = [1, 2, 3];
    expectTypeOf<typeof numericValues>().toEqualTypeOf<NumericValue[]>();

    type SelectedPropType = NumericValue | undefined;
    expectTypeOf<SelectedPropType>().toEqualTypeOf<NumericValue | undefined>();
  });

  it("should work with string value types", () => {
    type StringValue = string;

    const stringValues: StringValue[] = ["test", "value"];
    expectTypeOf<typeof stringValues>().toEqualTypeOf<StringValue[]>();

    type SelectedPropType = StringValue | undefined;
    expectTypeOf<SelectedPropType>().toEqualTypeOf<StringValue | undefined>();
  });

  it("should work with union value types", () => {
    type UnionValue = "yes" | "no" | 0 | 1;

    const unionValues: UnionValue[] = ["yes", "no", 0, 1];
    expectTypeOf<typeof unionValues>().toEqualTypeOf<UnionValue[]>();

    type SelectedPropType = UnionValue | undefined;
    expectTypeOf<SelectedPropType>().toEqualTypeOf<UnionValue | undefined>();
  });

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

  it("supports custom label slot", () => {
    render(SelectSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });
});
