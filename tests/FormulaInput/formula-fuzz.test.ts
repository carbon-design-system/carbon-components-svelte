// @vitest-environment node
import {
  analyzeFormula,
  createFormulaEnv,
} from "../../src/FormulaInput/formula-check.js";
import { evaluateFormula } from "../../src/FormulaInput/formula-eval.js";
import { highlightRuns } from "../../src/FormulaInput/formula-highlight.js";
import { parseFormula, tokenize } from "../../src/FormulaInput/formula-lang.js";
import {
  completionContext,
  getCompletions,
  signatureHelp,
} from "../../src/FormulaInput/formula-suggest.js";

const env = createFormulaEnv(undefined, [
  { id: "a", type: "number" },
  { id: "b", label: "B field", type: "string" },
]);

/** A small seeded generator, so a failure can be replayed. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const PIECES = [
  "(",
  ")",
  ",",
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "&",
  "&&",
  "||",
  "<",
  "<=",
  ">",
  ">=",
  "=",
  "<>",
  "!",
  "!=",
  "==",
  "{",
  "}",
  "{a}",
  "{B field}",
  '"',
  "'",
  '"x"',
  "\\",
  "\n",
  " ",
  "  ",
  "\t",
  "0",
  "1",
  "12.5",
  ".",
  "1e",
  "1e9",
  "1e999",
  "a",
  "b",
  "IF",
  "ROUND",
  "SUM",
  "AND",
  "or",
  "not",
  "true",
  "false",
  "IF(",
  "ROUND(a,",
  "FOO(",
  "é",
  "שם",
  "😀",
  "​",
  "$",
  "@",
  "#",
  "\ud800",
  "\u0000",
];

function generate(next: () => number) {
  const length = 1 + Math.floor(next() * 40);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PIECES[Math.floor(next() * PIECES.length)];
  }
  return out;
}

/** Everything the library does with a string, none of which may throw. */
function exercise(source: string) {
  const tokens = tokenize(source);
  expect(tokens.map((t) => source.slice(t.start, t.end)).join("")).toBe(source);

  const parsed = parseFormula(source);
  let last = 0;
  for (const d of parsed.diagnostics) {
    expect(d.start).toBeGreaterThanOrEqual(0);
    expect(d.end).toBeLessThanOrEqual(source.length);
    expect(d.start).toBeGreaterThanOrEqual(last);
    last = d.start;
  }

  const analysis = analyzeFormula(source, { env });
  const runs = highlightRuns(source, analysis.tokens, analysis.diagnostics);
  expect(runs.map((r) => r.text).join("")).toBe(source);

  for (const caret of [0, source.length >> 1, source.length]) {
    const context = completionContext(source, analysis.tokens, caret);
    if (context) getCompletions(context, env);
    signatureHelp(analysis.tokens, source, caret, env);
  }

  evaluateFormula(source, { env, row: { a: 1, b: "x" } });
}

describe("fuzz", () => {
  it("never throws on random token soup", () => {
    const next = random(20260106);
    for (let i = 0; i < 4000; i++) exercise(generate(next));
  });

  it("never throws on random characters", () => {
    const next = random(7);
    for (let i = 0; i < 1500; i++) {
      let source = "";
      const length = Math.floor(next() * 60);
      for (let j = 0; j < length; j++) {
        source += String.fromCodePoint(
          next() < 0.8
            ? 32 + Math.floor(next() * 95)
            : Math.floor(next() * 0xd7ff),
        );
      }
      exercise(source);
    }
  });

  it("never throws on every prefix of a real formula", () => {
    const formula =
      'IF(a > 10 and not (b = "x"), ROUND({B field} & 1, 2), SUM(a, a * 1.5) ^ -2)';
    for (let end = 0; end <= formula.length; end++) {
      exercise(formula.slice(0, end));
      exercise(formula.slice(end));
    }
  });
});

describe("adversarial input", () => {
  const timed = (source: string) => {
    const started = performance.now();
    exercise(source);
    return performance.now() - started;
  };

  it.each([
    ["10,000 open parentheses", "(".repeat(10000)],
    ["10,000 nested groups", `${"(".repeat(10000)}1${")".repeat(10000)}`],
    ["5,000 nested calls", `${"f(".repeat(5000)}1${")".repeat(5000)}`],
    ["100,000 prefix minuses", `${"-".repeat(100000)}1`],
    ["100,000 nots", `${"!".repeat(100000)}a`],
    ["a power tower", `1${"^1".repeat(50000)}`],
    ["50,000 terms", `${"a+".repeat(50000)}a`],
    ["10,000 arguments", `SUM(${"1,".repeat(10000)}1)`],
    ["200,000 stray parentheses", ")".repeat(200000)],
    ["200,000 stray commas", ",".repeat(200000)],
    ["a 300-digit number", "9".repeat(300)],
    ["a 100,000-digit number", "9".repeat(100000)],
    ["a huge exponent", "1e99999999999999"],
    ["an unterminated string of 500,000 characters", `"${"a".repeat(500000)}`],
    ["an unterminated field of 500,000 characters", `{${"a".repeat(500000)}`],
    [
      "20,000 unknown names",
      Array.from({ length: 20000 }, (_, i) => `n${i}`).join("+"),
    ],
    ["500,000 errors", "@".repeat(500000)],
    ["500,000 spaces", " ".repeat(500000)],
    ["10,000 lone surrogates", "\ud800".repeat(10000)],
  ])("handles %s", (_, source) => {
    expect(timed(source)).toBeLessThan(5000);
  });

  it("stops a very long nesting with one error, not thousands", () => {
    const { diagnostics } = parseFormula("(".repeat(10000));

    expect(diagnostics.map((d) => d.code)).toEqual(["too-deep"]);
  });
});
