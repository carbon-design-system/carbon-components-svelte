import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import ContextMenuRadioGroupBench from "./fixtures/ContextMenuRadioGroupBench.svelte";

// addOption() appends to `radioIds` with an `.includes()` dedup. Nothing
// derived from that store fans out to siblings, so this should stay closer
// to ContentSwitcher than to the O(n^2) group components. The bench is
// here to measure that, not infer it from the source.
it("benchmarks mounting ContextMenuRadioGroup with various option counts", async () => {
  bench("mount ContextMenuRadioGroup, $size options", function* (state) {
    const size = state.get("size");
    yield () => {
      render(ContextMenuRadioGroupBench, { props: { count: size } });
      cleanup();
    };
  }).range("size", 10, 1000);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
