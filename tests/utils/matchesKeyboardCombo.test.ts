function keydown(
  key: string,
  modifiers: Partial<
    Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey">
  > = {},
) {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...modifiers,
  } as KeyboardEvent;
}

async function loadMatcher(userAgent: string) {
  vi.stubGlobal("navigator", { userAgent });
  vi.resetModules();
  const mod = await import("../../src/utils/matchesKeyboardCombo.js");
  return mod.matchesKeyboardCombo;
}

describe("matchesKeyboardCombo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  test("matches meta+k", async () => {
    const matchesKeyboardCombo = await loadMatcher(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    );
    expect(
      matchesKeyboardCombo(keydown("k", { metaKey: true }), "meta+k"),
    ).toBe(true);
    expect(matchesKeyboardCombo(keydown("k"), "meta+k")).toBe(false);
  });

  test("matches ctrl+shift+p", async () => {
    const matchesKeyboardCombo = await loadMatcher(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    );
    expect(
      matchesKeyboardCombo(
        keydown("p", { ctrlKey: true, shiftKey: true }),
        "ctrl+shift+p",
      ),
    ).toBe(true);
  });

  test("is case-insensitive for keys", async () => {
    const matchesKeyboardCombo = await loadMatcher(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    );
    expect(
      matchesKeyboardCombo(keydown("N", { metaKey: true }), "meta+n"),
    ).toBe(true);
  });

  test("matches comma key", async () => {
    const matchesKeyboardCombo = await loadMatcher(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    );
    expect(
      matchesKeyboardCombo(keydown(",", { metaKey: true }), "meta+,"),
    ).toBe(true);
  });

  describe("mod (cross-platform)", () => {
    test("mod+k matches meta+k on macOS", async () => {
      const matchesKeyboardCombo = await loadMatcher(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      );
      expect(
        matchesKeyboardCombo(keydown("k", { metaKey: true }), "mod+k"),
      ).toBe(true);
      expect(
        matchesKeyboardCombo(keydown("k", { ctrlKey: true }), "mod+k"),
      ).toBe(false);
    });

    test("mod+k matches ctrl+k on Windows", async () => {
      const matchesKeyboardCombo = await loadMatcher(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      );
      expect(
        matchesKeyboardCombo(keydown("k", { ctrlKey: true }), "mod+k"),
      ).toBe(true);
      expect(
        matchesKeyboardCombo(keydown("k", { metaKey: true }), "mod+k"),
      ).toBe(false);
    });

    test("mod+shift+p respects shift on macOS", async () => {
      const matchesKeyboardCombo = await loadMatcher(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      );
      expect(
        matchesKeyboardCombo(
          keydown("p", { metaKey: true, shiftKey: true }),
          "mod+shift+p",
        ),
      ).toBe(true);
      expect(
        matchesKeyboardCombo(
          keydown("p", { ctrlKey: true, shiftKey: true }),
          "mod+shift+p",
        ),
      ).toBe(false);
    });

    test("commandorcontrol alias works on Windows", async () => {
      const matchesKeyboardCombo = await loadMatcher(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      );
      expect(
        matchesKeyboardCombo(
          keydown("s", { ctrlKey: true }),
          "commandorcontrol+s",
        ),
      ).toBe(true);
    });

    test("cmdorctrl alias works on macOS", async () => {
      const matchesKeyboardCombo = await loadMatcher(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      );
      expect(
        matchesKeyboardCombo(keydown("s", { metaKey: true }), "cmdorctrl+s"),
      ).toBe(true);
    });
  });
});
