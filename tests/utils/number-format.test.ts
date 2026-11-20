// @vitest-environment node
import {
  compareDecimal,
  createNumberFormat,
  currencyFractionDigits,
  fromMinorUnits,
  isMultipleOf,
  type NumberChange,
  type NumberFormatOptions,
  numberToDecimal,
  roundDecimal,
  toMinorUnits,
} from "../../src/utils/number-format.js";

const NBSP = String.fromCodePoint(0xa0);
/** Intl writes a no-break space before a trailing symbol. */
const nb = (s: string) => s.replace(/ /g, NBSP);
const MINUS = String.fromCodePoint(0x2212);
/** ASCII digits as Arabic-Indic digits. */
const arabic = (s: string) =>
  s.replace(/\d/g, (d) => String.fromCodePoint(0x660 + Number(d)));
const fullwidth = (s: string) =>
  s.replace(/\d/g, (d) => String.fromCodePoint(0xff10 + Number(d)));

const make = (locale: string, options: NumberFormatOptions = {}) =>
  createNumberFormat({ locale, ...options });

const USD = make("en-US", { currency: "USD", allowNegative: true });
const EUR_DE = make("de-DE", { currency: "EUR", allowNegative: true });

/**
 * Write a state as a string: `|` is the caret, `[` and `]` bound a
 * selection. The result is written the same way, and ends with `!` when the
 * text did not change.
 */
