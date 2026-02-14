import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerInputSlot from "./DatePickerInput.slot.test.svelte";
import DatePickerRange from "./DatePickerRange.test.svelte";

describe("DatePicker", () => {
  it("renders with default props", async () => {
    render(DatePicker);

    const input = screen.getByLabelText("Date");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    await user.type(input, "01/01/2023");
    expect(input).toHaveValue("01/01/2023");
  });

  it("renders light variant", () => {
    const { container } = render(DatePicker, { light: true });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--light");
  });

  it("renders short variant", () => {
    const { container } = render(DatePicker, { short: true });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--short");
  });

  it("renders single mode", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--single");

    expect(
      screen.queryByLabelText("calendar-container"),
    ).not.toBeInTheDocument();
    await user.click(input);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
  });

  it("renders range mode", async () => {
    const { container } = render(DatePickerRange);

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    expect(inputStart).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(inputEnd).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--range");

    expect(
      screen.queryByLabelText("calendar-container"),
    ).not.toBeInTheDocument();
    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(DatePicker, { disabled: true });
    const input = screen.getByPlaceholderText("mm/dd/yyyy");
    expect(input).toBeDisabled();
  });

  it("handles invalid state", () => {
    const { container } = render(DatePicker, {
      invalid: true,
      invalidText: "Invalid date",
    });
    expect(screen.getByText("Invalid date")).toBeInTheDocument();
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--invalid");
  });

  it("handles warning state", () => {
    const { container } = render(DatePicker, {
      warn: true,
      warnText: "Warning message",
    });
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--warn");
  });

  it("handles helper text", () => {
    render(DatePicker, { helperText: "Helper message" });
    expect(screen.getByText("Helper message")).toBeInTheDocument();
  });

  it("handles hidden label", () => {
    render(DatePicker, { hideLabel: true });
    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(screen.getByText("Date")).toHaveClass("bx--visually-hidden");
  });

  it("dispatches change event when manually typing in simple mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "simple",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.type(input, "01/15/2024");
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toBe("01/15/2024");
  });

  it("dispatches change event when manually typing in single mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "single",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.type(input, "01/15/2024");
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
      dateStr: "01/15/2024",
    });
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/314
  // and https://github.com/carbon-design-system/carbon-components-svelte/issues/950
  it("dispatches change event when manually clearing in single mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "single",
        value: "01/15/2024",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.clear(input);
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
      dateStr: "",
    });
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1862
  it("allows clearing range dates by setting valueFrom and valueTo to empty strings", async () => {
    const { rerender } = render(DatePickerRange, {
      props: {
        valueFrom: "01/15/2024",
        valueTo: "01/20/2024",
      },
    });

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
    expect(inputStart).toHaveValue("01/15/2024");
    expect(inputEnd).toHaveValue("01/20/2024");

    // Clear the dates by setting both values to empty strings
    rerender({ valueFrom: "", valueTo: "" });
    await tick();

    expect(inputStart).toHaveValue("");
    expect(inputEnd).toHaveValue("");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/893
  it("syncs both inputs when range values are programmatically updated", async () => {
    const { rerender } = render(DatePickerRange, {
      props: {
        valueFrom: "01/01/2024",
        valueTo: "12/31/2024",
      },
    });

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
    expect(inputStart).toHaveValue("01/01/2024");
    expect(inputEnd).toHaveValue("12/31/2024");

    // Simulate programmatic update (e.g., from a month filter).
    rerender({ valueFrom: "01/01/2024", valueTo: "01/31/2024" });
    await tick();

    expect(inputStart).toHaveValue("01/01/2024");
    expect(inputEnd).toHaveValue("01/31/2024");

    // Update again to verify continued sync.
    rerender({ valueFrom: "03/01/2024", valueTo: "03/31/2024" });
    await tick();

    expect(inputStart).toHaveValue("03/01/2024");
    expect(inputEnd).toHaveValue("03/31/2024");
  });

  it("supports custom label slot for DatePickerInput", () => {
    render(DatePickerInputSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  describe("portalMenu", () => {
    afterEach(() => {
      // Clean up any flatpickr calendars appended to document.body.
      for (const el of document.body.querySelectorAll(".flatpickr-calendar")) {
        el.remove();
      }
    });

    it("renders calendar inside the date picker wrapper by default", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(true);
    });

    it("renders calendar at document.body when portalMenu is true", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        portalMenu: true,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(false);
      expect(document.body.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(false);
    });
  });
});
