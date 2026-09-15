import { render, screen } from "@testing-library/svelte";
import TileFullHeight from "./Tile.fullHeight.test.svelte";

describe("Tile fullHeight", () => {
  it("should apply the full height class to Tile", () => {
    render(TileFullHeight);

    expect(screen.getByTestId("tile")).toHaveClass("bx--tile--full-height");
  });

  it("should apply the full height class to the RadioTile label", () => {
    render(TileFullHeight);

    expect(
      screen.getByText("Full height radio tile").closest("label"),
    ).toHaveClass("bx--tile--full-height");
  });
});
