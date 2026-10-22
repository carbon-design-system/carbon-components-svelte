// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ExpandableTile from "./ExpandableTile.ssr.test.svelte";

describe("ExpandableTile server render", () => {
  it("renders the tile button until it can look for interactive content", () => {
    const { document } = renderSSR(ExpandableTile);

    const tile = document.querySelector(".bx--tile--expandable");
    expect(tile?.tagName).toBe("BUTTON");
    expect(tile?.getAttribute("aria-controls")).toBe("plan-content");
  });

  it("renders the div and chevron button when `hasInteractiveContent` is `true`", () => {
    const { document } = renderSSR(ExpandableTile, {
      hasInteractiveContent: true,
    });

    const tile = document.querySelector(".bx--tile--expandable");
    expect(tile?.tagName).toBe("DIV");
    expect(
      tile
        ?.querySelector("button.bx--tile__chevron")
        ?.getAttribute("aria-controls"),
    ).toBe("plan-content");
  });
});
