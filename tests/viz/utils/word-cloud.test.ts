import { layoutWords } from "../../../src/viz/utils/word-cloud.js";

const words = [
  "latency",
  "timeout",
  "deploy",
  "rollback",
  "cache",
  "queue",
  "retry",
  "alert",
  "oncall",
  "quota",
  "token",
  "shard",
].map((text, i) => ({ text, value: 100 - i * 7 }));
const box = { width: 480, height: 280 };

describe("layoutWords", () => {
  test("puts the largest word at the center and sizes words by value", () => {
    const { words: placed, dropped } = layoutWords(words, {
      ...box,
      maxSize: 40,
    });

    expect(dropped).toBe(0);
    expect(placed).toHaveLength(12);
    expect(placed[0]).toMatchObject({
      text: "latency",
      size: 40,
      x: 240,
      y: 140,
    });
    expect(placed.at(-1)?.size).toBe(12);
    const sizes = placed.map((word) => word.size);
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
  });

  test("never overlaps and never leaves the box", () => {
    const { words: placed } = layoutWords(words, box);

    for (let i = 0; i < placed.length; i++) {
      const a = placed[i].box;
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.width).toBeLessThanOrEqual(480);
      expect(a.y + a.height).toBeLessThanOrEqual(280);
      for (let j = i + 1; j < placed.length; j++) {
        const b = placed[j].box;
        const apart =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  test("is the same on every run", () => {
    expect(layoutWords(words, box)).toEqual(layoutWords(words, box));
  });

  test("drops what finds no room, and what falls past the limit", () => {
    const tight = layoutWords(words, { width: 160, height: 60 });
    expect(tight.words.length).toBeLessThan(12);
    expect(tight.words.length + tight.dropped).toBe(12);

    const limited = layoutWords(words, { ...box, maxWords: 3 });
    expect(limited.words.map((word) => word.text)).toEqual([
      "latency",
      "timeout",
      "deploy",
    ]);
    expect(limited.dropped).toBe(9);
  });

  test("skips empty text and bad values, keeping input indexes", () => {
    const { words: placed } = layoutWords(
      Object.freeze([
        { text: "", value: 5 },
        { text: "zero", value: 0 },
        { text: "nan", value: Number.NaN },
        { text: "kept", value: 3 },
      ]),
      box,
    );

    expect(placed.map((word) => [word.text, word.index])).toEqual([
      ["kept", 3],
    ]);
    // A lone word takes the largest size.
    expect(placed[0].size).toBe(56);
  });

  test("handles nothing", () => {
    expect(layoutWords([], box)).toEqual({ words: [], dropped: 0 });
  });
});
