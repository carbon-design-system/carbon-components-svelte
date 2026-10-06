// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ToggleButtonGroup from "./ToggleButtonGroupSsr.test.svelte";

function tabStops(props: Record<string, unknown> = {}) {
  const { document } = renderSSR(ToggleButtonGroup, props);

  return [...document.querySelectorAll("button")]
    .filter((button) => button.getAttribute("tabindex") === "0")
    .map((button) => button.textContent?.trim());
}

describe("ToggleButtonGroup server render", () => {
  it("makes the first button the tab stop when nothing is pressed", () => {
    expect(tabStops()).toEqual(["Bold"]);
  });

  it("makes the pressed button the tab stop", () => {
    expect(tabStops({ selected: ["italic"] })).toEqual(["Italic"]);
  });

  it("makes the first pressed button the tab stop in multiple mode", () => {
    expect(tabStops({ selected: ["underline", "italic"] })).toEqual(["Italic"]);
  });

  it("uses the first entry in single mode", () => {
    expect(
      tabStops({ selectionMode: "single", selected: ["underline", "italic"] }),
    ).toEqual(["Underline"]);
  });

  it("skips a disabled first button", () => {
    expect(tabStops({ firstDisabled: true })).toEqual(["Italic"]);
  });

  it("has no tab stop when the whole group is disabled", () => {
    expect(tabStops({ groupDisabled: true })).toEqual([]);
  });
});
