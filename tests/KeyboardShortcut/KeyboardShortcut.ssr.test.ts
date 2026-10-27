// @vitest-environment node
import KeyboardShortcut from "carbon-components-svelte/KeyboardShortcut/KeyboardShortcut.svelte";
import { renderSSR } from "../utils/ssr";

describe("KeyboardShortcut server render", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the non-Apple keys with spelled-out names", () => {
    const { document } = renderSSR(KeyboardShortcut, {
      shortcut: "mod+shift+p",
    });

    const keys = document.querySelector(".bx--keyboard-shortcut__keys");
    expect(keys).toHaveAttribute("dir", "ltr");
    expect(
      [...document.querySelectorAll(".bx--kbd")].map((kbd) => kbd.textContent),
    ).toEqual(["CtrlControl", "Shift", "P"]);
  });

  it("stays on the non-Apple form when Node reports an Apple navigator", () => {
    // Node 21+ defines `navigator`, so a server that read it would render
    // the developer's platform and then mismatch the client.
    vi.stubGlobal("navigator", { platform: "MacIntel" });

    const { document } = renderSSR(KeyboardShortcut, { shortcut: "mod+k" });

    expect(document.querySelector(".bx--kbd")?.textContent).toContain("Ctrl");
    expect(document.body.textContent).not.toContain("⌘");
  });

  it("renders the Apple form when the server passes `apple`", () => {
    const { document } = renderSSR(KeyboardShortcut, {
      shortcut: "mod+k",
      apple: true,
      decorative: true,
    });

    expect(document.body.textContent).toBe("⌘K");
    expect(document.querySelector("[aria-hidden]")).not.toBeNull();
  });
});
