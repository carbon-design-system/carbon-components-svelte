import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import { tick } from "svelte";
import ContentSwitcherBench from "./fixtures/ContentSwitcherBench.svelte";

// ContentSwitcher.add() used to reassign the shared `switches` array on
// every child's script body: `switches = [...switches, {...}]`, preceded by
// an O(n) `switches.some(id match)` dedupe, retriggering `$: iconOnly =
// switches.every(...)` each time. N children registering one at a time
// made mount O(n²). Registration now goes through `batchStoreUpdates` so
// those N copies flush once, matching Tabs / OverflowMenu / ProgressIndicator.
// Time through `tick()` so the measurement includes that microtask flush.
group("mount ContentSwitcher", () => {
  for (const size of range(10, 1000)) {
    task(`${size} switches`, async () => {
      render(ContentSwitcherBench, { props: { count: size } });
      await tick();
      cleanup();
    });
  }
});
