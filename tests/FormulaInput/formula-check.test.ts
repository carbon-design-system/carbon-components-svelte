// @vitest-environment node
import {
  analyzeFormula,
  closestName,
  createFormulaEnv,
  resolveField,
  walkFormula,
} from "../../src/FormulaInput/formula-check.js";
import {
  arity,
  defaultFunctions,
  formatSignature,
  paramIndexAt,
} from "../../src/FormulaInput/formula-functions.js";

const fields = [
  { id: "price", label: "Unit price", type: "number" as const },
  { id: "qty", type: "number" as const },
  { id: "status", label: "Status", type: "string" as const },
  { id: "paid", type: "boolean" as const },
  { id: "note" },
];

const env = createFormulaEnv(defaultFunctions, fields);
const messages = (source: string) =>
  analyzeFormula(source, { env }).diagnostics.map((d) => d.message);

describe("analyzeFormula", () => {
  it("accepts a valid formula and infers its type", () => {
    expect(analyzeFormula("price * qty", { env })).toMatchObject({
      diagnostics: [],
      type: "number",
    });
    expect(analyzeFormula('status & "!"', { env }).type).toBe("string");
    expect(analyzeFormula("price > 3", { env }).type).toBe("boolean");
    expect(analyzeFormula("note", { env }).type).toBe("any");
  });

  it("merges syntax and semantic errors in source order", () => {
    const { diagnostics } = analyzeFormula("FOO(1) + (2", { env });

    expect(diagnostics.map((d) => d.code)).toEqual([
      "unknown-function",
      "unclosed-paren",
    ]);
  });

  describe("names", () => {
    it("resolves a field by id or by label, ignoring case", () => {
      expect(messages("price + qty")).toEqual([]);
      expect(messages("{Unit price} + {QTY}")).toEqual([]);
      expect(resolveField(env, "unit PRICE")?.id).toBe("price");
    });

    it("reports an unknown field, with a suggestion for a typo", () => {
      expect(messages("prise")).toEqual([
        'Unknown field "prise". Did you mean "price"?',
      ]);
      expect(messages("{zzzzzz}")).toEqual(['Unknown field "zzzzzz"']);
    });

    it("accepts any name when the fields are not given", () => {
      expect(analyzeFormula("anything + {else}").diagnostics).toEqual([]);
    });
  });

  describe("functions", () => {
    it("reports an unknown function, with a suggestion for a typo", () => {
      expect(messages("ROUDN(price)")).toEqual([
        'Unknown function "ROUDN". Did you mean ROUND?',
      ]);
    });

    it("matches function names without regard to case", () => {
      expect(messages("round(price, 2)")).toEqual([]);
    });

    it.each([
      ["ROUND()", "ROUND expects 1 to 2 arguments, got 0"],
      ["ROUND(price, 1, 2)", "ROUND expects 1 to 2 arguments, got 3"],
      ["PI(1)", "PI expects 0 arguments, got 1"],
      ["IF(paid)", "IF expects 2 to 3 arguments, got 1"],
      ["MAX()", "MAX expects at least 1 argument, got 0"],
    ])("reports the argument count of %s", (source, message) => {
      expect(messages(source)).toEqual([message]);
    });

    it("puts a count error on the extra arguments, or the closing paren", () => {
      const extra = analyzeFormula("ROUND(price, 1, 2, 3)", { env });
      const missing = analyzeFormula("IF(paid)", { env });

      expect([extra.diagnostics[0].start, extra.diagnostics[0].end]).toEqual([
        16, 20,
      ]);
      expect([
        missing.diagnostics[0].start,
        missing.diagnostics[0].end,
      ]).toEqual([7, 8]);
    });

    it("does not count arguments while the call is still open", () => {
      expect(
        analyzeFormula("ROUND(", { env }).diagnostics.map((d) => d.code),
      ).toEqual(["unclosed-paren"]);
      expect(
        analyzeFormula("IF(paid", { env }).diagnostics.map((d) => d.code),
      ).toEqual(["unclosed-paren"]);
    });

    it("lets a later function replace a built-in", () => {
      const custom = createFormulaEnv([
        ...defaultFunctions,
        { name: "round", params: [], returns: "string" },
      ]);

      expect(analyzeFormula("ROUND()", { env: custom })).toMatchObject({
        diagnostics: [],
        type: "string",
      });
    });
  });

  describe("types", () => {
    it("reports an argument of the wrong type", () => {
      expect(messages("ROUND(status)")).toEqual([
        'ROUND: "number" needs a number but got text',
      ]);
      expect(messages("UPPER(price)")).toEqual([
        'UPPER: "text" needs text but got number',
      ]);
    });

    it("reports an operand of the wrong type, with a hint for +", () => {
      expect(messages("status * 2")).toEqual([
        '"*" needs a number but got text',
      ]);
      expect(messages('"a" + 1')).toEqual([
        '"+" needs a number but got text. Use & to join text',
      ]);
      expect(messages("-status")).toEqual(['"-" needs a number but got text']);
    });

    it("reports a comparison of different types", () => {
      expect(messages('price = "open"')).toEqual([
        "Cannot compare number with text",
      ]);
      expect(messages("price > qty")).toEqual([]);
    });

    it("lets an unknown type pass", () => {
      expect(messages("note * 2")).toEqual([]);
      expect(messages('note = "a"')).toEqual([]);
    });

    it("types through groups and call results", () => {
      expect(messages("(status) * 2")).toHaveLength(1);
      expect(messages('LEN(status) * 2 + ROUND(price) & "x"')).toEqual([]);
      expect(messages("UPPER(status) * 2")).toHaveLength(1);
    });
  });

  it("keeps a bounded number of semantic errors, quickly", () => {
    const source = Array.from({ length: 20000 }, (_, i) => `n${i}`).join(" + ");
    const started = performance.now();
    const { diagnostics } = analyzeFormula(source, { env });

    expect(diagnostics.length).toBeLessThanOrEqual(100);
    expect(performance.now() - started).toBeLessThan(2000);
  });
});

