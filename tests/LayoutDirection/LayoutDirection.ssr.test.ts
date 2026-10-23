// @vitest-environment node
import { resolveLayoutDirection } from "carbon-components-svelte/utils/layout-direction.js";
import { renderSSR } from "../utils/ssr";
import LayoutDirectionSlider from "./LayoutDirectionSlider.ssr.test.svelte";

describe("LayoutDirection server render", () => {
  it("renders dir and mirrors the sliders inside it", () => {
    const { document } = renderSSR(LayoutDirectionSlider, { dir: "rtl" });
    expect(document.querySelector("section")?.getAttribute("dir")).toBe("rtl");
    expect(
      document.querySelector(".bx--slider__thumb")?.getAttribute("style"),
    ).toContain("left: 80%");
    expect(
      document
        .querySelector(".bx--slider__thumb-wrapper--lower")
        ?.getAttribute("style"),
    ).toContain("left: 80%");
  });

  it("leaves the sliders outside one unchanged", () => {
    const { document } = renderSSR(LayoutDirectionSlider, { dir: undefined });
    expect(document.querySelector("[dir]")).toBeNull();
    expect(
      document.querySelector(".bx--slider__thumb")?.getAttribute("style"),
    ).toContain("left: 20%");
    expect(
      document
        .querySelector(".bx--slider__thumb-wrapper--lower")
        ?.getAttribute("style"),
    ).toContain("left: 20%");
  });

  it("resolves to the context, else ltr, without a document", () => {
    expect(resolveLayoutDirection("rtl")).toBe("rtl");
    expect(resolveLayoutDirection(undefined)).toBe("ltr");
  });
});
