// @vitest-environment node
import ColorInput from "carbon-components-svelte/ColorPicker/ColorInput.svelte";
import { renderSSR } from "../utils/ssr";

describe("ColorInput server render", () => {
  it("renders the value, the swatch color and a closed button", () => {
    const { document } = renderSSR(ColorInput, {
      value: "#da1e28",
      labelText: "Brand color",
    });

    expect(document.querySelector("input")?.getAttribute("value")).toBe(
      "#da1e28",
    );
    const button = document.querySelector("button");
    expect(button?.getAttribute("aria-expanded")).toBe("false");
    expect(
      document
        .querySelector<HTMLElement>(".bx--color-input__swatch-face")
        ?.style.backgroundColor.replaceAll(" ", ""),
    ).toBe("rgb(218,30,40)");
    expect(document.querySelector('[role="slider"]')).toBeNull();
  });

  it("renders the picker when open", () => {
    const { document } = renderSSR(ColorInput, { open: true });

    expect(
      document.querySelector('[aria-roledescription="2D slider"]'),
    ).not.toBeNull();
  });
});
