// @vitest-environment node
import ColorPicker from "carbon-components-svelte/ColorPicker/ColorPicker.svelte";
import { renderSSR } from "../utils/ssr";

describe("ColorPicker server render", () => {
  it("places the thumbs from the value, with no script", () => {
    const { document } = renderSSR(ColorPicker, {
      value: "#0f62fe",
      alpha: true,
    });

    const area = document.querySelector<HTMLElement>(
      '[aria-roledescription="2D slider"]',
    );
    expect(area?.getAttribute("aria-valuetext")).toBe(
      "Saturation 94%, brightness 100%, blue",
    );
    expect(Number.parseFloat(area?.style.top ?? "")).toBeCloseTo(0.39, 1);
    expect(
      document
        .querySelector('[aria-label="Hue"]')
        ?.getAttribute("aria-valuenow"),
    ).toBe("219");
    expect(
      document
        .querySelector('[aria-label="Alpha"]')
        ?.getAttribute("aria-valuenow"),
    ).toBe("100");
    expect(
      document
        .querySelector<HTMLInputElement>("input.bx--text-input")
        ?.getAttribute("value"),
    ).toBe("#0f62fe");
  });

  it("renders no eyedropper, which only a browser can detect", () => {
    const { document } = renderSSR(ColorPicker, {});

    expect(
      document.querySelector('[aria-label="Pick a color from the screen"]'),
    ).toBeNull();
  });

  it("renders swatches and the contrast warning", () => {
    const { document } = renderSSR(ColorPicker, {
      value: "#f1c21b",
      background: "#ffffff",
      swatches: ["#da1e28", { value: "#24a148", label: "Green" }],
    });

    expect(
      [...document.querySelectorAll('[role="option"][aria-label]')].map(
        (option) => option.getAttribute("aria-label"),
      ),
    ).toEqual(["red", "Green"]);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "below 4.5:1",
    );
  });
});
