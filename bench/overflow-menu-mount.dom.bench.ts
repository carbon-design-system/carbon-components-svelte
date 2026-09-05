import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
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
//
// Range capped at 100, not wider: same calibration-vs-expensive-closure
// issue as user-avatar-group-mount.dom.bench.ts and tabs-mount.dom.bench.ts
// — a manual performance.now() spot-check (see
// .context/perf/overflow-menu-registration-followup.md) already confirms
// ~O(n^2) growth up to 200 items (10.4s), so a wide range wasn't attempted.
group("mount open OverflowMenu", () => {
  for (const size of range(10, 100)) {
    task(`${size} items`, () => {
      render(OverflowMenuBench, { props: { count: size } });
      cleanup();
    });
  }
});
