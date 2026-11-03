// @vitest-environment node
import {
  applySkinTone,
  emojiShortcode,
  frequentIds,
  recordEmojiUse,
  resolveEmojiSource,
  toEmojiItems,
} from "carbon-components-svelte/EmojiPicker/emoji-items.js";
import emojiGroups, { emojiVersion } from "carbon-components-svelte/emoji-data";

describe("applySkinTone", () => {
  it("puts the modifier after the person or hand", () => {
    expect(applySkinTone("\u{1F44D}", 3)).toBe("\u{1F44D}\u{1F3FD}");
  });

  it("drops the variation selector the modifier replaces", () => {
    // Person golfing: golfer, variation selector.
    expect(applySkinTone("\u{1F3CC}\u{FE0F}", 5)).toBe("\u{1F3CC}\u{1F3FF}");
    // Man golfing keeps the selector that ends the sequence.
    expect(applySkinTone("\u{1F3CC}\u{FE0F}\u{200D}♂\u{FE0F}", 1)).toBe(
      "\u{1F3CC}\u{1F3FB}\u{200D}♂\u{FE0F}",
    );
  });

  it("puts a modifier after each position of a sequence of two people", () => {
    const holdingHands = "\u{1F9D1}\u{200D}\u{1F91D}\u{200D}\u{1F9D1}";
    expect(applySkinTone(holdingHands, 2, [0, 4])).toBe(
      "\u{1F9D1}\u{1F3FC}\u{200D}\u{1F91D}\u{200D}\u{1F9D1}\u{1F3FC}",
    );
  });

  it("leaves the glyph alone for the default tone or no position", () => {
    expect(applySkinTone("\u{1F44D}", 0)).toBe("\u{1F44D}");
    expect(applySkinTone("\u{1F600}", 3, [])).toBe("\u{1F600}");
  });
});

describe("emojiShortcode", () => {
  it.each([
    ["thumbs up", "thumbs_up"],
    ["Côte d’Ivoire", "cote_d_ivoire"],
    ["flag: Côte d’Ivoire", "flag_cote_d_ivoire"],
    ["keycap: *", "keycap_asterisk"],
    ["keycap: #", "keycap_number_sign"],
    ["1st place medal", "1st_place_medal"],
  ])("writes %s as %s", (name, shortcode) => {
    expect(emojiShortcode(name)).toBe(shortcode);
  });
});

describe("the generated emoji data", () => {
  const { items, categories } = toEmojiItems(emojiGroups);

  it("holds the emoji of Unicode's groups, in order", () => {
    expect(items.length).toBeGreaterThan(1800);
    expect(categories.map((category) => category.id)).toEqual([
      "smileys-emotion",
      "people-body",
      "animals-nature",
      "food-drink",
      "travel-places",
      "activities",
      "objects",
      "symbols",
      "flags",
    ]);
    expect(items[0]).toMatchObject({
      id: "grinning_face",
      label: "grinning face",
      emoji: "\u{1F600}",
      category: "smileys-emotion",
      version: 1,
      tones: [],
    });
  });

  it("gives every emoji a unique shortcode and a version that is not newer than the data", () => {
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    for (const item of items) {
      expect(item.version).toBeGreaterThan(0);
      expect(item.version).toBeLessThanOrEqual(emojiVersion);
    }
  });

  it("finds an emoji by a keyword CLDR gives it, and by its shortcode", () => {
    const thumbsUp = items.find((item) => item.id === "thumbs_up");
    expect(thumbsUp?.keywords).toContain("thumbs_up");
    expect(thumbsUp?.keywords).toContain("like");
    expect(thumbsUp?.tones).toEqual([0]);
  });

  it("marks where skin tones go, for people and for pairs", () => {
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get("people_holding_hands")?.tones).toEqual([0, 4]);
    expect(byId.get("man_golfing")?.tones).toEqual([0]);
    expect(byId.get("grinning_face")?.tones).toEqual([]);
    // 18.0 adds emoji that an engine's own Unicode tables do not know yet.
    expect(byId.get("leftwards_thumb_sign")?.tones).toEqual([0]);
  });

  it("expands once for each dataset", () => {
    expect(toEmojiItems(emojiGroups)).toBe(toEmojiItems(emojiGroups));
  });
});

describe("resolveEmojiSource", () => {
  it("expands groups and passes ready items through", () => {
    const ready = [
      {
        id: "x",
        label: "x",
        category: "c",
        keywords: [],
        emoji: "x",
        shortcode: "x",
        version: 1,
        tones: [],
      },
    ];
    expect(resolveEmojiSource(ready).items).toBe(ready);
    expect(resolveEmojiSource(emojiGroups).items.length).toBeGreaterThan(1800);
  });
});

describe("frequentIds", () => {
  it("orders by use, then by recency", () => {
    expect(
      frequentIds({
        recent: ["c", "b", "a"],
        usage: { a: 5, b: 2, c: 2 },
        limit: 10,
      }),
    ).toEqual(["a", "c", "b"]);
  });

  it("includes recent ids that were never counted, after the counted ones", () => {
    expect(
      frequentIds({ recent: ["x", "y"], usage: { z: 1 }, limit: 10 }),
    ).toEqual(["z", "x", "y"]);
  });

  it("keeps the first `limit`, and none for a limit of 0", () => {
    expect(
      frequentIds({ recent: ["a", "b", "c"], usage: {}, limit: 2 }),
    ).toEqual(["a", "b"]);
    expect(frequentIds({ recent: ["a"], usage: { a: 1 }, limit: 0 })).toEqual(
      [],
    );
  });
});

describe("recordEmojiUse", () => {
  it("counts the choice and moves it to the front of recent", () => {
    expect(
      recordEmojiUse({
        id: "b",
        recent: ["a", "b"],
        usage: { a: 1, b: 1 },
        limit: 5,
      }),
    ).toEqual({ recent: ["b", "a"], usage: { a: 1, b: 2 } });
  });

  it("keeps the newest choice when it prunes the counts", () => {
    const usage = Object.fromEntries(
      Array.from({ length: 8 }, (_, at) => [`e${at}`, 10]),
    );
    const next = recordEmojiUse({ id: "new", recent: [], usage, limit: 2 });
    expect(Object.keys(next.usage)).toHaveLength(8);
    expect(next.usage.new).toBe(1);
    expect(next.recent).toEqual(["new"]);
  });
});
