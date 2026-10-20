// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Highlighted HTML in a CodeSnippet takes its colors from the v11 syntax
// tokens, for both Prism and highlight.js class names.
describe("CodeSnippet syntax highlighting", () => {
  it.each([
    [".bx--snippet .token.keyword", "syntax-keyword"],
    [".bx--snippet .hljs-keyword", "syntax-keyword"],
    [".bx--snippet .token.string", "syntax-string"],
    [".bx--snippet .hljs-string", "syntax-string"],
    [".bx--snippet .token.comment", "syntax-comment"],
    [".bx--snippet .token.function", "syntax-function"],
  ])(
    "%s reads %s",
    async (selector, token) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const rule = rules.find((r) =>
        r.selector.split(",").some((part) => part.trim() === selector),
      );
      expect(rule?.decls.get("color")).toBe(`var(--cds-${token})`);
    },
    30_000,
  );

  it("declares the syntax tokens in every theme", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const root = rules.find(
      (r) => r.selector === ":root" && r.decls.has("--cds-syntax-keyword"),
    );
    const syntax = [...(root?.decls.keys() ?? [])].filter((prop) =>
      prop.startsWith("--cds-syntax-"),
    );
    expect(syntax).toHaveLength(88);
    for (const theme of ["g80", "g90", "g100"]) {
      const block = rules.find((r) => r.selector === `:root[theme=${theme}]`);
      expect(block?.decls.get("--cds-syntax-keyword"), theme).toBe("#4589ff");
    }
  }, 30_000);
});
