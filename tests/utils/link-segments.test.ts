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
});
