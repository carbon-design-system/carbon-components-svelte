import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import DatePicker from "./DatePicker.test.svelte";
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
});
