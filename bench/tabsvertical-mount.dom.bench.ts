import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import TabsVerticalBench from "./fixtures/TabsVerticalBench.svelte";

// TabsVertical.add() used the same unbatched `tabs.update` plus
// `derived(tabs, keyBy)` fanout as Tabs. Range capped at 100. An O(n^2)
// closure makes mitata's calibration take minutes at wider ranges.
group("mount TabsVertical", () => {
  for (const size of range(10, 100)) {
    task(`${size} tabs`, () => {
      render(TabsVerticalBench, { props: { count: size } });
      cleanup();
    });
  }
});
