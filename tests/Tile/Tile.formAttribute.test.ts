import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import RadioTileFormAttribute from "./RadioTile.formAttribute.test.svelte";
import SelectableTileFormAttribute from "./SelectableTile.formAttribute.test.svelte";
import SelectableTileGroupFormAttribute from "./SelectableTileGroup.formAttribute.test.svelte";
import TileGroupFormAttribute from "./TileGroup.formAttribute.test.svelte";

describe("tile form attribute", () => {
  it.each([
    ["RadioTile", RadioTileFormAttribute, "tier", ["b"]],
    ["SelectableTile", SelectableTileFormAttribute, "tile", ["a"]],
    ["SelectableTileGroup", SelectableTileGroupFormAttribute, "tiles", ["a"]],
    ["TileGroup", TileGroupFormAttribute, "tier", ["b"]],
  ])(
    "associates %s with the form named by `form`",
    (_name, Fixture, field, expected) => {
      render(Fixture);

      expect(new FormData(getForm()).getAll(field)).toEqual(expected);
    },
  );
});
