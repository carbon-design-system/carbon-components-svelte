import { render } from "@testing-library/svelte";
import TileRounded from "./Tile.rounded.test.svelte";

// Tile, ClickableTile, SelectableTile, RadioTile and ExpandableTile
const TILE_COUNT = 5;

function tiles(container: HTMLElement) {
  return [...container.querySelectorAll(".bx--tile")];
}

describe("rounded", () => {
  it("rounds every tile kind that has a decorator", () => {
    const { container } = render(TileRounded);

    const rendered = tiles(container);
    expect(rendered).toHaveLength(TILE_COUNT);
    for (const tile of rendered) {
      expect(tile).toHaveClass("bx--tile--decorator-rounded");
    }
  });

  it.each([
    ["without `rounded`", { rounded: false, decorated: true }],
    // v11 rounds only a tile with a decorator.
    ["without a decorator", { rounded: true, decorated: false }],
  ])("keeps square corners %s", (_name, props) => {
    const { container } = render(TileRounded, props);

    const rendered = tiles(container);
    expect(rendered).toHaveLength(TILE_COUNT);
    for (const tile of rendered) {
      expect(tile).not.toHaveClass("bx--tile--decorator-rounded");
    }
  });
});
