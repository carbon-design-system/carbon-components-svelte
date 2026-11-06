// @vitest-environment node
import {
  createAnchor,
  locateAnchor,
  locateAnchors,
} from "../../src/TextAnnotations/anchor.js";

const CONTRACT = [
  "1. Term. This Agreement begins on the Effective Date and continues for twelve months.",
  "2. Fees. The Customer shall pay the Supplier a monthly fee of 4,200 euros within thirty days of invoice.",
  "3. Liability. Neither party is liable for indirect or consequential loss arising from this Agreement.",
  "4. Notice. Either party may end this Agreement by giving sixty days written notice.",
].join("\n");

function annotate(text: string, phrase: string, occurrence = 0) {
  let start = -1;
  for (let i = 0; i <= occurrence; i++) start = text.indexOf(phrase, start + 1);
  return createAnchor(text, start, start + phrase.length);
}

describe("createAnchor", () => {
  it("records the quote and the text around it", () => {
    const anchor = annotate(CONTRACT, "monthly fee of 4,200 euros");
    expect(anchor.quote).toBe("monthly fee of 4,200 euros");
    expect(anchor.prefix.endsWith("Supplier a ")).toBe(true);
    expect(anchor.suffix.startsWith(" within thirty")).toBe(true);
  });

  it("clamps offsets to the text and orders them", () => {
    const anchor = createAnchor("hello", 9, -3);
    expect(anchor.range).toEqual({ start: 0, end: 5 });
    expect(anchor.quote).toBe("hello");
  });
});

describe("locateAnchor", () => {
  it("is exact while the offsets still hold the quote", () => {
    const anchor = annotate(CONTRACT, "sixty days written notice");
    expect(locateAnchor(CONTRACT, anchor)).toEqual({
      start: anchor.range.start,
      end: anchor.range.end,
      status: "exact",
    });
  });

  it("follows the quote when text is inserted before it", () => {
    const anchor = annotate(CONTRACT, "sixty days written notice");
    const edited = `0. Definitions. Added in review.\n${CONTRACT}`;
    const found = locateAnchor(edited, anchor);
    expect(found.status).toBe("moved");
    expect(edited.slice(found.start, found.end)).toBe(
      "sixty days written notice",
    );
  });

  it("follows the quote when text is deleted before it", () => {
    const anchor = annotate(CONTRACT, "indirect or consequential loss");
    const edited = CONTRACT.slice(90);
    const found = locateAnchor(edited, anchor);
    expect(found.status).toBe("moved");
    expect(edited.slice(found.start, found.end)).toBe(anchor.quote);
  });

  it("picks the occurrence whose surroundings match", () => {
    const text =
      "The fee is due. Pay the fee in euros. The fee is waived for charities. Refund the fee.";
    const anchor = annotate(text, "fee", 2);
    const edited = `Intro. ${text}`;
    const found = locateAnchor(edited, anchor);
    expect(found.status).toBe("moved");
    expect(edited.slice(found.start - 4, found.end + 10)).toBe(
      "The fee is waived",
    );
  });

  it("falls back to the nearest occurrence when there is no context", () => {
    const text = "alpha beta alpha beta alpha";
    const found = locateAnchor(text.replace("alpha", "x"), {
      range: { start: 22, end: 27 },
      quote: "alpha",
    });
    expect(found.status).toBe("moved");
    expect(found.start).toBe(18);
  });

  it("finds a close match when the quote itself was edited", () => {
    const anchor = annotate(CONTRACT, "shall pay the Supplier a monthly fee");
    const edited = CONTRACT.replace(
      "shall pay the Supplier a monthly fee",
      "must pay the Supplier a monthly fees",
    ).replace("1. Term.", "1. Term and renewal.");
    const found = locateAnchor(edited, anchor);
    expect(found.status).toBe("fuzzy");
    expect(edited.slice(found.start, found.end)).toContain("pay the Supplier");
    expect(found.end - found.start).toBeGreaterThan(30);
  });

  it("finds a close match when the whitespace changed", () => {
    const anchor = annotate(CONTRACT, "within thirty days of invoice");
    const edited = CONTRACT.replace(
      "within thirty days of invoice",
      "within  thirty days  of invoice",
    );
    const found = locateAnchor(edited, anchor);
    expect(found.status).toBe("fuzzy");
    expect(edited.slice(found.start, found.end).replace(/\s+/g, " ")).toBe(
      "within thirty days of invoice",
    );
  });

  it("matches a long quote by its head and tail", () => {
    const quote = `${"The party of the first part agrees to everything. ".repeat(8)}End of clause.`;
    const text = `Preamble.\n${quote}\nSchedule.`;
    const anchor = createAnchor(text, 10, 10 + quote.length);
    const edited = text.replace(
      "agrees to everything. The",
      "agrees to all. The",
    );
    const found = locateAnchor(`New heading.\n${edited}`, anchor);
    expect(found.status).toBe("fuzzy");
    expect(found.end - found.start).toBeGreaterThan(quote.length * 0.8);
  });

  it("is orphaned when the text is gone", () => {
    const anchor = annotate(CONTRACT, "Neither party is liable");
    const edited = CONTRACT.replace(/3\. Liability[^\n]*\n/, "");
    expect(locateAnchor(edited, anchor).status).toBe("orphaned");
  });

  it("does not match a quote too short to tell from another word", () => {
    const anchor = createAnchor("a cat sat", 2, 5);
    expect(locateAnchor("a bat sat", anchor).status).toBe("orphaned");
  });

  it("is orphaned for an empty quote", () => {
    expect(
      locateAnchor("text", { range: { start: 1, end: 1 }, quote: "" }).status,
    ).toBe("orphaned");
  });

  it("does not need the text to be Latin", () => {
    const text = "مرحبا بالعالم. هذا عقد بين الطرفين. Payment due in 30 days.";
    const anchor = annotate(text, "هذا عقد بين الطرفين");
    const edited = `بند جديد. ${text}`;
    const found = locateAnchor(edited, anchor);
    expect(found.status).toBe("moved");
    expect(edited.slice(found.start, found.end)).toBe("هذا عقد بين الطرفين");
  });

  it("handles a heavily edited 20,000 word text within a frame budget", () => {
    const words = Array.from({ length: 20_000 }, (_, i) => `word${i % 997}`);
    const text = words.join(" ");
    const anchors = Array.from({ length: 200 }, (_, i) => {
      const start = 300 + i * 600;
      return createAnchor(text, start, start + 40);
    });
    const edited = `${"Inserted paragraph. ".repeat(20)}${text.replace(/word5(\d)/g, "w5$1")}`;
    const started = performance.now();
    const found = locateAnchors(edited, anchors);
    const elapsed = performance.now() - started;
    expect(found).toHaveLength(200);
    expect(found.filter((f) => f.status === "orphaned").length).toBeLessThan(
      200,
    );
    expect(elapsed).toBeLessThan(2000);
  });
});
