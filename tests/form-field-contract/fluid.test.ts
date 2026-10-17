import { render, screen } from "@testing-library/svelte";
import { cases } from "./cases";
import { controls, type FieldCase } from "./contract";
import FieldHost from "./fixtures/FieldHost.test.svelte";

type FluidCase = FieldCase & { fluid: NonNullable<FieldCase["fluid"]> };

const fluidCases = cases
  .filter((c): c is FluidCase => !!c.fluid)
  .map((c) => [c.name, c] as const);

const renderField = (
  c: FieldCase,
  props: Record<string, unknown> = {},
  inFluidForm = false,
) =>
  render(FieldHost, {
    props: {
      component: c.component,
      fieldProps: { ...c.props, ...props },
      inFluidForm,
    },
  });

describe.each(fluidCases)("%s fluid variant", (_, c) => {
  const fluidRoot = () => document.querySelector(`.${c.fluid.className}`);

  it("is off by default", () => {
    renderField(c);

    expect(fluidRoot()).toBeNull();
    expect(screen.getByText("Field")).not.toHaveClass("bx--label--slotted");
  });

  it.each([
    ["the fluid prop", { fluid: true }, false],
    ["a FluidForm", {}, true],
  ])("turns on from %s", (_, props, inFluidForm) => {
    renderField(c, props, inFluidForm);

    expect(fluidRoot()).not.toBeNull();
    expect(screen.getByText("Field")).toHaveClass("bx--label--slotted");
  });

  const ignoredWith = Object.keys(c.fluid.ignoredWith ?? {}).join(", ");

  it.skipIf(!ignoredWith)(`stays off with ${ignoredWith} set`, () => {
    renderField(c, { fluid: true, ...c.fluid.ignoredWith });

    expect(fluidRoot()).toBeNull();
  });

  it.skipIf(c.fluid.skip?.hidesHelper)("hides helper text", () => {
    renderField(c, { fluid: true, helperText: "Helper" });

    expect(screen.queryByText("Helper")).toBeNull();
  });

  it.skipIf(c.fluid.skip?.messagesInWrapper)(
    "renders the invalid message inside the field wrapper",
    () => {
      renderField(c, { fluid: true, invalid: true, invalidText: "Bad" });

      const message = screen.getByText("Bad");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(c.fluid.wrapper)).not.toBeNull();
      const attribute = c.fluid.errorAttribute ?? "aria-errormessage";
      for (const control of controls(c)) {
        expect(control).toHaveAttribute("aria-invalid", "true");
        expect(control.getAttribute(attribute)?.split(" ")).toContain(
          message.id,
        );
      }
    },
  );

  it("announces the invalid message", () => {
    renderField(c, { fluid: true, invalid: true, invalidText: "Bad" });

    expect(screen.getByText("Bad")).toHaveAttribute("role", "alert");
  });

  it.skipIf(c.fluid.skip?.messagesInWrapper)(
    "renders the warning message inside the field wrapper",
    () => {
      renderField(c, { fluid: true, warn: true, warnText: "Careful" });

      const message = screen.getByText("Careful");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(c.fluid.wrapper)).not.toBeNull();
    },
  );

  it.each([{ disabled: true }, { readonly: true }])(
    "suppresses invalid and warning states when %o",
    (state) => {
      renderField(c, {
        fluid: true,
        invalid: true,
        invalidText: "Bad",
        warn: true,
        warnText: "Careful",
        ...state,
      });

      expect(screen.queryByText("Bad")).toBeNull();
      expect(screen.queryByText("Careful")).toBeNull();
      expect(document.querySelector("[data-invalid]")).toBeNull();
      for (const control of controls(c)) {
        expect(control).not.toHaveAttribute("aria-invalid");
      }
    },
  );
});
