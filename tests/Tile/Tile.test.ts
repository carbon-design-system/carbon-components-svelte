import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Tile from "./Tile.test.svelte";

describe("Tile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default class", () => {
    render(Tile);

    const tile = screen.getByText("Default tile");
    expect(tile).toHaveClass("bx--tile");
  });

  it("should render light variant", () => {
    render(Tile);

    const lightTile = screen.getByText("Light variant");
    expect(lightTile).toHaveClass("bx--tile", "bx--tile--light");
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Tile);

    const tile = screen.getByTestId("click-test");
    await user.click(tile);
    expect(consoleLog).toHaveBeenCalledWith("clicked");
    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  it("should pass through additional attributes", () => {
    render(Tile);

    const tile = screen.getByTestId("attr-test");
    expect(tile).toHaveAttribute("title", "Custom title");
    expect(tile).toHaveClass("custom-class");
  });
});
