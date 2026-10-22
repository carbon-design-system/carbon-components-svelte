import { render, screen } from "@testing-library/svelte";
import AspectRatioCustom from "./AspectRatio.custom-ratio.test.svelte";
import AspectRatioRerender from "./AspectRatio.rerender.test.svelte";

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

  it.each([
    ["a zero width or height", "invalid-zero"],
    ["a non-numeric ratio", "invalid-word"],
    ["a colon-separated ratio", "invalid-colon"],
  ])("falls back to the default 2x1 class for %s", (_, testId) => {
    render(AspectRatioCustom);

    const el = screen.getByTestId(testId);
    expect(el).toHaveClass("bx--aspect-ratio--2x1");
    expect(el).not.toHaveClass("bx--aspect-ratio--custom");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("");
  });

  it("swaps between named and custom ratios when `ratio` changes", async () => {
    const { rerender } = render(AspectRatioRerender);

    const el = screen.getByTestId("ratio");
    expect(el).toHaveClass("bx--aspect-ratio--2x1");

    await rerender({ ratio: "21x9" });
    expect(el).toHaveClass("bx--aspect-ratio--custom");
    expect(el).not.toHaveClass("bx--aspect-ratio--2x1");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("42.857%");

    await rerender({ ratio: "16x9" });
    expect(el).toHaveClass("bx--aspect-ratio--16x9");
    expect(el).not.toHaveClass("bx--aspect-ratio--custom");
    expect(el.style.getPropertyValue("--ccs-aspect-ratio")).toBe("");
  });
});
