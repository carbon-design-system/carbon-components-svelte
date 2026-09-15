import { render, screen } from "@testing-library/svelte";
import TileNoPadding from "./Tile.noPadding.test.svelte";

describe("Tile noPadding", () => {
  it("should apply the no padding class to Tile", () => {
    render(TileNoPadding);

    expect(screen.getByTestId("tile")).toHaveClass("bx--tile--no-padding");
  });

  it("should apply the no padding class to ClickableTile", () => {
    render(TileNoPadding);

    expect(screen.getByTestId("clickable-tile")).toHaveClass(
      "bx--tile--no-padding",
    );
  });
});
