// @vitest-environment node
import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
import { renderSSR } from "../utils/ssr";

describe("TooltipIcon server render", () => {
  // The "one open tooltip at a time" store is module state, which the
  // server shares across requests. A render must not leave it claimed.
  it("shows an open tooltip after an earlier render opened one", () => {
    const props = { id: "tip", tooltipText: "Help", open: true };
    renderSSR(TooltipIcon, props);
    const { document } = renderSSR(TooltipIcon, props);

    const trigger = document.querySelector("button");
    expect(trigger).toHaveClass("bx--tooltip--visible");
    expect(trigger).not.toHaveClass("bx--tooltip--hidden");
  });
});
