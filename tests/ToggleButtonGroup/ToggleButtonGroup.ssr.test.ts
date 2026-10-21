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
  it.each([
    [
      "makes the first button the tab stop when nothing is pressed",
      {},
      ["Bold"],
    ],
    [
      "makes the pressed button the tab stop",
      { selected: ["italic"] },
      ["Italic"],
    ],
    [
      "makes the first pressed button the tab stop in multiple mode",
      { selected: ["underline", "italic"] },
      ["Italic"],
    ],
    [
      "uses the first entry in single mode",
      { selectionMode: "single", selected: ["underline", "italic"] },
      ["Underline"],
    ],
    ["skips a disabled first button", { firstDisabled: true }, ["Italic"]],
    [
      "has no tab stop when the whole group is disabled",
      { groupDisabled: true },
      [],
    ],
  ])("%s", (_name, props, expected) => {
    expect(tabStops(props)).toEqual(expected);
  });
});
