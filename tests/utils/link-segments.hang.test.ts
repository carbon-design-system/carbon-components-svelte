import { linkSegments } from "../../src/utils/link-segments.js";
import { expectWithin } from "./fuzz";

describe("linkSegments on hostile text", () => {
  // `linkSegments` used to trim brackets with a split per character, which
  // took 9 s for 40,000 of them, and scanned to the end from every dot.
  it("trims a long run of closing brackets in linkSegments in a pass", () => {
    const within = `http://a${")".repeat(1500)}`;
    const beyond = `http://a${")".repeat(200_000)}`;

    expectWithin(500, () => {
      expect(linkSegments(within)).toEqual([
        { text: "http://a", href: "http://a/" },
        { text: ")".repeat(1500) },
      ]);
      expect(linkSegments(beyond)).toEqual([{ text: beyond }]);
    });
  });

  it("reads a long run of dotted words in linkSegments in a pass", () => {
    expectWithin(500, () => {
      linkSegments("a.".repeat(500_000));
    });
  });
});
