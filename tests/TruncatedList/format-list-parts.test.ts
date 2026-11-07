import {
  formatListParts,
  listPartsText,
} from "../../src/TruncatedList/format-list-parts";

const names = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Edsger Dijkstra",
];

const sentence = (...args: Parameters<typeof formatListParts>) =>
  listPartsText(formatListParts(...args));

describe("formatListParts", () => {
  it("joins every item when max is unset", () => {
    expect(sentence(names)).toBe(
      "Ada Lovelace, Grace Hopper, Alan Turing, and Edsger Dijkstra",
    );
  });

  it("collapses the rest into one more element the locale joins", () => {
    expect(sentence(names, { max: 2 })).toBe(
      "Ada Lovelace, Grace Hopper, and 2 more",
    );
    expect(sentence(names, { max: 2, locale: "de" })).toBe(
      "Ada Lovelace, Grace Hopper und 2 more",
    );
    expect(sentence(names, { max: 2, locale: "ja" })).toBe(
      "Ada Lovelace、Grace Hopper、2 more",
    );
  });

  it("follows the locale's serial comma", () => {
    expect(sentence(names, { max: 2, locale: "en-GB" })).toBe(
      "Ada Lovelace, Grace Hopper and 2 more",
    );
  });

  it("types parts: items carry their index, more its count", () => {
    const parts = formatListParts(
      ["Ada", { label: "Grace", href: "/g" }, "Alan"],
      {
        max: 2,
      },
    );

    expect(parts).toEqual([
      { type: "item", value: "Ada", item: "Ada", index: 0 },
      { type: "literal", value: ", " },
      {
        type: "item",
        value: "Grace",
        item: { label: "Grace", href: "/g" },
        index: 1,
      },
      { type: "literal", value: ", and " },
      { type: "more", value: "1 more", count: 1 },
    ]);
  });

  it("keeps a label that equals a separator an item", () => {
    const parts = formatListParts([", ", " and "], { max: 2 });

    expect(parts.filter((part) => part.type === "item")).toHaveLength(2);
  });

  it("switches word with type and style", () => {
    expect(sentence(names, { max: 1, type: "disjunction" })).toBe(
      "Ada Lovelace or 3 more",
    );
    expect(sentence(names, { max: 2, style: "short" })).toBe(
      "Ada Lovelace, Grace Hopper, & 2 more",
    );
    expect(sentence(names, { max: 2, type: "unit" })).toBe(
      "Ada Lovelace, Grace Hopper, 2 more",
    );
  });

  it("takes the text of more from formatMore", () => {
    const formatMore = vi.fn((count: number) => `+${count}`);

    expect(sentence(names, { max: 3, formatMore })).toBe(
      "Ada Lovelace, Grace Hopper, Alan Turing, and +1",
    );
    expect(formatMore).toHaveBeenCalledWith(1, "en");
  });

  it("shows the count in the locale's digits", () => {
    const parts = formatListParts(names, { max: 1, locale: "ar-EG" });

    expect(parts.at(-1)).toMatchObject({ type: "more", count: 3 });
    expect(listPartsText(parts)).toContain("٣");
  });

  it("shows every item when max reaches the length", () => {
    expect(
      formatListParts(names, { max: 4 }).some((p) => p.type === "more"),
    ).toBe(false);
    expect(formatListParts(names, { max: 99 })).toEqual(formatListParts(names));
  });

  it("shows only the more element at max 0", () => {
    expect(sentence(names, { max: 0 })).toBe("4 more");
  });

  it.each([undefined, Number.NaN, -1, Number.POSITIVE_INFINITY])(
    "treats max %s as no limit",
    (max) => {
      expect(
        formatListParts(names, { max }).some((p) => p.type === "more"),
      ).toBe(false);
    },
  );

  it("returns no parts for no items", () => {
    expect(formatListParts([])).toEqual([]);
  });

  it("falls back to English for an invalid locale", () => {
    expect(sentence(names, { max: 1, locale: "en_US" })).toBe(
      "Ada Lovelace and 3 more",
    );
  });

  it("counts a thousand items into one more element", () => {
    const many = Array.from({ length: 1000 }, (_, i) => `Person ${i}`);

    expect(sentence(many, { max: 3 })).toBe(
      "Person 0, Person 1, Person 2, and 997 more",
    );
  });
});
