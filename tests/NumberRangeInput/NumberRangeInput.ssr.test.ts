// @vitest-environment node
import NumberRangeInput from "carbon-components-svelte/NumberRangeInput/NumberRangeInput.svelte";
import { renderSSR } from "../utils/ssr";

describe("NumberRangeInput (server)", () => {
  it("renders the group, both fields with their values, and the separator", () => {
    const { document } = renderSSR(NumberRangeInput, {
      labelText: "Price",
      value: [10, null],
      separator: "to",
    });

    const group = document.querySelector("fieldset");
    expect(group?.querySelector("legend")?.textContent?.trim()).toBe("Price");
    const [min, max] = [...document.querySelectorAll("input")];
    expect(min.getAttribute("aria-label")).toBe("Minimum Price");
    expect(min.value).toBe("10");
    expect(max.getAttribute("aria-label")).toBe("Maximum Price");
    expect(max.value).toBe("");
    expect(
      document.querySelector(".bx--number-range-input__separator")?.textContent,
    ).toBe("to");
  });

  it("renders a crossed value with the error on the maximum", () => {
    const { document } = renderSSR(NumberRangeInput, { value: [300, 250] });

    const [min, max] = [...document.querySelectorAll("input")];
    expect(min.getAttribute("aria-invalid")).toBeNull();
    expect(max.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(max.getAttribute("aria-errormessage") ?? ""),
    ).not.toBeNull();
  });

  it("renders the slider handles at the range, an open end at its bound", () => {
    const { document } = renderSSR(NumberRangeInput, {
      slider: true,
      min: 0,
      max: 100,
      value: [null, 60],
    });

    const [lower, upper] = [...document.querySelectorAll("[role=slider]")];
    expect(lower.getAttribute("aria-valuenow")).toBe("0");
    expect(upper.getAttribute("aria-valuenow")).toBe("60");
  });

  it("formats the fields in the locale", () => {
    const { document } = renderSSR(NumberRangeInput, {
      locale: "de-DE",
      value: [1234.5, 2000],
    });

    const [min, max] = [...document.querySelectorAll("input[type=text]")];
    expect((min as HTMLInputElement).value).toBe("1.234,5");
    expect((max as HTMLInputElement).value).toBe("2.000");
  });
});
