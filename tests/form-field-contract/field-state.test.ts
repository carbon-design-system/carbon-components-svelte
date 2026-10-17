import { render, screen } from "@testing-library/svelte";
import { cases } from "./cases";
import { controls, type FieldCase } from "./contract";
import FieldHost from "./fixtures/FieldHost.test.svelte";

const stateCases = cases
  .filter((c) => c.state)
  .map((c) => [c.name, c] as const);

const renderField = (c: FieldCase, props: Record<string, unknown> = {}) =>
  render(FieldHost, {
    props: { component: c.component, fieldProps: { ...c.props, ...props } },
  });

const tokens = (el: HTMLElement, attr: string) =>
  el.getAttribute(attr)?.split(" ").filter(Boolean) ?? [];

describe.each(stateCases)("%s field state", (_, c) => {
  const errorAttribute = c.state?.errorAttribute ?? "aria-errormessage";
  const described = () =>
    c.state?.described ? [c.state.described()] : controls(c);

  it("marks the control invalid and points it at an announced message", () => {
    renderField(c, { invalid: true, invalidText: "Bad" });

    const message = screen.getByText("Bad");
    expect(message).toHaveClass("bx--form-requirement");
    expect(message).toHaveAttribute("role", "alert");
    for (const control of controls(c)) {
      expect(control).toHaveAttribute("aria-invalid", "true");
      expect(tokens(control, errorAttribute)).toContain(message.id);
      if (errorAttribute === "aria-errormessage") {
        expect(tokens(control, "aria-describedby")).not.toContain(message.id);
      }
    }
  });

  it("describes the control with the warning", () => {
    renderField(c, { warn: true, warnText: "Careful" });

    const message = screen.getByText("Careful");
    expect(message).toHaveClass("bx--form-requirement");
    for (const control of controls(c)) {
      expect(control).not.toHaveAttribute("aria-invalid");
    }
    for (const element of described()) {
      expect(tokens(element, "aria-describedby")).toContain(message.id);
    }
  });

  it("describes the control with the helper text", () => {
    renderField(c, { helperText: "Helps" });

    const helper = screen.getByText("Helps");
    for (const element of described()) {
      expect(tokens(element, "aria-describedby")).toContain(helper.id);
    }
  });

  it.each([
    ["invalid", { invalid: true, invalidText: "Bad" }],
    ["warn", { warn: true, warnText: "Careful" }],
  ])("hides the helper text when %s", (_, state) => {
    renderField(c, { helperText: "Helps", ...state });

    expect(screen.queryByText("Helps")).toBeNull();
  });

  it("shows the invalid message over the warning", () => {
    renderField(c, {
      invalid: true,
      invalidText: "Bad",
      warn: true,
      warnText: "Careful",
    });

    expect(screen.getByText("Bad")).toBeInTheDocument();
    expect(screen.queryByText("Careful")).toBeNull();
  });

  it.each([{ disabled: true }, { readonly: true }])(
    "suppresses invalid and warning states when %o",
    (state) => {
      renderField(c, {
        invalid: true,
        invalidText: "Bad",
        warn: true,
        warnText: "Careful",
        ...state,
      });

      expect(screen.queryByText("Bad")).toBeNull();
      expect(screen.queryByText("Careful")).toBeNull();
      for (const control of controls(c)) {
        expect(control).not.toHaveAttribute("aria-invalid");
      }
    },
  );

  it("clears the invalid state when invalid turns off", async () => {
    const { rerender } = renderField(c, { invalid: true, invalidText: "Bad" });

    await rerender({
      fieldProps: { ...c.props, invalid: false, invalidText: "Bad" },
    });

    expect(screen.queryByText("Bad")).toBeNull();
    for (const control of controls(c)) {
      expect(control).not.toHaveAttribute("aria-invalid");
      expect(control).not.toHaveAttribute(errorAttribute);
    }
  });

  it("visually hides the label with hideLabel", () => {
    renderField(c, { hideLabel: true });

    expect(screen.getByText("Field")).toHaveClass("bx--visually-hidden");
  });
});
