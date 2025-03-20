import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import NumberInput from "./NumberInput.test.svelte";
import NumberInputCustom from "./NumberInputCustom.test.svelte";

describe("NumberInput", () => {
  it("should render with default props", () => {
    render(NumberInput);

    expect(screen.getByLabelText("Clusters")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
  });

  it("should handle step value", () => {
    render(NumberInput, { props: { step: 0.1 } });

    expect(screen.getByRole("spinbutton")).toHaveAttribute("step", "0.1");
  });

  it("should handle min and max values", () => {
    render(NumberInput, { props: { min: 4, max: 20 } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "4");
    expect(input).toHaveAttribute("max", "20");
  });

  it("should handle different sizes", () => {
    (["sm", "xl"] as const).forEach((size) => {
      const { container } = render(NumberInput, {
        props: { size },
      });

      const input = container.querySelector("input");
      expect(input?.closest(".bx--number")).toHaveClass(`bx--number--${size}`);
      container.remove();
    });
  });

  it("should handle light variant", () => {
    render(NumberInput, { props: { light: true } });

    expect(screen.getByRole("spinbutton").closest(".bx--number")).toHaveClass(
      "bx--number--light",
    );
  });

  it("should handle disabled state", () => {
    render(NumberInput, {
      props: { disabled: true },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
    expect(screen.getByText("Clusters")).toHaveClass("bx--label--disabled");
  });

  it("should handle helper text", () => {
    render(NumberInput, {
      props: { helperText: "Helper text" },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text",
    );
  });

  it("should handle invalid state", () => {
    render(NumberInput, {
      props: { invalid: true, invalidText: "Invalid input" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid input")).toBeInTheDocument();

    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("should handle warning state", () => {
    render(NumberInput, {
      props: { warn: true, warnText: "Warning message" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input.closest(".bx--number__input-wrapper")).toHaveClass(
      "bx--number__input-wrapper--warning",
    );
    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should handle hidden label", () => {
    render(NumberInput, { props: { hideLabel: true } });

    expect(screen.getByText("Clusters")).toHaveClass("bx--visually-hidden");
  });

  it("should handle custom id", () => {
    render(NumberInput, { props: { id: "custom-id" } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(screen.getByText("Clusters")).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(NumberInput, { props: { name: "custom-name" } });

    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "name",
      "custom-name",
    );
  });

  it("should handle readonly state", () => {
    render(NumberInput, { props: { readonly: true } });

    expect(screen.getByRole("spinbutton")).toHaveAttribute("readonly");
  });

  it("should handle hidden steppers", () => {
    render(NumberInput, { props: { hideSteppers: true } });

    expect(
      screen.queryByRole("button", { name: "Increment number" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Decrement number" }),
    ).not.toBeInTheDocument();
  });

  // TODO(bug): The icon descriptions are not being applied.
  it.skip("should handle custom icon descriptions", () => {
    render(NumberInput, {
      props: { iconDescription: "Custom description" },
    });

    screen.getAllByRole("button").forEach((button) => {
      expect(button).toHaveAttribute("title", "Custom description");
    });
  });

  it("should handle custom slots", () => {
    render(NumberInputCustom);

    expect(screen.getByText("Custom Label Text")).toBeInTheDocument();
  });

  it("should handle value binding", async () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");
    expect(screen.getByTestId("value").textContent).toBe("5");
  });

  it("should handle increment/decrement buttons", async () => {
    render(NumberInput);

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    await user.click(incrementButton);
    expect(screen.getByTestId("value").textContent).toBe("1");

    await user.click(decrementButton);
    expect(screen.getByTestId("value").textContent).toBe("0");
  });

  it("should handle empty value when allowEmpty is true", async () => {
    render(NumberInput, {
      props: { allowEmpty: true },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    expect(input).toHaveValue(null);
  });

  it("should handle min/max validation", async () => {
    render(NumberInput, { props: { min: 4, max: 20 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "25");
    expect(screen.getByTestId("value").textContent).toBe("25");
    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("should not show helper text when invalid", () => {
    render(NumberInput, {
      props: {
        invalid: true,
        invalidText: "Invalid input",
        helperText: "Helper text",
      },
    });

    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("should not show helper text when warning", () => {
    render(NumberInput, {
      props: {
        warn: true,
        warnText: "Warning message",
        helperText: "Helper text",
      },
    });

    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should handle disabled helper text", () => {
    render(NumberInput, {
      props: {
        disabled: true,
        helperText: "Helper text",
      },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });
});
