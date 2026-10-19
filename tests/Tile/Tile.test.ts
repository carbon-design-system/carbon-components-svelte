import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TileRef from "./Tile.ref.test.svelte";
import Tile from "./Tile.test.svelte";

describe("Tile", () => {
  it("should handle click events", async () => {
    const onClick = vi.fn();
    render(Tile, { props: { onClick } });

    const tile = screen.getByTestId("click-test");
    await user.click(tile);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should pass through additional attributes", () => {
    render(Tile);

    const tile = screen.getByTestId("attr-test");
    expect(tile).toHaveAttribute("title", "Custom title");
    expect(tile).toHaveClass("custom-class");
  });

  it("should expose a reference to the tile element", () => {
    const { component } = render(TileRef);

    expect(component.ref).toBeInstanceOf(HTMLDivElement);
    expect(component.ref).toHaveTextContent("Usage summary");
  });
});
