// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TileGrid from "./TileGrid.test.svelte";

describe("TileGrid server render", () => {
  it("renders the tiles with the first one as the tab stop", () => {
    const { document } = renderSSR(TileGrid);
    const tiles = [...document.querySelectorAll(".bx--tile-grid__tile")];
    expect(tiles.map((tile) => tile.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
    ]);
    expect(document.querySelector(".bx--tile-grid__item")?.className).toContain(
      "bx--aspect-ratio--1x1",
    );
  });
});
