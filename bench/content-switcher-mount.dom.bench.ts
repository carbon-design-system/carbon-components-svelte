import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import ContentSwitcherBench from "./fixtures/ContentSwitcherBench.svelte";

// ContentSwitcher.add() reassigns the shared `switches` array on every child's
// onMount: `switches = [...switches, {...}]`, preceded by an O(n)
// `switches.some(id match)` dedupe check, and every reassignment retriggers
// the `$: iconOnly = switches.every(...)` reactive recompute over the whole
// array. N children registering one at a time makes mount itself sum to
// O(n^2) — the same class of registration trap that TreeView's eager-mount
// finding came from. This checks whether it's actually visible at realistic
// sizes (a ContentSwitcher rarely has more than a handful of switches in
// practice, unlike TreeView/DataTable row counts).
it("benchmarks mounting ContentSwitcher with various switch counts", async () => {
  bench("mount ContentSwitcher, $size switches", function* (state) {
    const size = state.get("size");
    yield () => {
      render(ContentSwitcherBench, { props: { count: size } });
      cleanup();
    };
  }).range("size", 10, 1000);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
