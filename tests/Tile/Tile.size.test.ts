import { render, screen } from "@testing-library/svelte";
import TileSize from "./Tile.size.test.svelte";

const tileOf = (text: string) => screen.getByText(text).closest(".bx--tile");

describe("Tile size", () => {
  it("applies the small size to Tile and ClickableTile", () => {
    render(TileSize);

    expect(screen.getByTestId("tile")).toHaveClass("bx--tile--sm");
    expect(screen.getByTestId("clickable")).toHaveClass("bx--tile--sm");
  });

  it("takes the size of a parent TileGroup unless the tile sets its own", () => {
    render(TileSize);

    expect(tileOf("Queen")).toHaveClass("bx--tile--sm");
    expect(tileOf("King")).not.toHaveClass("bx--tile--sm");
  });

  it("takes the size of a parent SelectableTileGroup", () => {
    render(TileSize);

    expect(tileOf("Breakfast")).toHaveClass("bx--tile--sm");
    expect(tileOf("Parking")).not.toHaveClass("bx--tile--sm");
  });
});