describe("walkFormula", () => {
  it("visits children before parents, and survives a very deep tree", () => {
    const { ast } = analyzeFormula(`${"1+".repeat(60000)}1`);
    let count = 0;

    walkFormula(ast!, () => {
      count++;
    });

    expect(count).toBe(120001);
  });
});

describe("functions", () => {
  it("counts the arguments a function takes", () => {
    const get = (name: string) =>
      defaultFunctions.find((fn) => fn.name === name)!;

    expect(arity(get("ROUND"))).toEqual({ min: 1, max: 2 });
    expect(arity(get("SUM"))).toEqual({ min: 1, max: Infinity });
    expect(arity(get("PI"))).toEqual({ min: 0, max: 0 });
  });

  it("maps an argument to its parameter, repeating the rest parameter", () => {
    const sum = defaultFunctions.find((fn) => fn.name === "SUM")!;
    const round = defaultFunctions.find((fn) => fn.name === "ROUND")!;

    expect([0, 1, 5].map((i) => paramIndexAt(sum, i))).toEqual([0, 0, 0]);
    expect([0, 1, 2].map((i) => paramIndexAt(round, i))).toEqual([0, 1, -1]);
  });

  it("formats a signature with the range of each parameter", () => {
    const round = defaultFunctions.find((fn) => fn.name === "ROUND")!;
    const { text, params } = formatSignature(round);

    expect(text).toBe("ROUND(number, [digits])");
    expect(text.slice(params[1].start, params[1].end)).toBe("[digits]");
    expect(
      formatSignature({ name: "F", params: [{ name: "a", rest: true }] }).text,
    ).toBe("F(...a)");
  });

  it("finds the nearest name only when it is close enough to be a typo", () => {
    expect(closestName("pirce", ["price", "qty"])).toBe("price");
    expect(closestName("zzz", ["price", "qty"])).toBeUndefined();
  });
});
