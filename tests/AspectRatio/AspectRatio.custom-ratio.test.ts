import { render, screen } from "@testing-library/svelte";
import AspectRatioCustom from "./AspectRatio.custom-ratio.test.svelte";

const NAMED_RATIO_CLASSES = [
  "2x1",
  "2x3",
  "16x9",
  "4x3",
  "1x1",
  "3x4",
  "3x2",
  "9x16",
  "1x2",
].map((ratio) => `bx--aspect-ratio--${ratio}`);

describe("AspectRatio custom ratio", () => {
  it("applies the custom marker class and CSS variable for an unlisted WxH ratio", () => {
    render(AspectRatioCustom);

    const el = screen.getByTestId("custom-ratio");
    expect(el).toHaveClass("bx--aspect-ratio--custom");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("42.857%");
    for (const className of NAMED_RATIO_CLASSES) {
      expect(el).not.toHaveClass(className);
    }
  });

  it("accepts decimals in a custom ratio", () => {
    render(AspectRatioCustom);

    const el = screen.getByTestId("custom-decimal");
    expect(el).toHaveClass("bx--aspect-ratio--custom");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("42.553%");
  });

  it("falls back to the default 2x1 class when width or height is zero", () => {
    render(AspectRatioCustom);

    const el = screen.getByTestId("invalid-zero");
    expect(el).toHaveClass("bx--aspect-ratio--2x1");
    expect(el).not.toHaveClass("bx--aspect-ratio--custom");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("");
  });

  it("falls back to the default 2x1 class for a non-numeric ratio", () => {
    render(AspectRatioCustom);

    const el = screen.getByTestId("invalid-word");
    expect(el).toHaveClass("bx--aspect-ratio--2x1");
    expect(el).not.toHaveClass("bx--aspect-ratio--custom");
  });

  it("falls back to the default 2x1 class for a colon-separated ratio", () => {
    render(AspectRatioCustom);

    const el = screen.getByTestId("invalid-colon");
    expect(el).toHaveClass("bx--aspect-ratio--2x1");
    expect(el).not.toHaveClass("bx--aspect-ratio--custom");
  });

  it("keeps a named ratio unchanged", () => {
    render(AspectRatioCustom);

    const el = screen.getByTestId("named-ratio");
    expect(el).toHaveClass("bx--aspect-ratio--2x1");
    expect(el).not.toHaveClass("bx--aspect-ratio--custom");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("");
  });
});
