// @vitest-environment node
import { safeBrowserStorage } from "../../src/utils/storage.js";

describe("safeBrowserStorage (no window)", () => {
  it("getItem and setItem do not throw when window is undefined", () => {
    expect(typeof window).toBe("undefined");

    const storage = safeBrowserStorage("localStorage");
    expect(() => storage.getItem("k")).not.toThrow();
    expect(storage.getItem("k")).toBe(null);
    expect(() => storage.setItem("k", "v")).not.toThrow();
    expect(storage.setItem("k", "v")).toBe(false);
  });
});
