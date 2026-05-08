import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TimePicker from "./TimePicker.test.svelte";
import TimePickerCustom from "./TimePickerCustom.test.svelte";
import TimePickerSelectSlot from "./TimePickerSelect.slot.test.svelte";
import TimePickerSelectEvents from "./TimePickerSelectEvents.test.svelte";

describe("TimePicker", () => {
  it("should render with default props", () => {
    render(TimePicker);

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "test-time");
    expect(input).toHaveAttribute("placeholder", "hh:mm");
    expect(input).toHaveAttribute("pattern", "(1[012]|[1-9]):[0-5][0-9](\\s)?");
    expect(input).toHaveAttribute("maxlength", "5");
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("PDT")).toBeInTheDocument();
    expect(screen.getByText("GMT")).toBeInTheDocument();
  });

  it("should handle different sizes", () => {
    const sizes = ["sm", "xl"] as const;
    for (const size of sizes) {
      const { container } = render(TimePicker, {
        props: { size },
      });

      expect(container.querySelector(".bx--time-picker")).toHaveClass(
        `bx--time-picker--${size}`,
      );
      container.remove();
    }
  });

  it("should handle light variant", () => {
    render(TimePicker, { props: { light: true } });

    const timePicker = screen.getByRole("textbox").closest(".bx--time-picker");
    expect(timePicker).toHaveClass("bx--time-picker--light");
  });

  it("should handle disabled state", () => {
    render(TimePicker, { props: { disabled: true } });

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(screen.getByText("Time")).toHaveClass("bx--label--disabled");
  });

  it("should handle readonly state", () => {
    const { container } = render(TimePicker, { props: { readonly: true } });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readonly");
    expect(container.querySelector(".bx--time-picker")).toHaveClass(
      "bx--time-picker--readonly",
    );
    expect(screen.getByText("Time")).toHaveClass("bx--label--readonly");
  });

  it("should not change value when readonly", async () => {
    render(TimePicker, { props: { readonly: true, value: "10:30" } });

    const input = screen.getByRole("textbox");
    await user.type(input, "11:45");
    expect(input).toHaveValue("10:30");
  });

  it("should handle invalid state", () => {
    render(TimePicker, {
      props: {
        id: "time-input",
        invalid: true,
        invalidText: "Invalid time",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).toHaveAttribute("data-invalid");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "error-time-input");
    const errorText = screen.getByText("Invalid time");
    expect(errorText).toHaveClass("bx--form-requirement");
    expect(errorText).toHaveAttribute("id", "error-time-input");
  });

  it("should not set aria-describedby when valid", () => {
    render(TimePicker);

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should handle warn state", () => {
    render(TimePicker, {
      props: { warn: true, warnText: "Time may be unusual" },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--warning");
    expect(input).not.toHaveClass("bx--text-input--invalid");
    expect(screen.getByText("Time may be unusual")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should prefer invalid over warn when both are set", () => {
    render(TimePicker, {
      props: {
        invalid: true,
        invalidText: "Invalid time",
        warn: true,
        warnText: "Time may be unusual",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).not.toHaveClass("bx--text-input--warning");
    expect(screen.getByText("Invalid time")).toBeInTheDocument();
    expect(screen.queryByText("Time may be unusual")).not.toBeInTheDocument();
  });

  it("should handle hidden label", () => {
    render(TimePicker, { props: { hideLabel: true } });

    expect(screen.getByText("Time")).toHaveClass("bx--visually-hidden");
  });

  it("should handle custom id", () => {
    render(TimePicker, { props: { id: "custom-id" } });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(screen.getByText("Time")).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(TimePicker, { props: { name: "custom-name" } });

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom placeholder", () => {
    render(TimePicker, { props: { placeholder: "Enter time" } });

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Enter time",
    );
  });

  it("should handle custom pattern", () => {
    render(TimePicker, { props: { pattern: "custom-pattern" } });

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "pattern",
      "custom-pattern",
    );
  });

  it("should handle custom maxlength", () => {
    render(TimePicker, { props: { maxlength: 10 } });

    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "10");
  });

  it("should handle value binding", async () => {
    render(TimePicker);

    const input = screen.getByRole("textbox");
    await user.type(input, "10:30");
    expect(input).toHaveValue("10:30");
  });

  it("should handle change event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TimePicker);

    const input = screen.getByRole("textbox");
    await user.type(input, "10:30");
    expect(consoleLog).toHaveBeenCalledWith("focus");
    expect(consoleLog).toHaveBeenCalledWith("input");
    await user.keyboard("{Enter}");
    expect(consoleLog).toHaveBeenCalledWith("keydown");
    expect(consoleLog).toHaveBeenCalledWith("input");

    expect(input).toHaveValue("10:30");
    await user.keyboard("{Tab}");
    expect(consoleLog).toHaveBeenCalledWith("change");
  });

  it("should handle focus and blur events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TimePicker);

    const input = screen.getByRole("textbox");
    await user.tab();
    expect(input).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("focus");

    await user.tab();
    expect(input).not.toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("blur");
  });

  it("should handle disabled state with events", async () => {
    render(TimePicker, { props: { disabled: true } });

    const input = screen.getByRole("textbox");
    await user.type(input, "10:30");
    expect(input).toHaveValue("");
  });

  it("should handle invalid state with helper text", () => {
    render(TimePicker, {
      props: {
        invalid: true,
        invalidText: "Invalid time",
      },
    });

    expect(screen.getByText("Invalid time")).toBeInTheDocument();
  });

  it("should render helper text", () => {
    render(TimePicker, {
      props: { id: "test-id", helperText: "24-hour, e.g. 14:30" },
    });

    const helper = screen.getByText("24-hour, e.g. 14:30");
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveClass("bx--form__helper-text");
    expect(helper).toHaveAttribute("id", "helper-test-id");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "helper-test-id",
    );
  });

  it("should associate error message via aria-describedby when invalid", () => {
    render(TimePicker, {
      props: { id: "test-id", invalid: true, invalidText: "Invalid time" },
    });

    expect(screen.getByText("Invalid time")).toHaveAttribute(
      "id",
      "error-test-id",
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "error-test-id");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should not render helper text when invalid", () => {
    render(TimePicker, {
      props: {
        helperText: "24-hour, e.g. 14:30",
        invalid: true,
        invalidText: "Invalid time",
      },
    });

    expect(screen.queryByText("24-hour, e.g. 14:30")).not.toBeInTheDocument();
    expect(screen.getByText("Invalid time")).toBeInTheDocument();
  });

  it("should apply disabled class to helper text when disabled", () => {
    render(TimePicker, {
      props: { helperText: "24-hour, e.g. 14:30", disabled: true },
    });

    expect(screen.getByText("24-hour, e.g. 14:30")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it("should handle label text slot", () => {
    render(TimePickerCustom);

    const label = screen.getByText("Custom Label Text");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("SPAN");
  });

  it("should handle TimePickerSelect components", () => {
    render(TimePicker);

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue("pm");
    expect(selects[1]).toHaveValue("pdt");
  });

  it("supports custom label slot for TimePickerSelect", () => {
    render(TimePickerSelectSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should support readonly on TimePickerSelect", async () => {
    const { container } = render(TimePickerCustom, {
      props: { selectReadonly: true },
    });

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    for (const select of selects) {
      expect(select).toHaveAttribute("aria-readonly", "true");
      expect(select.closest(".bx--time-picker__select")).toHaveClass(
        "bx--select--readonly",
      );
    }

    const [select] = selects;
    const initialValue = select.value;
    await user.click(select);
    await user.keyboard("{ArrowDown}");
    expect(select.value).toBe(initialValue);
    container.remove();
  });

  it("forwards select events from TimePickerSelect", async () => {
    const selectChange = vi.fn();
    const selectInput = vi.fn();
    const selectFocus = vi.fn();
    const selectBlur = vi.fn();

    render(TimePickerSelectEvents, {
      props: {
        selectChange,
        selectInput,
        selectFocus,
        selectBlur,
      },
    });

    const select = screen.getByRole("combobox");

    select.focus();
    expect(selectFocus).toHaveBeenCalled();

    await user.selectOptions(select, "pm");
    expect(selectChange).toHaveBeenCalled();
    expect(selectInput).toHaveBeenCalled();

    select.blur();
    expect(selectBlur).toHaveBeenCalled();
  });
});
