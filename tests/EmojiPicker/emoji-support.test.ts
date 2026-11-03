// @vitest-environment node
import {
  detectEmojiSupport,
  emojiProbes,
  filterSupported,
  isFlagGlyph,
  newestDrawnVersion,
} from "carbon-components-svelte/EmojiPicker/emoji-support.js";

const item = (emoji: string, version: number) => ({ emoji, version });

const items = [
  item("a", 0.6),
  item("b", 0.6),
  item("c", 1),
  item("d\u{200D}e\u{200D}f", 12),
  item("g", 12),
  item("h", 15),
];

describe("emojiProbes", () => {
  it("takes the longest and the last emoji of each version, oldest first", () => {
    expect(emojiProbes([items[5], ...items.slice(0, 5)])).toEqual([
      { version: 0.6, glyphs: ["a", "b"] },
      { version: 1, glyphs: ["c"] },
      { version: 12, glyphs: ["d\u{200D}e\u{200D}f", "g"] },
      { version: 15, glyphs: ["h"] },
    ]);
  });
});

describe("newestDrawnVersion", () => {
  const probes = emojiProbes(items);

  it("stops at the first version with a glyph that does not draw", () => {
    // A font that has the new emoji but cannot join the sequence of 12.
    expect(
      newestDrawnVersion(probes, (glyph) => !glyph.includes("\u{200D}")),
    ).toBe(1);
    expect(newestDrawnVersion(probes, (glyph) => glyph !== "h")).toBe(12);
  });

  it("reports every version when all draw", () => {
    expect(newestDrawnVersion(probes, () => true)).toBe(15);
  });

  it("shows everything when not even the oldest draws", () => {
    expect(newestDrawnVersion(probes, () => false)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

describe("detectEmojiSupport", () => {
  it("tests the flag of a country on its own", () => {
    expect(detectEmojiSupport(items, (glyph) => !isFlagGlyph(glyph))).toEqual({
      version: 15,
      flags: false,
    });
  });

  it("shows everything where there is no canvas", () => {
    expect(detectEmojiSupport(items)).toEqual({
      version: Number.POSITIVE_INFINITY,
      flags: true,
    });
  });
});

describe("filterSupported", () => {
  const flag = item("\u{1F1FA}\u{1F1F8}", 0.6);
  const all = [...items, flag, item("\u{1F3F4}\u{E0067}\u{E007F}", 5)];

  it("returns the same array when nothing is hidden", () => {
    expect(filterSupported(all, { version: Number.POSITIVE_INFINITY })).toBe(
      all,
    );
  });

  it("hides newer versions, and flags where they draw as letters", () => {
    expect(
      filterSupported(all, { version: 12, flags: true }).map((e) => e.emoji),
    ).toEqual([
      "a",
      "b",
      "c",
      "d\u{200D}e\u{200D}f",
      "g",
      flag.emoji,
      all[7].emoji,
    ]);
    expect(
      filterSupported(all, { version: 12, flags: false }).map((e) => e.emoji),
    ).toEqual(["a", "b", "c", "d\u{200D}e\u{200D}f", "g"]);
  });
});

describe("isFlagGlyph", () => {
  it("knows the flag of a country and of a region, not a flag emoji", () => {
    expect(isFlagGlyph("\u{1F1FA}\u{1F1F8}")).toBe(true);
    expect(isFlagGlyph("\u{1F3F4}\u{E0067}\u{E0062}\u{E007F}")).toBe(true);
    expect(isFlagGlyph("\u{1F3C1}")).toBe(false);
    expect(isFlagGlyph("\u{1F3F4}")).toBe(false);
  });
});
