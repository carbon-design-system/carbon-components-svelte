// @vitest-environment node
import { tokenize } from "../../src/syntax/tokenize.js";
import { spliceTokens } from "../../src/utils/code-tokens.js";

const source = `import { a } from "./a.js";

/**
 * A block comment
 * over lines.
 */
export function add(x, y) {
  const label = \`sum \${x + y}
  and more\`;
  return x + y; // done
}

const ok = true;
`;

const lex = (code: string) => tokenize(code, "js");
const full = (code: string) => {
  const tokens = lex(code);
  assert(tokens);
  return tokens;
};

/** Join neighbouring plain tokens: a splice cuts whitespace at its edges. */
function merged(tokens: { type: string | null; text: string }[]) {
  const out: { type: string | null; text: string }[] = [];
  for (const token of tokens) {
    const last = out[out.length - 1];
    if (last && last.type === null && token.type === null) {
      out[out.length - 1] = { type: null, text: last.text + token.text };
    } else {
      out.push(token);
    }
  }
  return out;
}

/** The spliced tokens for editing `source` at `at`, or null. */
function splice(at: number, removed: number, inserted: string) {
  const next = source.slice(0, at) + inserted + source.slice(at + removed);
  return { next, tokens: spliceTokens(full(source), source, next, lex) };
}

describe("spliceTokens", () => {
  it.each([
    ["typing in a statement", source.indexOf("ok") + 1, 0, "k"],
    ["a new line", source.indexOf("return"), 0, "let q = 1;\n  "],
    ["deleting a word", source.indexOf("done"), 4, ""],
    ["an edit on the first line", 10, 0, "z"],
  ])("matches a full lex for %s", (_name, at, removed, inserted) => {
    const { next, tokens } = splice(at, removed, inserted);
    assert(tokens);
    expect(tokens.map((token) => token.text).join("")).toBe(next);
    expect(merged(tokens)).toEqual(merged(full(next)));
  });

  it("returns the same tokens when the text did not change", () => {
    const tokens = full(source);
    expect(spliceTokens(tokens, source, source, lex)).toBe(tokens);
  });

  it.each([
    ["inside a block comment", source.indexOf("over") + 2, 0, "x"],
    ["inside a template string", source.indexOf("and more") + 2, 0, "x"],
    ["opening a comment", source.indexOf("const ok") + 8, 0, "/*"],
    ["opening a template", source.indexOf("const ok") + 8, 0, "`"],
  ])(
    "falls back to a full lex for an edit %s",
    (_name, at, removed, inserted) => {
      expect(splice(at, removed, inserted).tokens).toBeNull();
    },
  );

  it("falls back when the lexer does not know the language", () => {
    const tokens = full(source);
    expect(
      spliceTokens(tokens, source, `${source}x`, () => undefined),
    ).toBeNull();
  });
});
