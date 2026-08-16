import { cleanup, render } from "@testing-library/svelte";
import { bench, run } from "mitata";
import ProgressIndicatorBench from "./fixtures/ProgressIndicatorBench.svelte";

// Each ProgressStep calls add() during init. That used to call
// `steps.update` per step, then a `$:` block did a second `steps.update`
// to recompute `current` flags. Range capped at 100. A mount at 100 steps
// is already ~2s, and mitata's calibration at 500 would run for minutes.
it("benchmarks mounting ProgressIndicator with various step counts", async () => {
  bench("mount ProgressIndicator, $size steps", function* (state) {
    const size = state.get("size");
    yield () => {
      render(ProgressIndicatorBench, { props: { count: size } });
      cleanup();
    };
  }).range("size", 10, 100);

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 180_000);
