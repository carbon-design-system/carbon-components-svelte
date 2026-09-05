import { cleanup, render } from "@testing-library/svelte";
import { group, range, task } from "ostia";
import ProgressIndicatorBench from "./fixtures/ProgressIndicatorBench.svelte";

// Each ProgressStep calls add() during init. That used to call
// `steps.update` per step, then a `$:` block did a second `steps.update`
// to recompute `current` flags. Range capped at 100. A mount at 100 steps
// is already ~2s, and mitata's calibration at 500 would run for minutes.
group("mount ProgressIndicator", () => {
  for (const size of range(10, 100)) {
    task(`${size} steps`, () => {
      render(ProgressIndicatorBench, { props: { count: size } });
      cleanup();
    });
  }
});
