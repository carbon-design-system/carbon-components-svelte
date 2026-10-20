import { render } from "@testing-library/svelte";
import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
import Tile from "carbon-components-svelte/Tile/Tile.svelte";

const tile = ["Tile", Tile, {}] as const;
const clickable = [
  "ClickableTile",
  ClickableTile,
  { href: "/details" },
] as const;
const selectable = ["SelectableTile", SelectableTile, {}] as const;
const radio = ["RadioTile", RadioTile, { value: "a", name: "tiles" }] as const;
const expandable = ["ExpandableTile", ExpandableTile, {}] as const;
type TileCase =
  | typeof tile
  | typeof clickable
  | typeof selectable
  | typeof radio
  | typeof expandable;

describe.each([
  ["fullHeight", "bx--tile--full-height", [tile, radio]],
  // SelectableTile and RadioTile have no `noPadding`.
  ["noPadding", "bx--tile--no-padding", [tile, clickable]],
] as const)("%s", (prop, className, tiles) => {
  it.each(tiles as readonly TileCase[])(
    "applies the class to %s",
    (_name, Component, props) => {
      const { container } = render(Component as typeof Tile, {
        props: { ...props, [prop]: true },
      });

      expect(container.querySelector(".bx--tile")).toHaveClass(className);
    },
  );
});
