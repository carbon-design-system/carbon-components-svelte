// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// addPooledListener backs the `dismiss` action (outside-click/escape) and
// FloatingPortal's scroll/resize reposition: every consumer shares one real
// `window.addEventListener` per (type, options) instead of adding its own.
// Two things matter at scale: registering/unregistering N consumers for the
// same event (N components mounting/unmounting together, e.g. N open
// Tooltips/Popovers on one page), and the shared listener's per-dispatch
// fanout over N consumers (every real scroll/resize event, not just mount).
// window-listener-pool.js calls `window.addEventListener`/`removeEventListener`
// directly (SSR-unsafe by design) — stubbed here so the pool's own
// bookkeeping is exercised without jsdom, and so the dispatch group can
// invoke the captured listener directly instead of firing real DOM events.
import { group, range, task } from "ostia";

// Keyed by type: every size's setup below runs up front (see the dispatch
// group's comment), so a single shared variable would end up holding only
// the last size's listener by the time any task actually runs.
const capturedListeners = new Map<string, (event: Event) => void>();
(globalThis as unknown as { window: unknown }).window = {
  addEventListener(type: string, listener: (event: Event) => void) {
    capturedListeners.set(type, listener);
  },
  removeEventListener() {},
};

const { addPooledListener } = await import(
  "../src/utils/window-listener-pool.js"
);

const FAKE_EVENT = {} as Event;

group("N consumers registering + unregistering for one window event", () => {
  for (const size of range(10, 1000)) {
    task(`${size} consumers`, () => {
      const unregisters: Array<() => void> = [];
      for (let i = 0; i < size; i++) {
        unregisters.push(addPooledListener("scroll", () => {}));
      }
      for (const unregister of unregisters) unregister();
    });
  }
});

// { gc: true }: the listener's defensive `[...consumers]` copy allocates a
// fresh array on every one of the 200 dispatches per call — see
// CONTRIBUTING.md on why allocation-heavy cases need this to avoid a
// mis-calibrated batch size inflating the numbers 20-60x.
group(
  "dispatch to N consumers, 200 events",
  () => {
    for (const size of range(10, 1000)) {
      // Distinct event type per size: every group()/task() call (and the
      // setup code ahead of it) runs up front when the file loads, so
      // reusing "scroll" across sizes would pile every size's consumers
      // into the same pool before any task actually measures dispatch.
      const type = `scroll-${size}`;
      const unregisters: Array<() => void> = [];
      for (let i = 0; i < size; i++) {
        unregisters.push(addPooledListener(type, () => {}));
      }
      const listener = capturedListeners.get(type);
      task(
        `${size} consumers`,
        () => {
          for (let i = 0; i < 200; i++) listener?.(FAKE_EVENT);
        },
        {
          after: () => {
            for (const unregister of unregisters) unregister();
          },
        },
      );
    }
  },
  { gc: true },
);
