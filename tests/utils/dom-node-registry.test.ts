import { get } from "svelte/store";
import { createDomNodeRegistry } from "../../src/utils/dom-node-registry.js";

function node() {
  return document.createElement("div");
}

describe("createDomNodeRegistry", () => {
  it("removes a node on unregister", async () => {
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
});

describe("createDomNodeRegistry flush", () => {
  it("exposes pending registrations without waiting a microtask", () => {
    const registry = createDomNodeRegistry();
    const a = node();
    registry.register(a);
    expect(get(registry.items)).toEqual([]);

    registry.flush();
    expect(get(registry.items)).toEqual([a]);
  });
});
