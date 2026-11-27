// @vitest-environment node
// The last test reads the library's source files.
// @depends-on src/FormulaInput/*.js
import { readFileSync } from "node:fs";
import {
  evaluateFormula,
  formatResult,
} from "../../src/FormulaInput/formula-eval.js";
import {
  defaultFunctions,
  type FormulaFunction,
} from "../../src/FormulaInput/formula-functions.js";

const fields = [
  { id: "price", label: "Unit price", type: "number" as const },
  { id: "qty", type: "number" as const },
  { id: "status", type: "string" as const },
  { id: "note" },
];
const row = { price: 100, qty: 3, status: "open", note: null };

const run = (source: string, options = {}) =>
  evaluateFormula(source, { row, fields, ...options });

const value = (source: string, options = {}) => {
  const result = run(source, options);
  if (!result.ok)
    throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

const failure = (source: string, options = {}) => {
  const result = run(source, options);
  if (result.ok) throw new Error(`expected an error, got ${result.value}`);
  return result.error;
};

describe("evaluateFormula", () => {
  it("evaluates the pricing example", () => {
    expect(value('IF(status = "open", price * 1.2, ROUND(price, 2))')).toBe(
      120,
    );
    expect(value('IF(status = "closed", price * 1.2, ROUND(price, 2))')).toBe(
      100,
    );
  });

  it("reads fields by id, by label and in braces", () => {
    expect(value("{Unit price} * qty")).toBe(300);
    expect(value("{price} - {qty}")).toBe(97);
  });

  it("treats a missing value as blank", () => {
    expect(value("note")).toBeNull();
    expect(value("ISBLANK(note)")).toBe(true);
    expect(value("note + 1")).toBe(1);
    expect(value('note & "x"')).toBe("x");
    expect(value('COALESCE(note, "fallback")')).toBe("fallback");
  });

  it("rounds a spreadsheet's way", () => {
    expect(value("ROUND(1.005, 2)")).toBe(1.01);
    expect(value("ROUND(-2.5)")).toBe(-3);
    expect(value("ROUND(1234.5, -2)")).toBe(1200);
    expect(value("0.1 + 0.2 = 0.3")).toBe(true);
  });

  it("compares text without regard to case, and blank with empty", () => {
    expect(value('status = "OPEN"')).toBe(true);
    expect(value('status <> "open"')).toBe(false);
    expect(value('note = ""')).toBe(true);
    expect(value("note = 0")).toBe(true);
    expect(value('"a" < "B"')).toBe(true);
  });

  it("short-circuits and, or, if and iferror", () => {
    expect(value("false && 1/0")).toBe(false);
    expect(value("true || 1/0")).toBe(true);
    expect(value("IF(true, 1, 1/0)")).toBe(1);
    expect(value("IFERROR(1/0, 7)")).toBe(7);
    expect(value("AND(false, 1/0)")).toBe(false);
  });

  it.each([
    ["LEN(status)", 4],
    ['UPPER(status) & "!"', "OPEN!"],
    ['LEFT("abcdef", 2) & RIGHT("abcdef", 2)', "abef"],
    ['MID("abcdef", 2, 3)', "bcd"],
    ['SUBSTITUTE("a-b-c", "-", "+")', "a+b+c"],
    ['CONTAINS("Hello", "ELL")', true],
    ["MOD(-7, 3)", 2],
    ["MAX(1, 5, 3) - MIN(2, 4)", 3],
    ["SUM(1, 2, 3) / AVERAGE(2, 4)", 2],
    ['VALUE("12.5") + 1', 13.5],
    ['CONCAT(1, TRUE, "x")', "1TRUEx"],
    ["2 ^ 3 ^ 2", 512],
    ["-2 ^ 2", -4],
    ["10 % 4", 2],
  ])("%s is %j", (source, expected) => {
    expect(value(source)).toBe(expected);
  });

  describe("errors", () => {
    it("reports division by zero, with the range", () => {
      expect(failure("1 / 0")).toMatchObject({
        code: "div0",
        start: 0,
        end: 5,
      });
      expect(failure("MOD(1, 0)").code).toBe("div0");
    });

    it("reports a result that is not a number", () => {
      expect(failure("SQRT(-1)").code).toBe("num");
      expect(failure("10 ^ 400").code).toBe("num");
      expect(failure("10 ^ 308 * 10").code).toBe("num");
    });

    it("reports text where a number is needed", () => {
      expect(failure('"a" * 2', { fields: null }).code).toBe("syntax");
      expect(failure('VALUE("zz")').code).toBe("value");
    });

    it("refuses a formula with syntax errors", () => {
      expect(failure("1 +")).toMatchObject({ code: "syntax" });
      expect(failure("nope + 1")).toMatchObject({ code: "syntax" });
    });

    it("refuses a value a formula cannot hold", () => {
      expect(
        failure("note", { row: { note: { toString: () => "x" } } }).code,
      ).toBe("value");
    });
  });

  describe("hostile input", () => {
    it("stops a formula of a million terms at the step limit", () => {
      const started = performance.now();
      const error = failure(`${"1+".repeat(500000)}1`, { maxTime: 1000 });

      expect(error.code).toBe("limit");
      expect(performance.now() - started).toBeLessThan(3000);
    });

    it("stops text built past the limit before building it", () => {
      expect(failure('REPT("abc", 1000000000)').code).toBe("limit");
      expect(
        failure('REPT("abc", 40000)', { maxStringLength: 100000 }).code,
      ).toBe("limit");
      expect(
        failure('SUBSTITUTE(REPT("a", 50000), "a", REPT("b", 50000))').code,
      ).toBe("limit");
    });

    it("charges for joining long text", () => {
      const long = "x".repeat(90000);
      const source = Array.from({ length: 200 }, () => "s").join(" & ");

      expect(failure(source, { row: { s: long }, fields: null }).code).toBe(
        "limit",
      );
    });

    it("stops at the time limit", () => {
      const slow: FormulaFunction = {
        name: "SLOW",
        params: [],
        evaluate: () => {
          const until = performance.now() + 5;
          while (performance.now() < until);
          return 1;
        },
      };
      const source = Array.from({ length: 100 }, () => "SLOW()").join(" + ");
      const result = evaluateFormula(source, {
        functions: [...defaultFunctions, slow],
        maxTime: 30,
        maxSteps: 1e9,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && result.error.code).toBe("timeout");
    });

    it("does not overflow the stack on deep nesting", () => {
      expect(failure("(".repeat(10000) + "1" + ")".repeat(10000)).code).toBe(
        "syntax",
      );
      expect(failure("-".repeat(100000) + "1").code).toBe("syntax");
      expect(failure(`${"f(".repeat(5000)}1${")".repeat(5000)}`).code).toBe(
        "syntax",
      );
    });

    it("walks the deepest tree the parser allows", () => {
      const depth = 120;
      const source = "(".repeat(depth) + "1" + ")".repeat(depth);

      expect(value(source, { maxDepth: 128 })).toBe(1);
    });

    it("handles huge numbers", () => {
      expect(failure("9".repeat(400)).code).toBe("syntax");
      expect(failure("1e999").code).toBe("syntax");
      expect(value("1e300 / 1e300")).toBe(1);
      expect(value(`${"9".repeat(300)} > 1`)).toBe(true);
    });

    it("never reads a property a row does not own", () => {
      for (const name of [
        "__proto__",
        "constructor",
        "toString",
        "hasOwnProperty",
      ]) {
        expect(value(`{${name}}`, { fields: null })).toBeNull();
      }
      expect(failure("{constructor}").code).toBe("syntax");
    });

    it("turns a throwing function into an error", () => {
      const boom: FormulaFunction = {
        name: "BOOM",
        params: [],
        evaluate: () => {
          throw new Error("secret detail");
        },
      };
      const result = evaluateFormula("BOOM()", {
        functions: [boom],
      });

      expect(result).toMatchObject({
        ok: false,
        error: { code: "error", message: "BOOM failed" },
      });
    });

    it("has no way to run text as code", () => {
      for (const file of [
        "formula-lang",
        "formula-check",
        "formula-eval",
        "formula-functions",
        "formula-suggest",
        "formula-highlight",
      ]) {
        const code = readFileSync(
          new URL(`../../src/FormulaInput/${file}.js`, import.meta.url),
          "utf8",
        ).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

        expect(code).not.toMatch(
          /\beval\s*\(|new\s+Function|\bFunction\s*\(|\bimport\s*\(|\bsetTimeout|\bwith\s*\(/,
        );
      }
    });
  });
});

describe("formatResult", () => {
  it("shows text in quotes, booleans in capitals and blank as such", () => {
    expect(formatResult("a")).toBe('"a"');
    expect(formatResult(true)).toBe("TRUE");
    expect(formatResult(null)).toBe("(blank)");
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
    expect(formatResult(12)).toBe("12");
  });
});
