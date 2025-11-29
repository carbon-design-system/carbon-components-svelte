import { render, screen, within } from "@testing-library/svelte";
import { user } from "../setup-tests";
import SelectFalsy from "./Select.falsy.test.svelte";
import SelectGroup from "./Select.group.test.svelte";
import SelectSkeleton from "./Select.skeleton.test.svelte";
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
});
