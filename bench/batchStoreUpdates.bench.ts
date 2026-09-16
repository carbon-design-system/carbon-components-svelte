// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// batchStoreUpdates backs Tabs/TabsVertical/ContentSwitcher/OverflowMenu/Menu/
// UserAvatarGroup/TagSet/ProgressIndicator child registration: every child
// calls the batched update once, synchronously, from its own mount pass.
// Without batching, N children registering in the same tick means N
// store.update() calls, each re-notifying every subscriber — and a
// subscriber that re-derives something over the whole list (registered
// order, roving-focus index, ...) turns that into O(n^2) for the mount.
// This is the exact shape the registration-fanout fixes targeted, so the
// bench compares batched vs. unbatched directly instead of trusting the
// module's O(n) shape on paper.
import { group, range, task } from "ostia";
import { batchStoreUpdates } from "../src/utils/batch-store-updates.js";

// Minimal stand-in for a Svelte `Writable`: just enough surface
// (`update`) for batchStoreUpdates to wrap, plus a subscriber-cost hook
// that re-derives something over the full list on every notify — the
// part of a real store that makes unbatched notification count matter.
function createStore(subscriberCost: (value: number[]) => void) {
  let value: number[] = [];
  return {
    update(fn: (value: number[]) => number[]) {
      value = fn(value);
      subscriberCost(value);
    },
  };
}

function registeredOrderIndex(value: number[]) {
  const index = new Map<number, number>();
  value.forEach((id, i) => {
    index.set(id, i);
  });
  return index;
}

group(
  "N children registering in one tick, unbatched (direct store.update per child)",
  () => {
    for (const size of range(10, 1000)) {
      task(`${size} children`, () => {
        const store = createStore(registeredOrderIndex);
        for (let i = 0; i < size; i++) {
          store.update((list) => [...list, i]);
        }
      });
    }
  },
  { gc: true },
);

group(
  "N children registering in one tick, batched (batchStoreUpdates)",
  () => {
    for (const size of range(10, 1000)) {
      task(`${size} children`, async () => {
        const store = createStore(registeredOrderIndex);
        const batchedUpdate = batchStoreUpdates(store);
        for (let i = 0; i < size; i++) {
          batchedUpdate((list) => [...list, i]);
        }
        // batchStoreUpdates schedules its flush via `Promise.resolve().then`
        // on the first push in this tick; awaiting a fresh already-resolved
        // promise here queues our continuation behind it in the microtask
        // queue, so the flush has run by the time this task resolves.
        await Promise.resolve();
      });
    }
  },
  { gc: true },
);
