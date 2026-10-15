import { render, screen } from "@testing-library/svelte";
import TileSize from "./Tile.size.test.svelte";

const tileOf = (text: string) => screen.getByText(text).closest(".bx--tile");

test("a tile takes its group's size unless it sets its own", () => {
  render(TileSize);

  expect(tileOf("Queen")).toHaveClass("bx--tile--sm");
  expect(tileOf("King")).not.toHaveClass("bx--tile--sm");
});
