// @vitest-environment node
import {
  applyMaskEdit,
  conformMaskText,
  createMask,
  type MaskChange,
  type MaskOptions,
  type MaskPattern,
} from "../../src/utils/input-mask.js";

const PHONE = "(999) 999-9999";

/**
 * Write the field as a string: `|` is the caret, `[` and `]` bound a
 * selection. The result is written the same way.
 */
function run(
  options: MaskPattern | MaskOptions,
  before: string,
  change: MaskChange,
): string {
  const start = before.search(/[|[]/);
  const end = before.includes("]") ? before.indexOf("]") - 1 : start;
  const value = before.replace(/[|[\]]/g, "");
  const result = applyMaskEdit(options, { value, start, end }, change);
  return `${result.value.slice(0, result.caret)}|${result.value.slice(result.caret)}`;
}

const type = (text: string): MaskChange => ({ type: "insert", text });
const backspace: MaskChange = {
  type: "delete",
  direction: "backward",
  unit: "char",
};
const del: MaskChange = { type: "delete", direction: "forward", unit: "char" };
const wordBack: MaskChange = {
  type: "delete",
  direction: "backward",
  unit: "word",
};
const lineBack: MaskChange = {
  type: "delete",
  direction: "backward",
  unit: "line",
};

describe("format", () => {
  const phone = createMask(PHONE);

  it.each([
    ["4155550123", "(415) 555-0123"],
    ["(415) 555-0123", "(415) 555-0123"],
    ["415-555-0123", "(415) 555-0123"],
    ["415 555 0123 999", "(415) 555-0123"],
    ["4a1b5", "(415"],
    ["", ""],
  ])("%s -> %s", (text, value) => {
    expect(phone.format(text).value).toBe(value);
  });

  it("separates the value, the raw value and completeness", () => {
    expect(phone.format("415555")).toEqual({
      value: "(415) 555",
      rawValue: "415555",
      complete: false,
      pattern: PHONE,
    });
    expect(phone.format("4155550123").complete).toBe(true);
  });

  it("adds a literal only when the next character needs it", () => {
    expect(phone.format("415").value).toBe("(415");
    expect(phone.format("4155").value).toBe("(415) 5");
  });

  it("writes the literals up to the next slot when eager", () => {
    const date = createMask({ pattern: "99/99/9999", eager: true });
    expect(date.format("12").value).toBe("12/");
    expect(date.format("1231").value).toBe("12/31/");
    expect(date.format("").value).toBe("");
  });

  it("reads a typed literal as the pattern's own", () => {
    expect(createMask("+1 999").format("+1 415").value).toBe("+1 415");
    expect(createMask("+1 999").format("1").value).toBe("");
    expect(createMask("+1 999").format("415").value).toBe("+1 415");
  });

  it("escapes a slot character to make it a literal", () => {
    const mask = createMask("\\9 99");
    expect(mask.format("12").value).toBe("9 12");
    expect(mask.unmask("9 12")).toBe("12");
  });

  it("applies the slot types", () => {
    const iban = createMask("AA99 9999");
    expect(iban.format("de891234").value).toBe("DE89 1234");
    expect(iban.format("1de89").value).toBe("DE89");
    expect(createMask("aa-99").format("ABc12").value).toBe("ab-12");
    expect(createMask("***").format("a-1b!").value).toBe("a1b");
    expect(createMask("XXX").format("a1b").value).toBe("A1B");
  });

  it("reads digits typed in other scripts", () => {
    expect(createMask("9999").format("١٢٣٤").value).toBe("1234");
    expect(createMask("9999").format("１２３４").value).toBe("1234");
    expect(createMask("9999").format("𝟏𝟐𝟑𝟒").value).toBe("1234");
  });

  it("keeps a letter that upper-cases to two characters", () => {
    expect(createMask("A").format("ß").value).toBe("ß");
  });

  it("composes a decomposed letter before testing it", () => {
    expect(createMask("AA").format("éx").value).toBe("ÉX");
  });

  it("switches the pattern on the raw value", () => {
    const card = createMask({
      pattern: (raw: string) =>
        /^3[47]/.test(raw) ? "9999 999999 99999" : "9999 9999 9999 9999",
    });
    expect(card.format("4111111111111111").value).toBe("4111 1111 1111 1111");
    expect(card.format("378282246310005").value).toBe("3782 822463 10005");
    expect(card.format("3782822463100059999").value).toBe("3782 822463 10005");
    expect(card.format("378").value).toBe("378");
    expect(card.format("3782").value).toBe("3782");
    expect(card.format("37828").value).toBe("3782 8");
  });

  it("drops characters that no longer fit after the pattern changes", () => {
    const mask = createMask({
      pattern: (raw: string) => (/^\d/.test(raw) ? "*9" : "*A"),
    });
    expect(mask.format("1ab2").value).toBe("12");
    expect(mask.format("a1b2").value).toBe("aB");
  });

  it("is a fixed point", () => {
    const once = phone.format("4155550123").value;
    expect(phone.format(once).value).toBe(once);
  });

  it("builds a placeholder", () => {
    expect(createMask(PHONE).placeholder()).toBe("(___) ___-____");
    expect(createMask("AA99").placeholder("#")).toBe("####");
    expect(createMask("\\9 99").placeholder()).toBe("9 __");
  });

  it("coerces a pattern function that returns nothing", () => {
    const mask = createMask({ pattern: () => undefined as unknown as string });
    expect(mask.format("123").value).toBe("");
  });

  it("is complete only when every slot is filled", () => {
    expect(createMask(PHONE).isComplete("415555012")).toBe(false);
    expect(createMask(PHONE).isComplete("4155550123")).toBe(true);
  });
});

describe("typing", () => {
  it.each([
    ["|", "4", "(4|"],
    ["(4|", "1", "(41|"],
    ["(41|", "5", "(415|"],
    ["(415|", "5", "(415) 5|"],
    ["(415) 555-012|", "3", "(415) 555-0123|"],
  ])("%s + %s", (before, text, after) => {
    expect(run(PHONE, before, type(text))).toBe(after);
  });

  it("keeps the caret after the typed character in the middle", () => {
    expect(run(PHONE, "(4|15) 555", type("9"))).toBe("(49|1) 555-5");
  });

  it("ignores a character the slot refuses", () => {
    expect(run(PHONE, "(41|", type("x"))).toBe("(41|");
  });

  it("refuses a character that would push one out of a full field", () => {
    expect(run(PHONE, "(415) 5|55-0123", type("9"))).toBe("(415) 5|55-0123");
    expect(run(PHONE, "(415) 555-0123|", type("9"))).toBe("(415) 555-0123|");
  });

  it("steps over a literal that is typed", () => {
    expect(run("999-999", "415|", type("-"))).toBe("415|");
    expect(run("999-999", "415|", type("-5"))).toBe("415-5|");
  });

  it("puts the caret after the literals an eager mask wrote", () => {
    const date: MaskOptions = { pattern: "99/99/9999", eager: true };
    expect(run(date, "1|", type("2"))).toBe("12/|");
    expect(run(date, "12/|", type("3"))).toBe("12/3|");
  });

  it("replaces a selection", () => {
    expect(run(PHONE, "[(415) 555-0123]", type("9"))).toBe("(9|");
    expect(run(PHONE, "(4[15) 55]5-0123", type("9"))).toBe("(49|5) 012-3");
  });

  it("keeps a selection when nothing typed is accepted", () => {
    const state = { value: "(415) 555", start: 0, end: 5 };
    const result = applyMaskEdit(PHONE, state, type("x"));
    expect(result.changed).toBe(false);
    expect(result.value).toBe("(415) 555");
  });
});

describe("paste", () => {
  it("strips what the pattern does not take and re-masks", () => {
    expect(run(PHONE, "|", type("415.555.0123"))).toBe("(415) 555-0123|");
    expect(run(PHONE, "|", type(" (415) 555-0123 "))).toBe("(415) 555-0123|");
  });

  it("truncates a paste that is too long", () => {
    expect(run(PHONE, "|", type("41555501239999"))).toBe("(415) 555-0123|");
  });

  it("pastes into the middle and keeps the tail", () => {
    expect(run(PHONE, "(4|15)", type("99"))).toBe("(499|) 15");
    expect(run(PHONE, "(415) 5|55", type("12"))).toBe("(415) 512|-55");
  });

  it("takes only as much as fits in front of the tail", () => {
    expect(run(PHONE, "(415) 555-01|23", type("999"))).toBe("(415) 555-01|23");
    expect(run(PHONE, "(415) 555-01|2", type("99"))).toBe("(415) 555-019|2");
  });

  it("replaces a selection with the paste", () => {
    expect(run(PHONE, "[(415) 555-0123]", type("(212) 555-0100"))).toBe(
      "(212) 555-0100|",
    );
  });

  it("refuses a paste with nothing the pattern takes", () => {
    expect(run(PHONE, "(415|", type("abc"))).toBe("(415|");
  });
});

describe("Backspace", () => {
  it.each([
    ["(415) 555|", "(415) 55|"],
    ["(4|", "|"],
    ["(415|", "(41|"],
    ["(415) 5|", "(415|"],
    ["|", "|"],
    ["(|415", "(|415"],
  ])("%s", (before, after) => {
    expect(run(PHONE, before, backspace)).toBe(after);
  });

  it("deletes the digit before a literal, not the literal", () => {
    expect(run(PHONE, "(415) |555", backspace)).toBe("(41|5) 55");
    expect(run(PHONE, "(415)| 555", backspace)).toBe("(41|5) 55");
    expect(run(PHONE, "(415|) 555", backspace)).toBe("(41|5) 55");
  });

  it("closes up and keeps the caret before the next group", () => {
    expect(run(PHONE, "(415) 5|55-0123", backspace)).toBe("(415) |550-123");
  });

  it("deletes a selection", () => {
    expect(run(PHONE, "(4[15) 5]55", backspace)).toBe("(4|55");
  });

  it("is refused when letters would have to move into digit slots", () => {
    expect(run("AA99", "A|B12", backspace)).toBe("A|B12");
    expect(run("AA99", "AB12|", backspace)).toBe("AB1|");
  });
});

describe("Delete", () => {
  it("removes the next digit and leaves the caret", () => {
    expect(run(PHONE, "(4|15) 555", del)).toBe("(4|55) 55");
  });

  it("reaches over a literal", () => {
    expect(run(PHONE, "(415|) 555", del)).toBe("(415|) 55");
    expect(run(PHONE, "(415) |555", del)).toBe("(415) |55");
  });

  it("does nothing at the end", () => {
    expect(run(PHONE, "(415) 555|", del)).toBe("(415) 555|");
  });
});

describe("word and line deletes", () => {
  it("removes a group backward", () => {
    expect(run(PHONE, "(415) 555|", wordBack)).toBe("(415|");
  });

  it("removes the previous group when the caret sits on a boundary", () => {
    expect(run(PHONE, "(415) |555", wordBack)).toBe("(|555");
  });

  it("removes everything before the caret", () => {
    expect(run(PHONE, "(415) 5|55", lineBack)).toBe("(|55");
  });

  it("removes a group forward", () => {
    expect(
      run(PHONE, "(4|15) 555", {
        type: "delete",
        direction: "forward",
        unit: "word",
      }),
    ).toBe("(4|55) 5");
  });

  it("removes to the end of the line", () => {
    expect(
      run(PHONE, "(41|5) 555", {
        type: "delete",
        direction: "forward",
        unit: "line",
      }),
    ).toBe("(41|");
  });
});

describe("conformMaskText (the fallback for edits the browser made)", () => {
  it("re-masks and keeps the caret among the digits", () => {
    expect(conformMaskText(PHONE, "(415) 5x55", 8)).toMatchObject({
      value: "(415) 555",
      caret: 7,
    });
  });

  it("puts the caret right after the last character before it", () => {
    expect(conformMaskText(PHONE, "4155", 4)).toMatchObject({
      value: "(415) 5",
      caret: 7,
    });
  });

  it("reads a composed run of fullwidth digits", () => {
    expect(conformMaskText("9999", "１２３", 3)).toMatchObject({
      value: "123",
      caret: 3,
    });
  });
});

describe("a pattern that switches while typing", () => {
  const card: MaskOptions = {
    pattern: (raw) =>
      /^3[47]/.test(raw) ? "9999 999999 99999" : "9999 9999 9999 9999",
  };

  it("regroups when the prefix says American Express", () => {
    expect(run(card, "3|", type("7"))).toBe("37|");
    expect(run(card, "3782|", type("8"))).toBe("3782 8|");
    expect(run(card, "3782 822463 1000|", type("5"))).toBe(
      "3782 822463 10005|",
    );
    expect(run(card, "3782 822463 10005|", type("9"))).toBe(
      "3782 822463 10005|",
    );
  });

  it("regroups when the prefix is edited", () => {
    expect(run(card, "[3]782 822463 10005", type("4"))).toBe(
      "4|782 8224 6310 005",
    );
  });
});
