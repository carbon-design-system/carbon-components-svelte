import { render } from "@testing-library/svelte";
import { task } from "ostia";
import { tick } from "svelte";
import SelectableTileGroupBench from "./fixtures/SelectableTileGroupBench.svelte";

// Every tile subscribes to the group's whole `selectedValues` array, so one
// toggle notifies every tile. Both instances persist for the file's run;
// each case clicks the first tile in its own container, so every sample
// flips that tile on or off.
for (const size of [100, 1000]) {
  const container = document.body.appendChild(document.createElement("div"));
  render(SelectableTileGroupBench, {
    props: { count: size },
    target: container,
  });
  const input = container.querySelector("input");
  if (!input) throw new Error("no tile input");

  task(`toggle tile, SelectableTileGroup ${size} tiles`, async () => {
    input.click();
    await tick();
  });
}
