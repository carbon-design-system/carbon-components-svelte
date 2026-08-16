import { writable } from "svelte/store";
import { batchStoreUpdates } from "../../src/utils/batchStoreUpdates.js";

describe("batchStoreUpdates", () => {
  test("collapses synchronous calls into a single store update", async () => {
    const store = writable<number[]>([]);
    let notifications = 0;
    store.subscribe(() => {
      notifications++;
    });
    // The initial subscribe call itself counts as one notification.
    notifications = 0;

    const batchedUpdate = batchStoreUpdates(store);
    batchedUpdate((value) => [...value, 1]);
    batchedUpdate((value) => [...value, 2]);
    batchedUpdate((value) => [...value, 3]);

    expect(notifications).toBe(0);

    await Promise.resolve();
    await Promise.resolve();

    expect(notifications).toBe(1);
    let current: number[] = [];
    store.subscribe((value) => {
      current = value;
    })();
    expect(current).toEqual([1, 2, 3]);
  });

  test("applies queued operations in call order", async () => {
    const store = writable<string[]>(["a"]);
    const batchedUpdate = batchStoreUpdates(store);

    batchedUpdate((value) => [...value, "b"]);
    batchedUpdate((value) => value.filter((item) => item !== "a"));

    await Promise.resolve();
    await Promise.resolve();

    let current: string[] = [];
    store.subscribe((value) => {
      current = value;
    })();
    expect(current).toEqual(["b"]);
  });

  test("a later batch flushes independently of an earlier one", async () => {
    const store = writable<number[]>([]);
    const batchedUpdate = batchStoreUpdates(store);

    batchedUpdate((value) => [...value, 1]);
    await Promise.resolve();
    await Promise.resolve();

    batchedUpdate((value) => [...value, 2]);
    await Promise.resolve();
    await Promise.resolve();

    let current: number[] = [];
    store.subscribe((value) => {
      current = value;
    })();
    expect(current).toEqual([1, 2]);
  });
});
