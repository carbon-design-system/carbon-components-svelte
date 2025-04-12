import { render, screen } from "@testing-library/svelte";
import flatpickr from "flatpickr";
import { user } from "../setup-tests";
import DatePickerTest from "./DatePicker.test.svelte";

describe("DatePicker", () => {
  it("renders with default props", () => {
    render(DatePickerTest);
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("mm/dd/yyyy")).toBeInTheDocument();
  });

  it("renders with different variants", () => {
    const { rerender } = render(DatePickerTest, { light: true });
    expect(screen.getByTestId("date-picker")).toHaveClass(
      "bx--date-picker--light",
    );

    rerender({ short: true });
    expect(screen.getByTestId("date-picker")).toHaveClass(
      "bx--date-picker--short",
    );

    rerender({ datePickerType: "single" });
    expect(screen.getByTestId("date-picker")).toHaveClass(
      "bx--date-picker--single",
    );

    rerender({ datePickerType: "range" });
    expect(screen.getByTestId("date-picker")).toHaveClass(
      "bx--date-picker--range",
    );
  });

  it("handles date selection in single mode", async () => {
    const { component } = render(DatePickerTest, { datePickerType: "single" });
    const input = screen.getByPlaceholderText("mm/dd/yyyy");

    const handleChange = vi.fn();
    component.$on("change", handleChange);

    await user.type(input, "01/01/2023");

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          dateStr: "01/01/2023",
        }),
      }),
    );
  });

  it("handles date range selection", async () => {
    const { component } = render(DatePickerTest, {
      datePickerType: "range",
      valueFrom: "01/01/2023",
      valueTo: "01/15/2023",
    });

    const handleChange = vi.fn();
    component.$on("change", handleChange);

    const inputs = screen.getAllByPlaceholderText("mm/dd/yyyy");

    await user.type(inputs[0], "01/01/2023");
    await user.type(inputs[1], "01/15/2023");

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          dateStr: {
            from: "01/01/2023",
            to: "01/15/2023",
          },
        }),
      }),
    );
  });

  it("handles disabled state", () => {
    render(DatePickerTest, { disabled: true });
    const input = screen.getByPlaceholderText("mm/dd/yyyy");
    expect(input).toBeDisabled();
  });

  it("handles invalid state", () => {
    render(DatePickerTest, {
      invalid: true,
      invalidText: "Invalid date",
    });
    expect(screen.getByText("Invalid date")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toHaveClass(
      "bx--date-picker--invalid",
    );
  });

  it("handles warning state", () => {
    render(DatePickerTest, {
      warn: true,
      warnText: "Warning message",
    });
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toHaveClass(
      "bx--date-picker--warning",
    );
  });

  it("handles helper text", () => {
    render(DatePickerTest, { helperText: "Helper message" });
    expect(screen.getByText("Helper message")).toBeInTheDocument();
  });

  it("handles hidden label", () => {
    render(DatePickerTest, { hideLabel: true });
    expect(screen.getByText("Date")).toHaveClass("bx--visually-hidden");
  });

  it("respects min and max dates", async () => {
    const { component } = render(DatePickerTest, {
      minDate: "01/01/2023",
      maxDate: "12/31/2023",
    });

    const handleChange = vi.fn();
    component.$on("change", handleChange);

    const input = screen.getByPlaceholderText("mm/dd/yyyy");

    // Try to set date before min date
    await user.type(input, "12/31/2022");
    expect(handleChange).not.toHaveBeenCalled();

    // Try to set date after max date
    await user.type(input, "01/01/2024");
    expect(handleChange).not.toHaveBeenCalled();

    // Try to set valid date
    await user.type(input, "06/15/2023");
    expect(handleChange).toHaveBeenCalled();
  });

  it("handles different date formats", async () => {
    const { component } = render(DatePickerTest, { dateFormat: "Y-m-d" });

    const handleChange = vi.fn();
    component.$on("change", handleChange);

    const input = screen.getByPlaceholderText("mm/dd/yyyy");
    await user.type(input, "2023-01-01");

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          dateStr: "2023-01-01",
        }),
      }),
    );
  });

  it("handles different locales", () => {
    render(DatePickerTest, { locale: "fr" });
    // Note: Actual locale testing would require mocking flatpickr's locale system
    // This is just a basic test to ensure the prop is passed
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });

  it("cleans up flatpickr instance on unmount", () => {
    const { unmount } = render(DatePickerTest);
    unmount();
    // Verify that flatpickr's destroy method was called
    expect(
      vi.mocked(flatpickr).mock.results[0].value.destroy,
    ).toHaveBeenCalled();
  });
});
