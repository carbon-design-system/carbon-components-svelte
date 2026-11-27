import { linkSegments } from "../../src/utils/link-segments.js";

describe("linkSegments", () => {
  it("splits text around the links in it", () => {
    expect(
      linkSegments(
        "Track it at https://ship.example.com/t/1Z9 or mail help@x.co",
      ),
    ).toEqual([
      { text: "Track it at " },
      {
        text: "https://ship.example.com/t/1Z9",
        href: "https://ship.example.com/t/1Z9",
      },
      { text: " or mail help@x.co" },
    ]);
  });

  it("leaves URLs with other schemes as text", () => {
    const text = "Click javascript://%0Aalert(1) or data://text/html,hi";

    expect(linkSegments(text)).toEqual([{ text }]);
  });

  it("leaves sentence punctuation out, but keeps brackets the URL opened", () => {
    expect(
      linkSegments(
        "See (https://en.wikipedia.org/wiki/Svelte_(software)), and www.example.com.",
      ),
    ).toEqual([
      { text: "See (" },
      {
        text: "https://en.wikipedia.org/wiki/Svelte_(software)",
        href: "https://en.wikipedia.org/wiki/Svelte_(software)",
      },
      { text: "), and " },
      { text: "www.example.com", href: "https://www.example.com/" },
      { text: "." },
    ]);
  });

  it("links the schemes it is given", () => {
    expect(linkSegments("Call tel:+15550100", { schemes: ["tel:"] })).toEqual([
      { text: "Call " },
      { text: "tel:+15550100", href: "tel:+15550100" },
    ]);
  });

  it("leaves URLs with credentials as text", () => {
    for (const text of [
      "https://google.com@evil.example/",
      "Log in at https://user:pass@example.com/admin",
    ]) {
      expect(linkSegments(text)).toEqual([{ text }]);
    }
  });

  it("ends a link at a bidi control or a zero-width character", () => {
    expect(linkSegments("https://example.com/‮fdp.exe")).toEqual([
      { text: "https://example.com/", href: "https://example.com/" },
      { text: "‮fdp.exe" },
    ]);
    expect(linkSegments("See https://example.com/a​b")).toEqual([
      { text: "See " },
      { text: "https://example.com/a", href: "https://example.com/a" },
      { text: "​b" },
    ]);
  });

  // The splits that changed when linkSegments moved onto linkify.
  it.each([
    ["www.example", [{ text: "www.example" }]],
    [
      "https://example.com/a。next",
      [
        { text: "https://example.com/a", href: "https://example.com/a" },
        { text: "。next" },
      ],
    ],
    [
      "https://example.com/{id}",
      [
        { text: "https://example.com/", href: "https://example.com/" },
        { text: "{id}" },
      ],
    ],
    [
      "https://example.com/a|b",
      [
        { text: "https://example.com/a", href: "https://example.com/a" },
        { text: "|b" },
      ],
    ],
  ])("splits %j as linkify does", (text, segments) => {
    expect(linkSegments(text)).toEqual(segments);
  });

  it("leaves a URL longer than 2,048 characters as text", () => {
    const text = `https://${"a".repeat(2050)}.com`;

    expect(linkSegments(text)).toEqual([{ text }]);
  });

  // A message is untrusted input, so a crafted one must not stall the
  // thread that renders it.
  describe("long runs", () => {
    const BUDGET = 1000;

    it("trims a run of closing brackets in linear time", () => {
      const within = `https://example.com/${")".repeat(1500)}`;
      // Past the 2,048-character cap on a link, the run stays text.
      const beyond = `https://example.com/${")".repeat(40_000)}`;
      const start = performance.now();

      expect(linkSegments(within)).toEqual([
        { text: "https://example.com/", href: "https://example.com/" },
        { text: ")".repeat(1500) },
      ]);
      expect(linkSegments(beyond)).toEqual([{ text: beyond }]);
      expect(performance.now() - start).toBeLessThan(BUDGET);
    });

    it("scans a dotted run in linear time", () => {
      const text = "a.".repeat(40_000);
      const start = performance.now();

      expect(linkSegments(text)).toEqual([{ text }]);
      expect(performance.now() - start).toBeLessThan(BUDGET);
    });
  });
});
