import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import FormSize from "./Form.size.test.svelte";

function fieldClasses(size: string) {
  const form = getForm();
  return [
    [screen.getByLabelText("Workspace"), `bx--text-input--${size}`],
    [screen.getByLabelText("Password"), `bx--text-input--${size}`],
    [
      screen.getByLabelText("Clusters").closest(".bx--number"),
      `bx--number--${size}`,
    ],
    [screen.getByLabelText("Plan"), `bx--select-input--${size}`],
    [screen.getByLabelText("Start date"), `bx--date-picker__input--${size}`],
    [
      screen.getByLabelText("Start time").closest(".bx--time-picker"),
      `bx--time-picker--${size}`,
    ],
    [screen.getByLabelText("Token"), `bx--text-input--${size}`],
    [form.querySelector(".bx--dropdown"), `bx--list-box--${size}`],
    [form.querySelector(".bx--combo-box"), `bx--list-box--${size}`],
    [form.querySelector(".bx--multi-select"), `bx--list-box--${size}`],
    [
      screen.getByRole("searchbox").closest(".bx--search"),
      `bx--search--${size}`,
    ],
    [
      screen.getByTestId("skeleton").querySelector(".bx--text-input"),
      `bx--text-input--${size}`,
    ],
  ] as const;
}

describe("Form size", () => {
  it("leaves fields at their own default size when unset", () => {
    render(FormSize);

    expect(screen.getByLabelText("Workspace").className).not.toMatch(
      /bx--text-input--(xs|sm|xl)/,
    );
    expect(screen.getByRole("searchbox").closest(".bx--search")).toHaveClass(
      "bx--search--xl",
    );
  });

  it.each(["xs", "sm", "xl"] as const)("passes %s to every field", (size) => {
    render(FormSize, { props: { size } });

    for (const [element, className] of fieldClasses(size)) {
      expect(element).toHaveClass(className);
    }
  });

  it("lets a field's own size win", () => {
    render(FormSize, { props: { size: "xs" } });

    const override = screen.getByLabelText("Override");
    expect(override).toHaveClass("bx--text-input--xl");
    expect(override).not.toHaveClass("bx--text-input--xs");
  });

  it("updates fields when the form size changes", async () => {
    const { rerender } = render(FormSize, { props: { size: "xs" } });
    expect(screen.getByLabelText("Workspace")).toHaveClass(
      "bx--text-input--xs",
    );

    await rerender({ size: "sm" });

    expect(screen.getByLabelText("Workspace")).toHaveClass(
      "bx--text-input--sm",
    );
    expect(screen.getByLabelText("Workspace")).not.toHaveClass(
      "bx--text-input--xs",
    );
  });
});
