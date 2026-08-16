import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import TabsVerticalBench from "./fixtures/TabsVerticalBench.svelte";

// TabsVertical.add() used the same unbatched `tabs.update` plus
// `derived(tabs, keyBy)` fanout as Tabs. Range capped at 100. An O(n^2)
// closure makes mitata's calibration take minutes at wider ranges.
it("benchmarks mounting TabsVertical with various tab counts", async () => {
  bench("mount TabsVertical, $size tabs", function* (state) {
    const size = state.get("size");
    yield () => {
      render(TabsVerticalBench, { props: { count: size } });
      cleanup();
    };
  }).range("size", 10, 100);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
