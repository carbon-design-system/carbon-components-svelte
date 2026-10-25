// @vitest-environment node
import { resolveLayoutDirection } from "carbon-components-svelte/utils/layout-direction.js";
import { trackPosition } from "../utils/slider-track";
import { renderSSR } from "../utils/ssr";
import LayoutDirectionSlider from "./LayoutDirectionSlider.ssr.test.svelte";

/** The Slider thumb and the RangeSlider's lower handle. */
function positions(document: Document) {
  return [".bx--slider__thumb", ".bx--slider__thumb-wrapper--lower"].map(
    (selector) => {
      const el = document.querySelector<HTMLElement>(selector);
      assert(el);
      return trackPosition(el);
    },
  );
}

describe("LayoutDirection server render", () => {
  it("renders dir and mirrors the sliders inside it", () => {
    const { document } = renderSSR(LayoutDirectionSlider, { dir: "rtl" });
    expect(document.querySelector("section")?.getAttribute("dir")).toBe("rtl");
    expect(positions(document)).toEqual(["80%", "80%"]);
  });

  it("leaves the sliders outside one unchanged", () => {
    const { document } = renderSSR(LayoutDirectionSlider, { dir: undefined });
    expect(document.querySelector("[dir]")).toBeNull();
    expect(positions(document)).toEqual(["20%", "20%"]);
  });

  it("resolves to the context, else ltr, without a document", () => {
    expect(resolveLayoutDirection("rtl")).toBe("rtl");
    expect(resolveLayoutDirection(undefined)).toBe("ltr");
  });
});
