import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import TabsBench from "./fixtures/TabsBench.svelte";

// Tabs.add() (called once per Tab's onMount) does `tabs.update((_) => [..._,
// {...}])` — the same O(n) array-copy registration shape as
// ContentSwitcher.add() and UserAvatarGroup.register(). tabsById is a
// `derived(tabs, keyBy)` store, so every one of those N synchronous
// reassignments also re-runs an O(n) keyBy pass — O(n^2) total, same class
// as the other two.
//
// Unlike UserAvatarGroup, Tabs does NOT resort the DOM order synchronously
// per registration: `syncDomOrder` (the O(n)-per-call, DOM-position-reading
// step) runs from `afterUpdate` gated on a `needsDomSync` dirty flag, so N
// tabs added in the same flush trigger exactly ONE sync call, not N. That's
// the batching pattern this file's sibling
// (.context/perf/user-avatar-group-registration-followup.md) proposes for
// UserAvatarGroup — this bench checks whether Tabs' cheaper remaining
// per-registration cost (array copy + keyBy) is still visible at realistic
// tab counts, now that the expensive DOM-sort part is already batched away.
it("benchmarks mounting Tabs with various tab counts", async () => {
  // Range capped at 100, not 500: a single mount at 500 tabs takes ~53s
  // wall-clock (manual performance.now() spot-check — see
  // .context/perf/tabs-registration-followup.md), and mitata's calibration
  // wants many samples per point regardless of per-call cost. A 10..500
  // attempt didn't finish after 3+ minutes and had to be killed, same
  // lesson as user-avatar-group-mount.dom.bench.ts.
  bench("mount Tabs, $size tabs", function* (state) {
    const size = state.get("size");
    yield () => {
      render(TabsBench, { props: { count: size } });
      cleanup();
    };
  }).range("size", 10, 100);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
