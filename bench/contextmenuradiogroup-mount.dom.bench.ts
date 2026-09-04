import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import ContextMenuRadioGroupBench from "./fixtures/ContextMenuRadioGroupBench.svelte";

// addOption() appends to `radioIds` with an `.includes()` dedup. Nothing
// derived from that store fans out to siblings, so this should stay closer
// to ContentSwitcher than to the O(n^2) group components. The bench is
// here to measure that, not infer it from the source.
group("mount ContextMenuRadioGroup", () => {
  for (const size of range(10, 1000)) {
    task(`${size} options`, () => {
      render(ContextMenuRadioGroupBench, { props: { count: size } });
      cleanup();
    });
  }
});
