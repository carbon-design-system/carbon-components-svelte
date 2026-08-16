import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import OverflowMenuBench from "./fixtures/OverflowMenuBench.svelte";

// OverflowMenu.add() (called synchronously from each OverflowMenuItem's own
// script, once per item) does `items.update((_) => [..., {...}])` — the
// same O(n) array-copy registration shape as ContentSwitcher.add() and
// Tabs.add(). `itemsById = derived(items, keyBy)` re-derives on every one of
// those N synchronous updates, and every already-mounted OverflowMenuItem's
// own `$: item = $itemsById[id]` (OverflowMenuItem.svelte) re-fires each
// time too — the same store-subscriber-fanout shape that made Tabs severe
// despite `keyBy` itself being cheap (see
// .context/perf/tabs-registration-followup.md). This checks whether
// OverflowMenu shows the same severity.
//
// Unlike MultiSelect (which mounts every item up front behind
// display:none), OverflowMenu gates its item slot behind `{#if open}` — closed-menu items never register at all. The
// fixture renders with `open` already true so registration happens as part
// of the initial render this bench times (see
// bench/fixtures/OverflowMenuBench.svelte).
it("benchmarks mounting an open OverflowMenu with various item counts", async () => {
  // Range capped at 100, not wider: same mitata-calibration-vs-expensive-
  // closure issue as user-avatar-group-mount.dom.bench.ts and
  // tabs-mount.dom.bench.ts — a manual performance.now() spot-check (see
  // .context/perf/overflow-menu-registration-followup.md) already confirms
  // ~O(n^2) growth up to 200 items (10.4s), so a wide mitata range wasn't
  // attempted.
  bench("mount open OverflowMenu, $size items", function* (state) {
    const size = state.get("size");
    yield () => {
      render(OverflowMenuBench, { props: { count: size } });
      cleanup();
    };
  }).range("size", 10, 100);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
