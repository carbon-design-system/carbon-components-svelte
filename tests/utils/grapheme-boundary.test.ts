// @vitest-environment node

const SAMPLES = [
  "plain ascii",
  "café",
  "café x",
  "a\r\nb",
  "😀😀",
  "a😀b",
  "👍🏽 ok",
  "I ❤️ you",
  "👨‍👩‍👧 family",
  "🇯🇵🇺🇸🇫",
  "한국어",
  "कि क",
  "é̂̃",
  "مَرْحَبًا",
];

const RealSegmenter = Intl.Segmenter;

function segmenterBoundaries(text: string) {
  const edges = new Set<number>([text.length]);
  for (const { index } of new RealSegmenter().segment(text)) edges.add(index);
  return edges;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function load(withSegmenter: boolean) {
  vi.resetModules();
  if (!withSegmenter) vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });
  return import("../../src/utils/grapheme-boundary.js");
}

describe.each([
  ["Intl.Segmenter", true],
  ["the fallback (no Intl.Segmenter)", false],
])("grapheme boundaries with %s", (_name, withSegmenter) => {
  it.each(SAMPLES)("agrees with the segmenter on %j", async (text) => {
    const { isGraphemeBoundary, graphemeFloor, graphemeCeil } =
      await load(withSegmenter);
    const edges = segmenterBoundaries(text);
    for (let i = 0; i <= text.length; i++) {
      expect(isGraphemeBoundary(text, i), `boundary ${i}`).toBe(edges.has(i));
      const floor = graphemeFloor(text, i);
      const ceil = graphemeCeil(text, i);
      expect(edges.has(floor), `floor ${i}`).toBe(true);
      expect(edges.has(ceil), `ceil ${i}`).toBe(true);
      expect(floor).toBeLessThanOrEqual(i);
      expect(ceil).toBeGreaterThanOrEqual(i);
      if (edges.has(i)) {
        expect(floor).toBe(i);
        expect(ceil).toBe(i);
      }
    }
  });

  it("clamps out-of-range indices", async () => {
    const { graphemeFloor, graphemeCeil } = await load(withSegmenter);
    expect(graphemeFloor("😀", -4)).toBe(0);
    expect(graphemeCeil("😀", 99)).toBe(2);
  });

  it("keeps a match whole in matchText", async () => {
    vi.resetModules();
    if (!withSegmenter)
      vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });
    const { matchText } = await import("../../src/utils/text-match.js");
    const find = (text: string, query: string) =>
      matchText(text, query).map((r) => text.slice(r.start, r.end));
    expect(find("👍🏽 ok", "👍")).toEqual(["👍🏽"]);
    expect(find("x 👨‍👩‍👧 y", "👨")).toEqual(["👨‍👩‍👧"]);
    expect(find("café", "cafe")).toEqual(["café"]);
  });
});

describe("a segmenter is built only for text that needs one", () => {
  it("skips text below U+0300", async () => {
    const spy = vi.spyOn(Intl, "Segmenter");
    vi.resetModules();
    const { graphemeFloor, isOneUnitPerGrapheme } =
      await import("../../src/utils/grapheme-boundary.js");
    expect(isOneUnitPerGrapheme("café naïve")).toBe(true);
    expect(isOneUnitPerGrapheme("a\r\nb")).toBe(false);
    expect(graphemeFloor("café naïve", 3)).toBe(3);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
