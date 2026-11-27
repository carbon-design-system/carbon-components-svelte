// @vitest-environment node
import { analyzeFormula } from "../../src/FormulaInput/formula-check.js";
import { highlightRuns } from "../../src/FormulaInput/formula-highlight.js";

const runs = (source: string, isField?: (name: string) => boolean) => {
  const { tokens, diagnostics } = analyzeFormula(source);
  return highlightRuns(source, tokens, diagnostics, { isField });
};

const kinds = (source: string, isField?: (name: string) => boolean) =>
  runs(source, isField)
    .filter((run) => run.kind !== "none")
    .map((run) => `${run.kind}:${run.text}`);

describe("highlightRuns", () => {
  it("names the kind of each token", () => {
    expect(kinds('IF(a >= 1.5, "x", {b c}) and TRUE')).toEqual([
      "function:IF",
      "punctuation:(",
      "name:a",
      "operator:>=",
      "number:1.5",
      "punctuation:,",
      'string:"x"',
      "punctuation:,",
      "field:{b c}",
      "punctuation:)",
      "operator:and",
      "constant:TRUE",
    ]);
  });

  it("reads a word as an operator only where an operator belongs", () => {
    expect(kinds("not a and b")).toEqual([
      "operator:not",
      "name:a",
      "operator:and",
      "name:b",
    ]);
    expect(kinds("and")).toEqual(["name:and"]);
  });

  it("marks a bare name that is a field", () => {
    expect(kinds("price + other", (name) => name === "price")).toEqual([
      "field:price",
      "operator:+",
      "name:other",
    ]);
  });

  it("covers the whole text, in order, with the spaces as one run", () => {
    const source = "a  +\n\t b";
    const result = runs(source);

    expect(result.map((run) => run.text).join("")).toBe(source);
    expect(result.map((run) => run.kind)).toEqual([
      "name",
      "none",
      "operator",
      "none",
      "name",
    ]);
  });

  it("splits a run at the edges of an error and flags it", () => {
    const result = runs("FOO(1) + 2");

    expect(result.filter((run) => run.error).map((run) => run.text)).toEqual([
      "FOO",
    ]);
  });

  it("does not flag a range that is empty", () => {
    const { tokens } = analyzeFormula("1");
    const result = highlightRuns("1", tokens, [
      { code: "x", message: "", start: 1, end: 1 },
    ]);

    expect(result.every((run) => !run.error)).toBe(true);
  });
});
