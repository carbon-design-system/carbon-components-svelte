import { BoundedFifoCache } from "../../src/utils/boundedFifoCache.js";

describe("BoundedFifoCache", () => {
  test("stores and retrieves values", () => {
    const cache = new BoundedFifoCache<string, number>(2);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("missing")).toBeUndefined();
  });

  test("evicts the oldest-inserted entry once maxSize is reached", () => {
    const cache = new BoundedFifoCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.size).toBe(2);
  });

  test("a cache hit does not bump recency (FIFO, not LRU)", () => {
    const cache = new BoundedFifoCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);

    // Reading "a" would refresh it in an LRU cache; it should not here.
    expect(cache.get("a")).toBe(1);

    cache.set("c", 3);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  test("re-setting an existing key updates its value without evicting", () => {
    const cache = new BoundedFifoCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);

    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBe(2);
    expect(cache.size).toBe(2);
  });
});
