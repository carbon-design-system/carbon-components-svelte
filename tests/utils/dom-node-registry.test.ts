import { get } from "svelte/store";
import { createDomNodeRegistry } from "../../src/utils/dom-node-registry.js";

function node() {
  return document.createElement("div");
}

describe("createDomNodeRegistry", () => {
  test("starts empty", () => {
    const registry = createDomNodeRegistry();
    expect(get(registry.items)).toEqual([]);
  });

  test("adds a node on register", async () => {
    const registry = createDomNodeRegistry();
    const a = node();
    registry.register(a);
    await Promise.resolve();
    expect(get(registry.items)).toEqual([a]);
  });

  test("removes a node on unregister", async () => {
    const registry = createDomNodeRegistry();
    const a = node();
    const b = node();
    registry.register(a);
    registry.register(b);
    await Promise.resolve();
    registry.unregister(a);
    await Promise.resolve();
    expect(get(registry.items)).toEqual([b]);
  });

  test("batches synchronous registrations into a single flush", async () => {
    const registry = createDomNodeRegistry();
    const seen = [];
    registry.items.subscribe((items) => seen.push(items.length));

    const a = node();
    const b = node();
    const c = node();
    registry.register(a);
    registry.register(b);
    registry.register(c);

    // Only the initial subscribe notification before the flush.
    expect(seen).toEqual([0]);

    await Promise.resolve();
    expect(seen).toEqual([0, 3]);
    expect(get(registry.items)).toEqual([a, b, c]);
  });
});
