import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { attemptSubmit } from "../utils/attempt-submit";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.required.test.svelte";

describe("DatePicker required and pattern", () => {
  it("shows the invalid state for an empty required date", async () => {
    render(DatePicker, { props: { datePickerType: "simple" } });
    const input = screen.getByLabelText("Date");
    let cancelled = false;
    input.addEventListener("invalid", (e) => {
      cancelled = e.defaultPrevented;
    });

    await attemptSubmit();
    await tick();

    expect(cancelled).toBe(true);
    expect(screen.getByText("Enter a date")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveFocus();
  });

  it("shows the invalid state for a date that doesn't match the format", async () => {
    render(DatePicker, { props: { datePickerType: "simple" } });
    const input = screen.getByLabelText("Date");
    await user.type(input, "tomorrow");

    await attemptSubmit();
    await tick();

    expect(screen.getByText("Enter a valid date")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    await user.type(input, "x");
    expect(screen.queryByText("Enter a valid date")).toBeNull();
  });

  it("clears the state on form reset", async () => {
    render(DatePicker);
    await attemptSubmit();
    await tick();
    expect(screen.getByText("Enter a date")).toBeInTheDocument();

    getForm().reset();
    await flushFormReset();
    expect(screen.queryByText("Enter a date")).toBeNull();
  });

  it("prefers the consumer's own invalid text", async () => {
    render(DatePicker, { props: { invalid: true, invalidText: "Too early" } });
    await attemptSubmit();
    await tick();

    expect(screen.getByText("Too early")).toBeInTheDocument();
    expect(screen.queryByText("Enter a date")).toBeNull();
  });
});
