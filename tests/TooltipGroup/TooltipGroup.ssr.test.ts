// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TooltipGroupButton from "./TooltipGroupButton.ssr.test.svelte";
import TooltipGroupOpen from "./TooltipGroupOpen.ssr.test.svelte";

describe("tooltip group server render", () => {
  it("an open tooltip in one render does not hide tooltips in the next", () => {
    renderSSR(TooltipGroupOpen);
    const { document } = renderSSR(TooltipGroupButton);

    expect(document.querySelector(".bx--btn")?.classList).not.toContain(
      "bx--tooltip--hidden",
    );
  });
});
