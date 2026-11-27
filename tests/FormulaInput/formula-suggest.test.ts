// @vitest-environment node
import { createFormulaEnv } from "../../src/FormulaInput/formula-check.js";
import { defaultFunctions } from "../../src/FormulaInput/formula-functions.js";
import { tokenize } from "../../src/FormulaInput/formula-lang.js";
import {
  completionContext,
  getCompletions,
  nextDiagnostic,
  shouldTypeOver,
  signatureHelp,
} from "../../src/FormulaInput/formula-suggest.js";

const env = createFormulaEnv(defaultFunctions, [
  { id: "price", label: "Unit price", type: "number" },
  { id: "status", label: "Status", type: "string" },
  { id: "net revenue", type: "number" },
  { id: "שם", label: "שם הלקוח" },
]);

/** A source with `|` marking the caret. */
const at = (marked: string) => {
  const caret = marked.indexOf("|");
  const source = marked.replaceAll("|", "");
  return { source, caret, tokens: tokenize(source) };
};

const context = (marked: string) => {
  const { source, caret, tokens } = at(marked);
  return completionContext(source, tokens, caret);
};

const inserts = (marked: string, options = {}) => {
  const ctx = context(marked);
  return ctx ? getCompletions(ctx, env, options).map((i) => i.insert) : null;
};

describe("completionContext", () => {
  it("completes a name being typed", () => {
    expect(context("IF(sta|")).toMatchObject({
      kind: "expression",
      query: "sta",
      start: 3,
      end: 6,
    });
    expect(context("ROU|ND(1)")).toMatchObject({ query: "ROU", end: 5 });
  });

  it("completes inside braces, closed or not", () => {
    expect(context("{pri|")).toMatchObject({
      kind: "field",
      query: "pri",
      closed: false,
      start: 1,
      end: 4,
    });
    expect(context("{pri|ce} + 1")).toMatchObject({
      kind: "field",
      query: "pri",
      closed: true,
      start: 1,
      end: 6,
    });
    expect(context("{price}|")).toBeNull();
  });

  it("offers a place where a value could start, with an empty query", () => {
    for (const marked of ["|", "1 + |", "f(|", "f(1, |", "not |", "a and |"]) {
      expect(context(marked), marked).toMatchObject({ query: "" });
    }
  });

  it("offers nothing where an operator belongs, or inside a literal", () => {
    for (const marked of [
      "price |",
      "f(1)|",
      "1|",
      '"ab|c"',
      "price ro|",
      "@|",
    ]) {
      expect(context(marked), marked).toBeNull();
    }
  });
});

describe("getCompletions", () => {
  it("matches functions and fields by prefix, best first", () => {
    expect(inserts("ROU|")).toEqual(["ROUND()"]);
    expect(inserts("st|")).toEqual(["status"]);
  });

  it("matches a field by label or id", () => {
    expect(inserts("Unit|")).toEqual(["price"]);
    expect(inserts("pri|")).toEqual(["price"]);
  });

  it("writes a name that needs braces in braces, and escapes it", () => {
    expect(inserts("net|")).toEqual(["{net revenue}"]);
    expect(inserts("{net|")).toEqual(["net revenue}"]);
    expect(inserts("{net|} + 1")).toEqual(["net revenue"]);
  });

  it("can refer to a field by its label", () => {
    expect(inserts("Unit|", { refBy: "label" })).toEqual(["{Unit price}"]);
  });

  it("keeps a name in any script", () => {
    expect(inserts("{שם|")).toEqual(["שם}"]);
    expect(inserts("ש|")).toEqual(["שם"]);
  });

  it("lists only fields inside braces", () => {
    expect(inserts("{|")).toEqual(expect.not.arrayContaining(["ROUND()"]));
  });

  it("puts the caret inside the parentheses of a function that takes arguments", () => {
    const ctx = context("ROU|")!;
    const [round] = getCompletions(ctx, env);
    const [pi] = getCompletions(context("PI|")!, env);

    expect(round.caret).toBe("ROUND(".length);
    expect(pi.insert).toBe("PI()");
    expect(pi.caret).toBe("PI()".length);
  });

  it("does not add parentheses to a call that has them", () => {
    expect(inserts("ROU|(1)")).toEqual(["ROUND"]);
  });

  it("offers nothing for a field already typed in full", () => {
    expect(inserts("price|")).toEqual([]);
  });

  it("limits the list", () => {
    expect(inserts("|", { limit: 3 })).toHaveLength(3);
  });

  it("gives a function row its signature and a field row its id", () => {
    const [fn] = getCompletions(context("ROU|")!, env);
    const [field] = getCompletions(context("Unit|")!, env);

    expect(fn.detail).toBe("ROUND(number, [digits])");
    expect(field).toMatchObject({
      label: "Unit price",
      detail: "price · number",
    });
  });
});

