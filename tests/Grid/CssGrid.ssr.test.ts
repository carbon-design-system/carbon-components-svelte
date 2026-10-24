// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import CssGrid from "./CssGrid.ssr.test.svelte";

describe("CssGrid server render", () => {
  it("renders the subgrid and column classes without JavaScript", () => {
    const { document } = renderSSR(CssGrid);
    const classes = [...document.querySelectorAll("div")].map(
      (div) => div.className,
    );

    expect(classes).toEqual([
      "bx--css-grid bx--css-grid--narrow",
      "bx--css-grid-column bx--sm:col-span-4 bx--md:col-start-3 bx--md:col-span-4 bx--lg:col-span-50",
      "bx--subgrid bx--subgrid--condensed",
      "bx--css-grid-column bx--col-span-2",
    ]);
  });
});
