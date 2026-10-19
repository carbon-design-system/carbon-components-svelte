import { render, screen } from "@testing-library/svelte";
import TileGroupSize from "./Tile.groupSize.test.svelte";
import TileSize from "./Tile.size.test.svelte";

const tileOf = (text: string) => screen.getByText(text).closest(".bx--tile");

test("a tile takes its group's size unless it sets its own", () => {
  render(TileSize);

  expect(tileOf("Queen")).toHaveClass("bx--tile--sm");
  expect(tileOf("King")).not.toHaveClass("bx--tile--sm");
});

test("a selectable tile takes its group's size unless it sets its own", () => {
  render(TileGroupSize, { props: { size: "sm" } });

  expect(tileOf("Selectable inherits")).toHaveClass("bx--tile--sm");
  expect(tileOf("Selectable own")).not.toHaveClass("bx--tile--sm");
});

test.each(["Selectable", "Radio"])(
  "%s tiles follow the group's size after mount",
  async (kind) => {
    const { rerender } = render(TileGroupSize);
    expect(tileOf(`${kind} inherits`)).not.toHaveClass("bx--tile--sm");

    await rerender({ size: "sm" });
    expect(tileOf(`${kind} inherits`)).toHaveClass("bx--tile--sm");
    expect(tileOf(`${kind} own`)).not.toHaveClass("bx--tile--sm");

    await rerender({ size: undefined });
    expect(tileOf(`${kind} inherits`)).not.toHaveClass("bx--tile--sm");
  },
);
