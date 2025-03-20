import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import RadioButton from "./RadioButton.test.svelte";
import RadioButtonCustom from "./RadioButtonCustom.test.svelte";

describe("RadioButton", () => {
  it("should render with default props", () => {
    render(RadioButton);

    const input = screen.getByRole("radio");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "test-group");
    expect(input).toHaveAttribute("value", "");
    expect(input).not.toBeChecked();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("should handle checked state", () => {
    render(RadioButton, { props: { checked: true } });

    expect(screen.getByRole("radio")).toBeChecked();
  });

  it("should handle disabled state", () => {
    render(RadioButton, { props: { disabled: true } });

    expect(screen.getByRole("radio")).toBeDisabled();
  });

  it("should handle required state", () => {
    render(RadioButton, { props: { required: true } });

    expect(screen.getByRole("radio")).toHaveAttribute("required");
  });

  it("should handle label position", () => {
    render(RadioButton, { props: { labelPosition: "left" } });

    expect(
      screen.getByText("Option 1").closest(".bx--radio-button-wrapper"),
    ).toHaveClass("bx--radio-button-wrapper--label-left");
  });

  it("should handle hidden label", () => {
    render(RadioButton, { props: { hideLabel: true } });

    expect(screen.getByText("Option 1")).toHaveClass("bx--visually-hidden");
  });

  it("should handle custom id", () => {
    render(RadioButton, { props: { id: "custom-id" } });

    expect(screen.getByRole("radio")).toHaveAttribute("id", "custom-id");

    const radioButton = screen
      .getByText("Option 1")
      .closest(".bx--radio-button-wrapper");
    assert(radioButton);
    expect(radioButton.querySelector("label")).toHaveAttribute(
      "for",
      "custom-id",
    );
  });

  it("should handle custom name", () => {
    render(RadioButton, { props: { name: "custom-name" } });

    expect(screen.getByRole("radio")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom value", () => {
    render(RadioButton, { props: { value: "custom-value" } });

    expect(screen.getByRole("radio")).toHaveAttribute("value", "custom-value");
  });

  it("should handle custom slots", () => {
    render(RadioButtonCustom);

    expect(screen.getByText("Custom Label Text")).toBeInTheDocument();
  });

  it("should handle change event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RadioButton);

    const input = screen.getByRole("radio");
    await user.click(input);

    expect(input).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change");
  });

  // TODO(bug): forward focus/blur events.
  it.skip("should handle focus and blur events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RadioButton);

    const input = screen.getByRole("radio");
    await user.tab();
    expect(input).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("focus");

    await user.tab();
    expect(input).not.toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("blur");
  });

  it("should handle disabled state with events", async () => {
    render(RadioButton, { props: { disabled: true } });

    const input = screen.getByRole("radio");
    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it("should handle required state with form validation", () => {
    render(RadioButton, { props: { required: true } });

    expect(screen.getByRole("radio")).toHaveAttribute("required");
  });

  it("should handle label text slot", () => {
    render(RadioButtonCustom);

    expect(screen.getByText("Custom Label Text").tagName).toBe("SPAN");
  });
});
