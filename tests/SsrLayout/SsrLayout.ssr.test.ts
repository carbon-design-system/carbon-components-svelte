// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SsrLayout from "./SsrLayout.test.svelte";

// Server markup laid out as the browser lays it out once mounted, so the
// page doesn't move on hydration.
describe("layout in the server's markup", () => {
  it("indents TreeView labels by their level", () => {
    const { document } = renderSSR(SsrLayout);
    const labels = [...document.querySelectorAll(".bx--tree-node__label")];

    expect(labels.map((label) => label.getAttribute("style"))).toEqual([
      "margin-inline-start: -1rem; padding-inline-start: 1rem;",
      "margin-inline-start: -3.5rem; padding-inline-start: 3.5rem;",
    ]);
  });

  it("marks a collapsed ExpandableTile as not yet measured", () => {
    const { document } = renderSSR(SsrLayout);

    expect(document.querySelector(".bx--tile--expandable")).toHaveClass(
      "bx--tile--unmeasured",
    );
  });

  it("joins an open OverflowMenu to its button at the button's width", () => {
    const { document } = renderSSR(SsrLayout);

    expect(
      document
        .querySelector(".bx--overflow-menu-options")
        ?.getAttribute("style"),
    ).toContain("--overflow-menu-options-after-width: 3rem");
  });
});
