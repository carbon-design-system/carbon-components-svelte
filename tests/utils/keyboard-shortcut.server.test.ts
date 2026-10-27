// @vitest-environment node
import {
  formatShortcut,
  isApplePlatform,
} from "../../src/utils/keyboard-shortcut.js";

describe("keyboard shortcuts on the server", () => {
  it("ignores the navigator that Node and Bun define", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel", userAgent: "Node.js" });

    expect(navigator.platform).toBe("MacIntel");
    expect(isApplePlatform()).toBe(false);
    expect(formatShortcut("mod+k")).toEqual(["Ctrl", "K"]);

    vi.unstubAllGlobals();
  });
});
