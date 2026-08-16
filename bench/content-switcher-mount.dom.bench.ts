import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import { tick } from "svelte";
import ContentSwitcherBench from "./fixtures/ContentSwitcherBench.svelte";

// ContentSwitcher.add() used to reassign the shared `switches` array on
// every child's script body: `switches = [...switches, {...}]`, preceded by
// an O(n) `switches.some(id match)` dedupe, retriggering `$: iconOnly =
// switches.every(...)` each time. N children registering one at a time
// made mount O(n²). Registration now goes through `batchStoreUpdates` so
// those N copies flush once, matching Tabs / OverflowMenu / ProgressIndicator.
// Time through `tick()` so the measurement includes that microtask flush.
it("benchmarks mounting ContentSwitcher with various switch counts", async () => {
  bench("mount ContentSwitcher, $size switches", function* (state) {
    const size = state.get("size");
    yield async () => {
      render(ContentSwitcherBench, { props: { count: size } });
      await tick();
      cleanup();
    };
  }).range("size", 10, 1000);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
