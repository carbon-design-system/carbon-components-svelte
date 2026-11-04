import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import CurrencyInput from "./CurrencyInput.test.svelte";

const field = () => screen.getByRole("textbox") as HTMLInputElement;
const bound = () => screen.getByTestId("bound").textContent;
const NBSP = String.fromCodePoint(0xa0);

describe("CurrencyInput", () => {
  it("formats as it is typed and binds the decimal string", async () => {
    render(CurrencyInput);
    await user.type(field(), "1234567.8");

    expect(field()).toHaveValue("$1,234,567.8");
    expect(bound()).toBe('"1234567.8"');
  });

  it("pads the fraction digits when the field is left", async () => {
    render(CurrencyInput);
    await user.type(field(), "12.5");
    expect(field()).toHaveValue("$12.5");

    await user.tab();

    expect(field()).toHaveValue("$12.50");
    expect(bound()).toBe('"12.50"');
  });

  it("formats the value it starts with, for the locale", async () => {
    render(CurrencyInput, {
      props: { value: "1234.5", props: { locale: "de-DE", currency: "EUR" } },
    });
    await tick();

    expect(field()).toHaveValue(`1.234,50${NBSP}€`);
  });

  it("follows a value set from outside, and keeps digits past a double's precision", async () => {
    render(CurrencyInput);
    await user.click(screen.getByText("Set"));
    expect(field()).toHaveValue("$250.50");
  });

  it("reads the locale's own decimal mark and a pasted number from another locale", async () => {
    render(CurrencyInput, {
      props: { props: { locale: "de-DE", currency: "EUR" } },
    });
    field().focus();
    await user.keyboard("1234,5");
    expect(field()).toHaveValue(`1.234,5${NBSP}€`);
    expect(bound()).toBe('"1234.5"');

    field().setSelectionRange(0, field().value.length);
    field().dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "insertFromPaste",
        data: "9,876.54",
        bubbles: true,
        cancelable: true,
      }),
    );
    await tick();
    expect(field()).toHaveValue(`9.876,54${NBSP}€`);
    expect(bound()).toBe('"9876.54"');
  });

  it("deletes the digit before a group mark with Backspace", async () => {
    render(CurrencyInput, { props: { value: "1234" } });
    await tick();
    field().focus();
    // After the 2: a group mark sits between it and the 1.
    field().setSelectionRange(4, 4);
    expect(field()).toHaveValue("$1,234.00");

    await user.keyboard("{Backspace}");
    await tick();

    expect(field()).toHaveValue("$134.00");
    expect(field().selectionStart).toBe(2);
    expect(bound()).toBe('"134.00"');
  });

  it("takes no letters, no exponent and no minus unless negatives are allowed", async () => {
    render(CurrencyInput);
    await user.type(field(), "-1a2e3");

    expect(field()).toHaveValue("$123");
  });

  it("takes a minus where negatives are allowed", async () => {
    render(CurrencyInput, { props: { props: { min: "-100" } } });
    await user.type(field(), "-12.5");

    expect(field()).toHaveValue("-$12.5");
    expect(bound()).toBe('"-12.5"');
  });

  it("submits the decimal string under its name, not the formatted text", async () => {
    render(CurrencyInput, {
      props: { props: { name: "amount", locale: "de-DE", currency: "EUR" } },
    });
    await user.type(field(), "1234,5");

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("amount")).toBe("1234.5");
    expect(field()).not.toHaveAttribute("name");
  });

  it("marks an amount outside min and max, and off the step, invalid", async () => {
    render(CurrencyInput, {
      props: {
        value: "5",
        props: {
          min: 10,
          max: "100.50",
          step: "0.05",
          invalidText: "Out of range",
        },
      },
    });
    await tick();
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Out of range")).toBeInTheDocument();

    await user.clear(field());
    await user.type(field(), "100.5");
    await user.tab();
    expect(field()).not.toHaveAttribute("aria-invalid");

    await user.clear(field());
    await user.type(field(), "100.51");
    expect(field()).toHaveAttribute("aria-invalid", "true");

    await user.clear(field());
    await user.type(field(), "10.07");
    expect(field()).toHaveAttribute("aria-invalid", "true");
  });

  it("compares min and max as decimals", async () => {
    render(CurrencyInput, {
      props: { value: "0.30", props: { min: "0.3", max: 0.3 } },
    });
    await tick();

    expect(field()).not.toHaveAttribute("aria-invalid");
  });

  it("describes the field with the currency, for assistive technology", () => {
    render(CurrencyInput, { props: { props: { currency: "EUR" } } });

    const hint = screen.getByText("Amount in Euro");
    expect(field().getAttribute("aria-describedby")).toContain(hint.id);
    expect(field()).toHaveAttribute("inputmode", "decimal");
    expect(field()).toHaveAttribute("autocomplete", "off");
  });

  it("asks for the full keyboard where negatives are allowed, and takes a custom hint", () => {
    render(CurrencyInput, {
      props: { props: { allowNegative: true, hintText: "Betrag in Euro" } },
    });

    expect(field()).toHaveAttribute("inputmode", "text");
    expect(screen.getByText("Betrag in Euro")).toBeInTheDocument();
  });

  it("runs the number in its own direction, set by the locale", () => {
    const { unmount } = render(CurrencyInput, {
      props: { props: { locale: "ar-EG", currency: "EGP" } },
    });
    expect(field()).toHaveAttribute("data-ccs-number-format", "rtl");
    unmount();

    render(CurrencyInput, {
      props: { props: { locale: "en-US", currency: "USD" } },
    });
    expect(field()).toHaveAttribute("data-ccs-number-format", "ltr");
  });

  it("clears the text and the value when the form resets", async () => {
    render(CurrencyInput);
    await user.type(field(), "12.5");
    expect(bound()).toBe('"12.5"');

    await user.click(screen.getByText("Reset"));
    await tick();

    expect(field()).toHaveValue("");
    expect(bound()).toBe('""');
  });

  it("fires one input event per key", async () => {
    render(CurrencyInput, { props: { events: 0 } });
    await user.type(field(), "12.5");

    expect(screen.getByTestId("events")).toHaveTextContent("4");
  });
});
