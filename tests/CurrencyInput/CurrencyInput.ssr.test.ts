// @vitest-environment node
import UnitInput from "../UnitInput/UnitInput.test.svelte";
import { renderSSR } from "../utils/ssr";
import CurrencyInput from "./CurrencyInput.test.svelte";

const NBSP = String.fromCodePoint(0xa0);

describe("number entry server render", () => {
  it("renders the formatted amount, the hidden number and the hint, with no browser global", () => {
    const { document } = renderSSR(CurrencyInput, {
      value: "1234.5",
      props: { locale: "de-DE", currency: "EUR", name: "amount" },
    });

    const field = document.querySelector<HTMLInputElement>(
      "input.bx--text-input",
    );
    expect(field?.getAttribute("value")).toBe(`1.234,50${NBSP}€`);
    expect(field?.getAttribute("inputmode")).toBe("decimal");
    expect(field?.getAttribute("data-ccs-number-format")).toBe("ltr");
    expect(
      document.querySelector('input[type="hidden"]')?.getAttribute("value"),
    ).toBe("1234.50");
    expect(document.body.textContent).toContain("Amount in Euro");
  });

  it("renders an empty field for an empty value", () => {
    const { document } = renderSSR(CurrencyInput, { value: "" });

    expect(
      document.querySelector("input.bx--text-input")?.getAttribute("value"),
    ).toBe("");
  });

  it("renders a right-to-left locale in its own direction", () => {
    const { document } = renderSSR(CurrencyInput, {
      value: "12",
      props: { locale: "ar-EG", currency: "EGP" },
    });

    const field = document.querySelector("input.bx--text-input");
    expect(field?.getAttribute("data-ccs-number-format")).toBe("rtl");
    expect(field?.getAttribute("value")).toContain(
      String.fromCodePoint(0x661, 0x662),
    );
  });

  it("renders a unit field with the number and the unit", () => {
    const { document } = renderSSR(UnitInput, { value: 12.5 });

    expect(
      document.querySelector("input.bx--text-input")?.getAttribute("value"),
    ).toBe("12.5 kg");
  });
});
