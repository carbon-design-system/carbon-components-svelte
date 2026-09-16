// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// subscribeRelativeTimeTick backs every `RelativeTime` instance: one shared
// `setInterval` per refresh cadence, not one per instance. Two things matter
// at scale: subscribing/unsubscribing N instances on the same cadence (a
// table with N timestamp cells mounting/unmounting together), and the
// shared interval's per-tick fanout over N consumers (every real tick, not
// just mount — a long-lived page keeps ticking for as long as it's open).
// `setInterval`/`clearInterval` are stubbed to capture the tick callback and
// invoke it directly, so the dispatch group measures fanout cost without
// waiting on real elapsed time.
import { group, range, task } from "ostia";

// Keyed by refreshMs: every size's setup below runs up front (see the
// dispatch group's comment), so a single shared variable would end up
// holding only the last size's tick callback by the time any task runs.
const capturedTicks = new Map<number, () => void>();
let nextIntervalId = 0;
(globalThis as unknown as { setInterval: unknown }).setInterval = (
  fn: () => void,
  refreshMs: number,
) => {
  capturedTicks.set(refreshMs, fn);
  return ++nextIntervalId;
};
(globalThis as unknown as { clearInterval: unknown }).clearInterval = () => {};

const { subscribeRelativeTimeTick } = await import(
  "../src/utils/relative-time-timer-pool.js"
);

group(
  "N instances subscribing + unsubscribing on one cadence",
  () => {
    for (const size of range(10, 1000)) {
      task(`${size} instances`, () => {
        const unsubscribes: Array<() => void> = [];
        for (let i = 0; i < size; i++) {
          unsubscribes.push(subscribeRelativeTimeTick(60_000, () => {}));
        }
        for (const unsubscribe of unsubscribes) unsubscribe();
      });
    }
  },
  { gc: true },
);

group("tick dispatch to N instances, 200 ticks", () => {
  for (const size of range(10, 1000)) {
    // Distinct cadence per size so each iteration gets its own bucket
    // (and its own captured tick callback) instead of piling onto a
    // shared one from a previous size in this loop.
    const refreshMs = 60_000 + size;
    const unsubscribes: Array<() => void> = [];
    for (let i = 0; i < size; i++) {
      unsubscribes.push(subscribeRelativeTimeTick(refreshMs, () => {}));
    }
    const tick = capturedTicks.get(refreshMs);
    task(
      `${size} instances`,
      () => {
        for (let i = 0; i < 200; i++) tick?.();
      },
      {
        after: () => {
          for (const unsubscribe of unsubscribes) unsubscribe();
        },
      },
    );
  }
});