function run(
  format: ReturnType<typeof createNumberFormat>,
  before: string,
  change: NumberChange,
): string {
  const start = before.search(/[|[]/);
  const end = before.includes("]") ? before.indexOf("]") - 1 : start;
  const value = before.replace(/[|[\]]/g, "");
  const result = format.applyEdit({ value, start, end }, change);
  const text = `${result.value.slice(0, result.caret)}|${result.value.slice(result.caret)}`;
  return result.changed ? text : `${text}!`;
}

const type = (text: string): NumberChange => ({ type: "insert", text });
const backspace: NumberChange = {
  type: "delete",
  direction: "backward",
  unit: "char",
};
const del: NumberChange = {
  type: "delete",
  direction: "forward",
  unit: "char",
};
const wordBack: NumberChange = {
  type: "delete",
  direction: "backward",
  unit: "word",
};
const wordForward: NumberChange = {
  type: "delete",
  direction: "forward",
  unit: "word",
};
const lineBack: NumberChange = {
  type: "delete",
  direction: "backward",
  unit: "line",
};

/** Type `keys` one by one into an empty field, as a keyboard does. */
function typed(
  format: ReturnType<typeof createNumberFormat>,
  keys: string,
  start = "",
) {
  let state = { value: start, start: start.length, end: start.length };
  for (const key of keys) {
    const r = format.applyEdit(state, { type: "insert", text: key });
    state = { value: r.value, start: r.caret, end: r.caret };
  }
  return `${state.value.slice(0, state.start)}|${state.value.slice(state.start)}`;
}

describe("format", () => {
  it.each([
    ["en-US", { currency: "USD" }, "1234.5", "$1,234.50"],
    ["en-US", { currency: "USD" }, "0", "$0.00"],
    ["en-US", { currency: "USD" }, "1234567.891", "$1,234,567.89"],
    ["de-DE", { currency: "EUR" }, "1234.5", nb("1.234,50 €")],
    ["de-DE", { currency: "EUR" }, "-1234.5", nb("-1.234,50 €")],
    ["en-IE", { currency: "EUR" }, "1234.5", "€1,234.50"],
    ["en-IN", { currency: "INR" }, "123456.78", "₹1,23,456.78"],
    ["en-IN", { currency: "INR" }, "12345678.9", "₹1,23,45,678.90"],
    ["ja-JP", { currency: "JPY" }, "1234.5", "￥1,235"],
    ["en-US", { currency: "JPY" }, "1234", "¥1,234"],
    ["en-US", { currency: "BHD" }, "1.5", nb("BHD 1.500")],
    [
      "en-US",
      { currency: "USD", currencySign: "accounting" },
      "-12.5",
      "($12.50)",
    ],
    ["en-US", { unit: "kg" }, "12.5", "12.5 kg"],
    ["en-US", { unit: "%" }, "5", "5%"],
    ["de-DE", { unit: "%" }, "5", nb("5 %")],
    ["en-US", { unit: "ms" }, "1500", "1,500 ms"],
    ["en-US", { unit: "GB" }, "1.25", "1.25 GB"],
    ["en-US", { unit: "kilometer-per-hour" }, "90", "90 km/h"],
    ["de-DE", {}, "1234567.891", "1.234.567,891"],
    ["fr-FR", {}, "1234.5", `1${String.fromCodePoint(0x202f)}234,5`],
  ] as [string, NumberFormatOptions, string, string][])(
    "%s %j: %s -> %s",
    (locale, options, value, expected) => {
      expect(make(locale, options).format(value)).toBe(expected);
    },
  );

  it("uses the digits of the locale", () => {
    expect(make("ar-EG", { currency: "EGP" }).format("1234.5")).toMatch(
      /^[٠-٩٫٬]+[٠-٩٫٬]*/,
    );
    expect(make("ar-EG", { currency: "EGP" }).format("1234.5")).toContain(
      arabic("234"),
    );
    expect(make("ar-EG", { unit: "GB" }).format("12")).toContain(arabic("12"));
  });

  it("puts the group, the decimal mark and the symbol where the locale does", () => {
    expect(make("fr-CH", { currency: "CHF" }).format("1234.5")).toMatch(
      /^1.234\.50\s*CHF$/,
    );
    expect(make("fr-CH", { currency: "CHF" }).decimal).toBe(".");
    // Plain numbers in fr-CH use a comma: the style decides.
    expect(make("fr-CH").decimal).toBe(",");
    expect(make("de-CH", { currency: "CHF" }).format("1234.5")).toMatch(
      /^CHF\s1.234\.50$/,
    );
  });

  it("formats a number the same as the string that stands for it", () => {
    expect(USD.format(1234.5)).toBe("$1,234.50");
    expect(USD.format(1e-7)).toBe("$0.00");
    expect(USD.format(1e21)).toBe(`$1${",000".repeat(7)}.00`);
  });

  it("rounds to the digits of the currency", () => {
    expect(USD.format("1.005")).toBe("$1.01");
    expect(USD.format("0.999")).toBe("$1.00");
    expect(make("ja-JP", { currency: "JPY" }).format("0.5")).toContain("1");
    expect(make("en-US", { currency: "BHD" }).format("1.0005")).toBe(
      nb("BHD 1.001"),
    );
  });

  it("formats an empty or unusable value as empty text", () => {
    for (const v of ["", "abc", "1e5", null, undefined, Number.NaN, {}]) {
      expect(USD.format(v)).toBe("");
    }
  });

  it("keeps every digit of a long amount", () => {
    expect(USD.format("123456789012345.67")).toBe("$123,456,789,012,345.67");
  });

  it("pads to the minimum fraction digits only when asked to finalize", () => {
    expect(USD.render("1")).toBe("$1");
    expect(USD.render("1.")).toBe("$1.");
    expect(USD.render("1.5")).toBe("$1.5");
    expect(USD.format("1")).toBe("$1.00");
  });

  it("writes minimumFractionDigits and maximumFractionDigits", () => {
    const f = make("en-US", {
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
    expect(f.format("5")).toBe("$5");
    expect(f.format("5.12345")).toBe("$5.1235");
  });

  it("reports the fraction digits of each currency", () => {
    expect(currencyFractionDigits("JPY")).toBe(0);
    expect(currencyFractionDigits("USD")).toBe(2);
    expect(currencyFractionDigits("BHD")).toBe(3);
    expect(currencyFractionDigits("CLF")).toBe(4);
  });
});

describe("parse", () => {
  const cases: [string, NumberFormatOptions, string, string | null][] = [
    // The locale's own marks.
    ["en-US", { currency: "USD" }, "$1,234.56", "1234.56"],
    ["de-DE", { currency: "EUR" }, nb("1.234,56 €"), "1234.56"],
    [
      "fr-FR",
      { currency: "EUR" },
      `1${String.fromCodePoint(0x202f)}234,56 €`,
      "1234.56",
    ],
    ["fr-FR", { currency: "EUR" }, "1 234,56", "1234.56"],
    ["fr-CH", { currency: "CHF" }, "1'234.56 CHF", "1234.56"],
    [
      "de-CH",
      { currency: "CHF" },
      `CHF 1${String.fromCodePoint(0x2019)}234.56`,
      "1234.56",
    ],
    ["en-IN", { currency: "INR" }, "₹1,23,456.78", "123456.78"],
    ["ja-JP", { currency: "JPY" }, "￥1,235", "1235"],
    [
      "ar-EG",
      { currency: "EGP" },
      `${arabic("1")}٬${arabic("234")}٫${arabic("56")} ج.م.`,
      "1234.56",
    ],
    // Digits of other scripts, full-width marks.
    ["ja-JP", {}, fullwidth("1,234．5"), "1234.5"],
    ["en-US", {}, arabic("1234"), "1234"],
    // A number from another locale pasted in. The last mark is the decimal.
    ["de-DE", { currency: "EUR" }, "1,234.56", "1234.56"],
    ["en-US", { currency: "USD" }, "1.234,56", "1234.56"],
    ["en-US", { currency: "USD" }, "1 234,56", "1234.56"],
    ["en-US", { currency: "USD" }, "1'234.56", "1234.56"],
    ["de-DE", { currency: "EUR" }, "1.234.567", "1234567"],
    ["en-US", { currency: "USD" }, "1,234,567", "1234567"],
    ["en-US", { currency: "USD" }, "12,34,567", "1234567"],
    ["en-US", { currency: "USD" }, "1.234.567,89", "1234567.89"],
    // A lone mark: grouping when three digits follow and the field cannot hold
    // them as a fraction, a decimal mark otherwise.
    ["en-US", { currency: "USD" }, "12,5", "12.5"],
    ["en-US", { currency: "USD" }, "12.5", "12.5"],
    ["en-US", { currency: "USD" }, "1,234", "1234"],
    ["en-US", { currency: "USD" }, "1.234", "1234"],
    ["de-DE", { currency: "EUR" }, "1,234", "1234"],
    ["de-DE", { currency: "EUR" }, "1.234", "1234"],
    ["en-US", { currency: "USD" }, "0.123", "0.12"],
    ["en-US", { currency: "USD" }, "1,2345", "1.23"],
    // With room for three fraction digits the locale decides.
    ["en-US", { unit: "kg" }, "1.234", "1.234"],
    ["en-US", { unit: "kg" }, "1,234", "1234"],
    ["de-DE", { unit: "kg" }, "1.234", "1234"],
    ["de-DE", { unit: "kg" }, "1,234", "1.234"],
    ["en-US", { currency: "BHD" }, "1.234", "1.234"],
    // JPY has no fraction.
    ["ja-JP", { currency: "JPY" }, "1,234.5", "1235"],
    ["ja-JP", { currency: "JPY" }, "1.234", "1234"],
    // Negative styles.
    ["en-US", { currency: "USD", allowNegative: true }, "-12.5", "-12.5"],
    [
      "en-US",
      { currency: "USD", allowNegative: true },
      `${MINUS}12.5`,
      "-12.5",
    ],
    ["en-US", { currency: "USD", allowNegative: true }, "-$12.50", "-12.50"],
    ["en-US", { currency: "USD", allowNegative: true }, "$-12.50", "-12.50"],
    ["en-US", { currency: "USD", allowNegative: true }, "($12.50)", "-12.50"],
    ["en-US", { currency: "USD", allowNegative: true }, "(12.50)", "-12.50"],
    ["en-US", { currency: "USD", allowNegative: true }, "12.50-", "-12.50"],
    ["en-US", { currency: "USD", allowNegative: true }, "- 12.50", "-12.50"],
    [
      "en-US",
      { currency: "USD", allowNegative: true },
      `${String.fromCodePoint(0x2013)}12`,
      "-12",
    ],
    [
      "de-DE",
      { currency: "EUR", allowNegative: true },
      nb("-1.234,56 €"),
      "-1234.56",
    ],
    [
      "sv-SE",
      { currency: "SEK", allowNegative: true },
      `${MINUS}1${NBSP}234,50${NBSP}kr`,
      "-1234.50",
    ],
    [
      "ar-EG",
      { currency: "EGP", allowNegative: true },
      `؜-${arabic("12")}`,
      "-12",
    ],
    ["en-US", { currency: "USD" }, "-12.5", null],
    ["en-US", { currency: "USD" }, "(12.5)", null],
    // Negative zero is zero.
    ["en-US", { currency: "USD", allowNegative: true }, "-0.00", "0.00"],
    // Scientific notation and other text are rejected.
    ["en-US", { currency: "USD" }, "1e5", null],
    ["en-US", { currency: "USD" }, "1E5", null],
    ["en-US", { currency: "USD" }, "1.5e-3", null],
    ["en-US", { currency: "USD" }, "Infinity", null],
    ["en-US", { currency: "USD" }, "NaN", null],
    ["en-US", { currency: "USD" }, "abc", null],
    ["en-US", { currency: "USD" }, "12abc", null],
    ["en-US", { currency: "USD" }, "1-2", null],
    ["en-US", { currency: "USD" }, "1.2.3", null],
    ["en-US", { currency: "USD" }, "1,2,3", null],
    ["en-US", { currency: "USD" }, "1.234,567.89", null],
    ["en-US", { currency: "USD" }, "-", null],
    ["en-US", { currency: "USD" }, "$", null],
    // Symbols and units are taken and dropped.
    ["en-US", { currency: "USD" }, "USD 12.50", "12.50"],
    ["en-US", { currency: "USD" }, "12.50 USD", "12.50"],
    ["de-DE", { currency: "EUR" }, "EUR 12", "12"],
    ["en-US", { unit: "kg" }, "12.5 kg", "12.5"],
    ["en-US", { unit: "kg" }, "12.5 kilograms", "12.5"],
    ["en-US", { unit: "kg" }, "12.5 lb", null],
    ["de-DE", { unit: "%" }, nb("5 %"), "5"],
    ["en-US", { unit: "%" }, "5%", "5"],
    ["en-US", { unit: "ms" }, "1,500 ms", "1500"],
    // Empty.
    ["en-US", { currency: "USD" }, "", ""],
    ["en-US", { currency: "USD" }, "   ", ""],
    // Too many integer digits.
    ["en-US", { currency: "USD" }, "1".repeat(16), null],
    ["en-US", { currency: "USD" }, "1".repeat(15), "1".repeat(15)],
  ];

  it.each(cases)("%s %j: %j -> %j", (locale, options, input, expected) => {
    const parsed = make(locale, options).parse(input);
    expect(parsed ? parsed.value : null).toBe(expected);
  });

  it("marks the lone mark with three digits as ambiguous", () => {
    expect(USD.parse("1,234")?.ambiguous).toBe(true);
    expect(USD.parse("1.234")?.ambiguous).toBe(true);
    expect(EUR_DE.parse("1.234")?.ambiguous).toBe(true);
    expect(make("en-US", { unit: "kg" }).parse("1.234")?.ambiguous).toBe(true);
    expect(USD.parse("12,5")?.ambiguous).toBe(false);
    expect(USD.parse("1,234.56")?.ambiguous).toBe(false);
    expect(USD.parse("0.123")?.ambiguous).toBe(false);
    expect(USD.parse("1234")?.ambiguous).toBe(false);
  });

  it("round-trips what the format writes, for every locale and style", () => {
    const specs: [string, NumberFormatOptions][] = [
      ["en-US", { currency: "USD" }],
      ["de-DE", { currency: "EUR" }],
      ["en-IE", { currency: "EUR" }],
      ["fr-CH", { currency: "CHF" }],
      ["de-CH", { currency: "CHF" }],
      ["fr-FR", { currency: "EUR" }],
      ["es-ES", { currency: "EUR" }],
      ["pt-BR", { currency: "BRL" }],
      ["sv-SE", { currency: "SEK" }],
      ["nl-NL", { currency: "EUR" }],
      ["en-IN", { currency: "INR" }],
      ["hi-IN", { currency: "INR" }],
      ["ja-JP", { currency: "JPY" }],
      ["ar-EG", { currency: "EGP" }],
      ["fa-IR", { currency: "IRR" }],
      ["he-IL", { currency: "ILS" }],
      ["en-US", { currency: "BHD" }],
      ["en-US", { currency: "USD", currencyDisplay: "code" }],
      ["en-US", { currency: "USD", currencyDisplay: "name" }],
      ["en-US", { currency: "USD", currencySign: "accounting" }],
      ["de-DE", { currency: "EUR", currencySign: "accounting" }],
      ["en-US", { unit: "kg" }],
      ["de-DE", { unit: "kg" }],
      ["fr-FR", { unit: "%" }],
      ["ar-EG", { unit: "GB" }],
      ["ja-JP", { unit: "ms" }],
      ["en-US", { unit: "kilometer-per-hour", unitDisplay: "long" }],
      ["en-US", {}],
      ["de-DE", {}],
      ["en-US", { useGrouping: false, currency: "USD" }],
    ];
    const values = [
      "0",
      "1",
      "12",
      "123",
      "1234",
      "12345",
      "123456",
      "1234567",
      "1234567890",
      "0.5",
      "1.5",
      "1234.5",
      "1234.56",
      "123456.78",
      "0.12",
      "0.123",
      "1.234",
      "123.456",
      "-1",
      "-1234.56",
      "-0.5",
    ];
    const failures: string[] = [];
    for (const [locale, options] of specs) {
      const f = make(locale, { ...options, allowNegative: true });
      for (const raw of values) {
        const expected = f.fromValue(raw);
        const text = f.format(raw);
        const parsed = f.parse(text);
        if (!parsed || parsed.value !== f.toValue(f.finalize(expected))) {
          failures.push(
            `${locale} ${JSON.stringify(options)} ${raw} -> ${JSON.stringify(text)} -> ${JSON.stringify(parsed)}`,
          );
        }
        // The field's own text is read back by `scan` as well.
        if (f.scan(text).raw !== f.finalize(expected)) {
          failures.push(
            `scan ${locale} ${JSON.stringify(options)} ${raw} -> ${JSON.stringify(text)} -> ${f.scan(text).raw}`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("typing", () => {
  it.each([
    // Grouping appears as digits are typed, and the caret stays at the end.
    ["en-US", { currency: "USD" }, "1234567.891", "$1,234,567.89|"],
    ["de-DE", { currency: "EUR" }, "1234567,89", nb("1.234.567,89| €")],
    // `.` is a decimal key in every locale, like a numpad.
    ["de-DE", { currency: "EUR" }, "1234567.89", nb("1.234.567,89| €")],
    ["en-US", { currency: "USD" }, "1234567,89", "$1,234,567.89|"],
    ["en-IN", { currency: "INR" }, "123456789.5", "₹12,34,56,789.5|"],
    [
      "fr-FR",
      { currency: "EUR" },
      "1234.5",
      `1${String.fromCodePoint(0x202f)}234,5|${NBSP}€`,
    ],
    ["ja-JP", { currency: "JPY" }, "12345.6", "￥123,456|"],
    ["en-US", { currency: "BHD" }, "1.2345", nb("BHD 1.234|")],
    ["en-US", { unit: "kg" }, "12.5", "12.5| kg"],
    ["en-US", { unit: "%" }, "99.5", "99.5|%"],
    ["de-DE", { unit: "%" }, "12,5", nb("12,5| %")],
    ["en-US", { unit: "ms" }, "1500", "1,500| ms"],
    // Letters, spaces, group marks and exponents are refused.
    ["en-US", { currency: "USD" }, "1a2 3x4e5", "$12,345|"],
    // A second decimal mark steps over the first.
    ["en-US", { currency: "USD" }, "1.5.5", "$1.55|"],
    // Leading zeros fold.
    ["en-US", { currency: "USD" }, "007", "$7|"],
    ["en-US", { currency: "USD" }, "0.05", "$0.05|"],
    ["en-US", { currency: "USD" }, ".5", "$0.5|"],
    // Fraction digits past the currency's are refused.
    ["en-US", { currency: "USD" }, "1.2345", "$1.23|"],
    ["ja-JP", { currency: "JPY" }, "1.5", "￥15|"],
  ] as [string, NumberFormatOptions, string, string][])(
    "%s %j typing %s",
    (locale, options, keys, expected) => {
      expect(typed(make(locale, options), keys)).toBe(expected);
    },
  );

  it("takes the minus key where negatives are allowed and toggles it", () => {
    expect(typed(USD, "-12.5")).toBe("-$12.5|");
    expect(typed(USD, "12-")).toBe("-$12|");
    expect(typed(USD, "--12")).toBe("$12|");
    expect(typed(EUR_DE, "-12,5")).toBe(nb("-12,5| €"));
    expect(
      typed(make("sv-SE", { currency: "SEK", allowNegative: true }), "-12"),
    ).toBe(`${MINUS}12|${NBSP}kr`);
    expect(typed(make("en-US", { currency: "USD" }), "-12")).toBe("$12|");
  });

  it("writes a negative amount in brackets when the format does", () => {
    const acc = make("en-US", {
      currency: "USD",
      currencySign: "accounting",
      allowNegative: true,
    });
    expect(typed(acc, "-12.5")).toBe("($12.5|)");
    expect(typed(acc, "12-")).toBe("($12|)");
    expect(typed(acc, "(12")).toBe("($12|)");
  });

  it("writes Arabic-Indic digits for ar-EG and takes digits of any script", () => {
    const f = make("ar-EG", { currency: "EGP", allowNegative: true });
    const out = typed(f, "1234.5");
    expect(out).toContain(arabic("1"));
    expect(out).toContain(arabic("234"));
    expect(out).toContain(`${arabic("5")}|`);
    expect(typed(f, arabic("1234"))).toBe(typed(f, "1234"));
    expect(typed(make("ja-JP", { currency: "JPY" }), fullwidth("1234"))).toBe(
      "￥1,234|",
    );
  });

  it("refuses an integer past the digit limit", () => {
    const f = make("en-US", { currency: "USD", maxIntegerDigits: 3 });
    expect(typed(f, "12345")).toBe("$123|");
  });
});

describe("editing", () => {
  it("Backspace removes the digit before a group mark and never stops on it", () => {
    expect(run(USD, "$1,234|", backspace)).toBe("$123|");
    expect(run(USD, "$1,|234", backspace)).toBe("$|234");
    expect(run(USD, "$12,|345", backspace)).toBe("$1|,345");
    expect(run(USD, "$1,234,5|67", backspace)).toBe("$123,4|67");
    expect(run(EUR_DE, nb("1.|234,56 €"), backspace)).toBe(nb("|234,56 €"));
  });

  it("Backspace walks a field empty", () => {
    let state = "$1,234.5|0";
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      state = run(USD, state.replace(/!$/, ""), backspace);
      seen.push(state);
    }
    // The step back over the decimal mark is a move of the caret only.
    expect(seen).toEqual([
      "$1,234.|0",
      "$1,234|.0!",
      "$123|.0",
      "$12|.0",
      "$1|.0",
      "$|0.0",
      "$|0.0!",
      "$|0.0!",
    ]);
  });

  it("Delete removes the digit after a group mark", () => {
    expect(run(USD, "$1|,234", del)).toBe("$1|34");
    expect(run(USD, "$1,|234", del)).toBe("$1|34");
    expect(run(USD, "$|1,234", del)).toBe("$|234");
    expect(run(USD, "$1,234|", del)).toBe("$1,234|!");
  });

  it("does not fold the fraction into the integer part by accident", () => {
    // Backspace after the decimal mark steps back over it; Delete steps over it.
    expect(run(USD, "$1,234.|50", backspace)).toBe("$1,234|.50!");
    expect(run(USD, "$1,234|.50", del)).toBe("$1,234.|50!");
    // With nothing after it, the mark goes.
    expect(run(USD, "$1,234.|", backspace)).toBe("$1,234|");
  });

  it("types in the middle and keeps the caret among the digits", () => {
    expect(run(USD, "$1|,234", type("9"))).toBe("$19|,234");
    expect(run(USD, "$1,23|4", type("9"))).toBe("$12,39|4");
    expect(run(USD, "$|1,234", type("9"))).toBe("$9|1,234");
    expect(run(USD, "$999|", type("9"))).toBe("$9,999|");
    expect(run(USD, "$9,999|", type("9"))).toBe("$99,999|");
    expect(run(EUR_DE, nb("1.234|,56 €"), type("9"))).toBe(nb("12.349|,56 €"));
    expect(
      run(make("en-IN", { currency: "INR" }), "₹1,23,456|", type("7")),
    ).toBe("₹12,34,567|");
  });

  it("refuses a digit the field has no room for and pushes nothing out", () => {
    expect(run(USD, "$1,234.5|0", type("9"))).toBe("$1,234.5|0!");
    expect(run(USD, "$1,234.50|", type("9"))).toBe("$1,234.50|!");
    expect(run(USD, "$1,234.|50", type("9"))).toBe("$1,234.|50!");
    // Digits in the integer part still go in.
    expect(run(USD, "$1,23|4.50", type("9"))).toBe("$12,39|4.50");
    expect(
      run(
        make("en-US", { currency: "USD", maxIntegerDigits: 4 }),
        "$1,234|.50",
        type("9"),
      ),
    ).toBe("$1,234|.50!");
  });

  it("replaces a selection", () => {
    expect(run(USD, "[$1,234.50]", type("7"))).toBe("$7|");
    expect(run(USD, "$1,[234].50", type("9"))).toBe("$19|.50");
    expect(run(USD, "$[1,2]34", type("9"))).toBe("$9|34");
    expect(run(USD, "$1,[234.50]", type("."))).toBe("$1.|");
    expect(run(USD, "[$1,234.50]", backspace)).toBe("|");
    expect(run(USD, "$1,[234],567", backspace)).toBe("$1|,567");
    // A selection of only the symbol removes nothing.
    expect(run(USD, "[$]1,234", backspace)).toBe("|$1,234!");
  });

  it("steps over a decimal mark that is ahead and refuses a second one", () => {
    expect(run(USD, "$1,234|.50", type("."))).toBe("$1,234.|50!");
    expect(run(USD, "$1|,234.50", type("."))).toBe("$1,234.|50!");
    expect(run(USD, "$1,234.5|0", type("."))).toBe("$1,234.5|0!");
    expect(run(EUR_DE, nb("1.234|,50 €"), type(","))).toBe(nb("1.234,|50 €!"));
  });

  it("starts a fraction from nothing", () => {
    expect(run(USD, "|", type("."))).toBe("$0.|");
    expect(run(USD, "$0|", type("5"))).toBe("$5|");
    expect(run(USD, "$0|", type("0"))).toBe("$0|!");
    expect(run(make("ja-JP", { currency: "JPY" }), "|", type("."))).toBe("|!");
  });

  it("takes the sign through the caret", () => {
    expect(run(USD, "$12|", type("-"))).toBe("-$12|");
    expect(run(USD, "$1|2", type("-"))).toBe("-$1|2");
    expect(run(USD, "-$1|2", type("-"))).toBe("$1|2");
    expect(run(USD, "-$12|", backspace)).toBe("-$1|");
    expect(run(USD, "|-$12", type("5"))).toBe("-$5|12");
    expect(run(USD, "-|$12", type("5"))).toBe("-$5|12");
    expect(run(USD, "-$|12", backspace)).toBe("$|12");
  });

  it("keeps the caret inside brackets for an accounting amount", () => {
    const acc = make("en-US", {
      currency: "USD",
      currencySign: "accounting",
      allowNegative: true,
    });
    expect(run(acc, "($1,234|)", backspace)).toBe("($123|)");
    expect(run(acc, "($1|,234)", type("5"))).toBe("($15|,234)");
    expect(run(acc, "($|1)", backspace)).toBe("$|1");
    expect(run(acc, "$1,234|", type("-"))).toBe("($1,234|)");
  });

  it("deletes by word and by line", () => {
    expect(run(USD, "$1,234.5|0", wordBack)).toBe("$1,234.|0");
    expect(run(USD, "$1,23|4.50", wordBack)).toBe("$|4.50");
    expect(run(USD, "$1,234|.50", wordForward)).toBe("$1,234|");
    expect(run(USD, "$1,|234.50", wordForward)).toBe("$1|.50");
    expect(run(USD, "$1,234.5|0", lineBack)).toBe("$|0");
    expect(run(USD, "-$1,2|34", wordBack)).toBe("-$|34");
  });

  it("does nothing at the edges", () => {
    expect(run(USD, "$|1,234", backspace)).toBe("$|1,234!");
    expect(run(USD, "|", backspace)).toBe("|!");
    expect(run(USD, "|", del)).toBe("|!");
  });

  it("pastes a number from any locale, whole or into the middle", () => {
    expect(run(EUR_DE, "|", type("1,234.56"))).toBe(nb("1.234,56| €"));
    expect(run(USD, "|", type("1.234,56"))).toBe("$1,234.56|");
    expect(run(USD, "|", type("€ 1 234,56"))).toBe("$1,234.56|");
    expect(run(USD, "|", type("(1,234.56)"))).toBe("-$1,234.56|");
    expect(run(USD, "[$1,234.50]", type("99.99"))).toBe("$99.99|");
    expect(run(USD, "$1|,234", type("56"))).toBe("$156|,234");
    // Text that is not a number changes nothing.
    expect(run(USD, "$1|,234", type("12abc"))).toBe("$1|,234!");
    expect(run(USD, "$1|,234", type("1e5"))).toBe("$1|,234!");
    // A paste with a decimal mark does not make a second one.
    expect(run(USD, "$1,234.5|0", type("9.99"))).toBe("$1,234.5|0!");
  });

  it("pastes a long amount whole", () => {
    expect(run(USD, "|", type("123456789012345.67"))).toBe(
      "$123,456,789,012,345.67|",
    );
  });
});

describe("conform", () => {
  it("formats text the browser edited, keeping the caret among the digits", () => {
    const r = USD.conform("$1234.5", 4);
    expect(r.value).toBe("$1,234.5");
    // After the "3", which has a group mark in front of it now.
    expect(r.caret).toBe(r.value.indexOf("3") + 1);
  });

  it("reads autofill and a drop the way a person writes it", () => {
    expect(EUR_DE.conform("1234.56", 7).value).toBe(nb("1.234,56 €"));
    expect(EUR_DE.conform("1,234.56", 8).value).toBe(nb("1.234,56 €"));
    expect(
      make("ja-JP", { currency: "JPY" }).conform(fullwidth("1234"), 4).value,
    ).toBe("￥1,234");
    expect(USD.conform("abc", 3).value).toBe("");
    expect(USD.conform("1e5", 3).value).toBe("$15");
  });

  it("pads the fraction digits when the field is left", () => {
    expect(USD.conform("$1.5", 4, true).value).toBe("$1.50");
    expect(USD.conform("$1.", 3, true).value).toBe("$1.00");
    expect(USD.conform("$", 1, true).value).toBe("");
    expect(USD.conform("-$0", 3, true).value).toBe("$0.00");
    expect(make("en-US", { unit: "kg" }).conform("5.", 2, true).value).toBe(
      "5 kg",
    );
  });

  it("leaves text it wrote alone", () => {
    for (const text of ["$1,234.56", "-$1,234.5", "$0.", "$12,345"]) {
      expect(USD.conform(text, text.length).value).toBe(text);
    }
  });

  it("drops a sign the field does not take", () => {
    expect(make("en-US", { currency: "USD" }).conform("-12", 3).value).toBe(
      "$12",
    );
  });
});

describe("value", () => {
  it("is a decimal string that has the digits that were entered", () => {
    expect(USD.toValue("1234.50")).toBe("1234.50");
    expect(USD.toValue("1.")).toBe("1");
    expect(USD.toValue("-")).toBe("");
    expect(USD.toValue("")).toBe("");
    expect(USD.toValue("-0.00")).toBe("0.00");
  });

  it("reads a bound number or string", () => {
    expect(USD.fromValue(1234.5)).toBe("1234.5");
    expect(USD.fromValue("1234.50")).toBe("1234.50");
    expect(USD.fromValue(" 12 ")).toBe("12");
    expect(USD.fromValue("1e5")).toBe("");
    expect(USD.fromValue("1,5")).toBe("");
    expect(USD.fromValue("007")).toBe("7");
    expect(USD.fromValue(".5")).toBe("0.5");
    expect(USD.fromValue("1.005")).toBe("1.01");
    expect(USD.fromValue(null)).toBe("");
  });

  it("is exact where a double is not", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(USD.fromValue("0.30")).toBe("0.30");
    expect(compareDecimal("0.1", "0.10")).toBe(0);
    expect(toMinorUnits("0.30", 2)).toBe(30);
    expect(toMinorUnits(0.1 + 0.2, 2)).toBe(30);
    expect(USD.format("9007199254740993.01")).toBe("$9,007,199,254,740,993.01");
  });
});

describe("decimal helpers", () => {
  it("expands a number with an exponent", () => {
    expect(numberToDecimal(1e21)).toBe("1000000000000000000000");
    expect(numberToDecimal(1e-7)).toBe("0.0000001");
    expect(numberToDecimal(-1.5e-9)).toBe("-0.0000000015");
    expect(numberToDecimal(1.2345e25)).toBe("12345000000000000000000000");
    expect(numberToDecimal(0.1 + 0.2)).toBe("0.30000000000000004");
    expect(numberToDecimal(Number.NaN)).toBe("");
    expect(numberToDecimal(Number.POSITIVE_INFINITY)).toBe("");
  });

  it.each([
    ["1.005", 2, "1.01"],
    ["1.004", 2, "1.00"],
    ["0.995", 2, "1.00"],
    ["-1.005", 2, "-1.01"],
    ["9.999", 2, "10.00"],
    ["99.9", 0, "100"],
    ["0.5", 0, "1"],
    ["0.4", 0, "0"],
    ["1.5", 2, "1.5"],
    ["12", 2, "12"],
    ["0.0005", 3, "0.001"],
  ])("roundDecimal(%s, %d) = %s", (value, digits, expected) => {
    expect(roundDecimal(value, digits)).toBe(expected);
  });

  it.each([
    ["1", "2", -1],
    ["2", "1", 1],
    ["1.0", "1", 0],
    ["0.1", "0.10", 0],
    ["-1", "1", -1],
    ["-2", "-1", -1],
    ["-0", "0", 0],
    ["-0.00", "0", 0],
    ["10", "9", 1],
    ["9.99", "10", -1],
    ["123456789012345678", "123456789012345679", -1],
    ["0.000000000000000001", "0", 1],
    ["-0.000000000000000001", "0", -1],
  ])("compareDecimal(%s, %s) = %d", (a, b, expected) => {
    expect(compareDecimal(a, b)).toBe(expected);
  });

  it("checks a step without floating point", () => {
    expect(isMultipleOf("0.30", "0.05")).toBe(true);
    expect(isMultipleOf("0.3", "0.1")).toBe(true);
    expect(isMultipleOf("0.35", "0.1")).toBe(false);
    expect(isMultipleOf("10", "5")).toBe(true);
    expect(isMultipleOf("-10", "5")).toBe(true);
    expect(isMultipleOf("1", "0")).toBe(true);
    expect(0.3 % 0.1).not.toBe(0);
  });

  it("converts to and from minor units for each currency", () => {
    expect(toMinorUnits("12.34", 2)).toBe(1234);
    expect(toMinorUnits("-12.34", 2)).toBe(-1234);
    expect(toMinorUnits("12", 2)).toBe(1200);
    expect(toMinorUnits("1235", 0)).toBe(1235);
    expect(toMinorUnits("1.5", 3)).toBe(1500);
    expect(toMinorUnits("0.005", 2)).toBe(1);
    expect(toMinorUnits("-0.001", 2)).toBe(0);
    expect(toMinorUnits("90071992547409.93", 2)).toBe(null);
    expect(toMinorUnits("abc", 2)).toBe(null);
    expect(fromMinorUnits(1234, 2)).toBe("12.34");
    expect(fromMinorUnits(-5, 2)).toBe("-0.05");
    expect(fromMinorUnits(1235, 0)).toBe("1235");
    expect(fromMinorUnits(1500, 3)).toBe("1.500");
  });
});

describe("direction and names", () => {
  it("follows the script of the locale", () => {
    expect(make("en-US", { currency: "USD" }).direction).toBe("ltr");
    expect(make("de-DE", { currency: "EUR" }).direction).toBe("ltr");
    expect(make("ja-JP", { currency: "JPY" }).direction).toBe("ltr");
    expect(make("ar-EG", { currency: "EGP" }).direction).toBe("rtl");
    expect(make("he-IL", { currency: "ILS" }).direction).toBe("rtl");
    expect(make("fa-IR", { currency: "IRR" }).direction).toBe("rtl");
  });

  it("names the currency and the unit for assistive technology", () => {
    expect(make("en-US", { currency: "EUR" }).name()).toBe("Euro");
    expect(make("de-DE", { currency: "EUR" }).name()).toBe("Euro");
    expect(make("en-US", { unit: "kg" }).name()).toBe("kilograms");
    expect(make("en-US", { unit: "%" }).name()).toMatch(/percent/);
    expect(make("en-US", {}).name()).toBe("");
  });

  it("probes the marks from the style, not from plain numbers", () => {
    expect(make("de-DE", { currency: "EUR" }).decimal).toBe(",");
    expect(make("de-DE", { currency: "EUR" }).group).toBe(".");
    expect(make("en-IN", { currency: "INR" }).group).toBe(",");
    expect(make("ar-EG", { currency: "EGP" }).decimal).toBe(
      String.fromCodePoint(0x66b),
    );
    expect(make("ja-JP", { currency: "JPY" }).maximumFractionDigits).toBe(0);
    expect(make("en-US", { currency: "BHD" }).maximumFractionDigits).toBe(3);
    expect(make("en-US", { currency: "USD" }).accounting).toBe(false);
    expect(
      make("en-US", { currency: "USD", currencySign: "accounting" }).accounting,
    ).toBe(true);
  });
});
