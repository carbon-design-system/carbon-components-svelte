import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import SelectableTileGroupBench from "./fixtures/SelectableTileGroupBench.svelte";

// Every preselected tile syncs through the group's `selectedValues` store,
// which every mounted tile subscribes to. Mount with half the tiles
// preselected so that sync is part of the cost.
group("mount SelectableTileGroup, half selected", () => {
  for (const size of range(10, 1000)) {
    const selected = Array.from(
      { length: Math.floor(size / 2) },
      (_, i) => `tile-${i * 2}`,
    );
    task(`${size} tiles`, () => {
      render(SelectableTileGroupBench, { props: { count: size, selected } });
      cleanup();
    });
  }
});
