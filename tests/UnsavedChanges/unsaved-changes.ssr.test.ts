// @vitest-environment node
import { get } from "svelte/store";
import {
  createUnsavedChanges,
  trackUnsavedChanges,
  unsavedChanges,
} from "../../src/UnsavedChanges/index.js";

describe("unsaved changes on the server", () => {
  it("imports and runs without a window", async () => {
    expect(typeof window).toBe("undefined");
    expect(trackUnsavedChanges).toBeTypeOf("function");

    const store = createUnsavedChanges();
    store.set("a", true);
    expect(get(store.dirty)).toBe(true);
    expect(await store.guard(() => true)).toBe(true);
    expect(get(unsavedChanges.dirty)).toBe(false);
  });
});