describe("signatureHelp", () => {
  const help = (marked: string) => {
    const { source, caret, tokens } = at(marked);
    return signatureHelp(tokens, source, caret, env);
  };

  it("finds the call and the argument the caret is in", () => {
    expect(help("ROUND(|")).toMatchObject({ argIndex: 0, activeParam: 0 });
    expect(help("ROUND(price, |")).toMatchObject({
      argIndex: 1,
      activeParam: 1,
    });
    expect(help("ROUND(price, 2|)")?.fn.name).toBe("ROUND");
  });

  it("is not thrown by a nested call or group", () => {
    expect(help("IF(a, ROUND(b, |")?.fn.name).toBe("ROUND");
    expect(help("IF(a, ROUND(b, 1), |")).toMatchObject({
      fn: { name: "IF" },
      argIndex: 2,
    });
    expect(help("IF((a, b|")?.fn.name).toBe("IF");
  });

  it("repeats the rest parameter and flags an extra argument", () => {
    expect(help("SUM(1, 2, 3, |")?.activeParam).toBe(0);
    expect(help("ROUND(1, 2, |")?.activeParam).toBe(-1);
  });

  it("is gone outside the call, in its name, and for an unknown function", () => {
    expect(help("ROUND(1)| + 1")).toBeNull();
    expect(help("ROU|ND(1)")).toBeNull();
    expect(help("NOPE(|")).toBeNull();
    expect(help("(|")).toBeNull();
  });

  it("works on text with errors", () => {
    expect(help('ROUND("a, |')).toMatchObject({ argIndex: 0 });
    expect(help("ROUND(price + , |")?.argIndex).toBe(1);
  });
});

describe("nextDiagnostic", () => {
  const d = (start: number) => ({
    code: "x",
    message: "",
    start,
    end: start + 1,
  });
  const list = [d(2), d(8), d(15)];

  it("finds the next after a position and wraps", () => {
    expect(nextDiagnostic(list, 0)?.start).toBe(2);
    expect(nextDiagnostic(list, 2)?.start).toBe(8);
    expect(nextDiagnostic(list, 15)?.start).toBe(2);
  });

  it("finds the one before, and wraps", () => {
    expect(nextDiagnostic(list, 15, true)?.start).toBe(8);
    expect(nextDiagnostic(list, 2, true)?.start).toBe(15);
  });

  it("finds nothing in an empty list", () => {
    expect(nextDiagnostic([], 0)).toBeNull();
  });
});

describe("shouldTypeOver", () => {
  it("steps over a closing parenthesis only when none is missing", () => {
    expect(shouldTypeOver("f(a)", 3, [])).toBe(true);
    expect(shouldTypeOver("f(a", 3, [])).toBe(false);
    expect(
      shouldTypeOver("f((a)", 4, [
        { code: "unclosed-paren", message: "", start: 1, end: 2 },
      ]),
    ).toBe(false);
  });
});
