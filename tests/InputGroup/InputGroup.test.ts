import { render, screen } from "@testing-library/svelte";
import InputGroup from "./InputGroup.test.svelte";
import InputGroupInForm from "./InputGroupInForm.test.svelte";

describe("InputGroup", () => {
  it("names the group with its label", () => {
    render(InputGroup);

    expect(screen.getByRole("group", { name: "Promo code" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Code" })).toBeInTheDocument();
  });

  it("hides the legend visually with hideLegend", () => {
    render(InputGroup, { hideLegend: true });

    expect(screen.getByText("Promo code")).toHaveClass("bx--visually-hidden");
    expect(screen.getByRole("group", { name: "Promo code" })).toBeVisible();
  });

  it("disables every field and button with disabled", () => {
    render(InputGroup, { disabled: true });

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it.each([
    ["invalid", { invalid: true, invalidText: "Code expired" }],
    ["warn", { warn: true, warnText: "Ends tonight" }],
  ])("ignores %s when disabled", (_state, props) => {
    const { container } = render(InputGroup, {
      disabled: true,
      helperText: "One code per order",
      ...props,
    });

    expect(screen.getByText("One code per order")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(
      container.querySelector(
        ".bx--input-group--invalid, .bx--input-group--warning",
      ),
    ).toBeNull();
  });

  it("replaces the helper text when invalid without a message", () => {
    render(InputGroup, { invalid: true, helperText: "One code per order" });

    expect(screen.queryByText("One code per order")).toBeNull();
  });

  it("shows helper text below the group and describes the field by it", () => {
    render(InputGroup, { helperText: "One code per order" });

    const helper = screen.getByText("One code per order");
    expect(helper).toHaveClass("bx--form__helper-text");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      helper.id,
    );
  });

  it.each([
    [
      "invalid",
      { invalid: true, invalidText: "Code expired" },
      "Code expired",
      "bx--form-requirement--invalid",
    ],
    [
      "warning",
      { warn: true, warnText: "Ends tonight" },
      "Ends tonight",
      "bx--form-requirement--warn",
    ],
  ])(
    "shows the %s message in place of the helper text",
    (_state, props, text, className) => {
      render(InputGroup, { helperText: "One code per order", ...props });

      const message = screen.getByText(text);
      expect(message).toHaveClass("bx--form-requirement", className);
      expect(screen.queryByText("One code per order")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        message.id,
      );
    },
  );

  it("passes the invalid state to the field through the slot prop", () => {
    render(InputGroup, { invalid: true, invalidText: "Code expired" });

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Code expired");
  });

  it.each([
    [undefined, "bx--btn--field", undefined],
    ["sm", "bx--btn--sm", "bx--text-input--sm"],
    ["xl", undefined, "bx--text-input--xl"],
  ] as const)(
    "matches the button to size %s",
    (size, buttonClass, inputClass) => {
      render(InputGroup, { size });

      const button = screen.getByRole("button", { name: "Apply" });
      for (const name of ["bx--btn--sm", "bx--btn--field", "bx--btn--xs"]) {
        if (name === buttonClass) expect(button).toHaveClass(name);
        else expect(button).not.toHaveClass(name);
      }
      if (inputClass)
        expect(screen.getByRole("textbox")).toHaveClass(inputClass);
    },
  );

  it("inherits the size of a parent Form", () => {
    render(InputGroupInForm);

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-input--sm");
    expect(screen.getByRole("button", { name: "Apply" })).toHaveClass(
      "bx--btn--sm",
    );
  });
});
