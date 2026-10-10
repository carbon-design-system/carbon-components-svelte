// @vitest-environment node
import { highlight, tokenize } from "../../src/syntax/tokenize.js";

const types = (code: string, lang: string) =>
  tokenize(code, lang)
    ?.filter((token) => token.type)
    .map((token) => `${token.type}:${token.text}`);

describe("tokenize", () => {
  test("classifies script tokens by Carbon's syntax token names", () => {
    expect(
      types(
        'import { a } from "x";\nconst n = 1; // c\nif (b) f(/x/g, this.p);',
        "js",
      ),
    ).toEqual([
      "module-keyword:import",
      "brace:{",
      "brace:}",
      "module-keyword:from",
      'special-string:"x"',
      "punctuation:;",
      "definition-keyword:const",
      "definition:n",
      "operator:=",
      "number:1",
      "punctuation:;",
      "comment:// c",
      "control-keyword:if",
      "paren:(",
      "paren:)",
      "function:f",
      "paren:(",
      "regexp:/x/g",
      "punctuation:,",
      "self:this",
      "punctuation:.",
      "property-name:p",
      "paren:)",
      "punctuation:;",
    ]);
  });

  test("tokenizes Svelte markup, expressions, and the script and style inside", () => {
    expect(
      types(
        "<script>let a;</script><B on:click={() => a++}>{#if a}x{/if}</B><style>p { color: #fff }</style>",
        "svelte",
      ),
    ).toEqual([
      "angle-bracket:<",
      "tag-name:script",
      "angle-bracket:>",
      "definition-keyword:let",
      "definition:a",
      "punctuation:;",
      "angle-bracket:</",
      "tag-name:script",
      "angle-bracket:>",
      "angle-bracket:<",
      "tag-name:B",
      "attribute-name:on:click",
      "operator:=",
      "brace:{",
      "paren:(",
      "paren:)",
      "operator:=>",
      "operator:++",
      "brace:}",
      "angle-bracket:>",
      "brace:{",
      "control-keyword:#if",
      "brace:}",
      "brace:{",
      "control-keyword:/if",
      "brace:}",
      "angle-bracket:</",
      "tag-name:B",
      "angle-bracket:>",
      "angle-bracket:<",
      "tag-name:style",
      "angle-bracket:>",
      "tag-name:p",
      "brace:{",
      "property-name:color",
      "punctuation::",
      "color:#fff",
      "brace:}",
      "angle-bracket:</",
      "tag-name:style",
      "angle-bracket:>",
    ]);
  });

  test("tokenizes CSS, JSON, shell, and diffs", () => {
    expect(types("a { margin: 1.5rem }", "css")).toEqual([
      "tag-name:a",
      "brace:{",
      "property-name:margin",
      "punctuation::",
      "number:1.5",
      "unit:rem",
      "brace:}",
    ]);
    expect(types('{"a": [1, true, null]}', "json")).toContain(
      'property-name:"a"',
    );
    expect(types("bun add -d pkg # dev", "sh")).toEqual([
      "function:bun",
      "attribute-name:-d",
      "comment:# dev",
    ]);
    expect(types("-old\n+new", "diff")).toEqual([
      "deleted:-old\n",
      "inserted:+new",
    ]);
  });

  test("reads expressions inside quoted attribute values as script", () => {
    expect(types('<B on:click="{() => log("x")}" />', "svelte")).toEqual([
      "angle-bracket:<",
      "tag-name:B",
      "attribute-name:on:click",
      "operator:=",
      'attribute-value:"',
      "brace:{",
      "paren:(",
      "paren:)",
      "operator:=>",
      "function:log",
      "paren:(",
      'string:"x"',
      "paren:)",
      "brace:}",
      'attribute-value:"',
      "angle-bracket:/>",
    ]);
  });

  test("colors TypeScript's built-in types in type positions", () => {
    expect(types("function f(role: string): Promise<void> {}", "ts")).toContain(
      "type-name:string",
    );
    expect(types("let n: number | undefined;", "ts")).toContain(
      "type-name:number",
    );
    expect(types("const o = { number };", "js")).not.toContain(
      "type-name:number",
    );
  });

  test("keeps every character, so offsets map back to the source", () => {
    const code = '<A b="c" {d}>{#each e as f}{f}{/each}</A>\n<!-- g -->';
    expect(
      tokenize(code, "svelte")
        ?.map((token) => token.text)
        .join(""),
    ).toBe(code);
  });

  test("returns undefined for an unknown language", () => {
    expect(tokenize("x", "cobol")).toBeUndefined();
    expect(highlight("x", "cobol")).toBeUndefined();
  });

  test("renders spans with escaped text", () => {
    expect(highlight("a < {b}", "js")).toBe(
      'a <span class="tok-operator">&lt;</span> <span class="tok-brace">&#123;</span>b<span class="tok-brace">&#125;</span>',
    );
  });
});

describe("tokenize: keys, specifiers, and nesting", () => {
  test("colors object and type literal keys, not parameters or labels", () => {
    const tokens = types(
      "const o = { id: 1, default: 2, n: { a: b ? c : d } };\nfunction f(role: string) {}\ninterface P { a: string; b?: number }",
      "ts",
    );
    expect(tokens).toEqual(
      expect.arrayContaining([
        "property-name:id",
        "property-name:default",
        "property-name:n",
        "property-name:a",
        "property-name:b",
      ]),
    );
    expect(tokens).not.toContain("property-name:role");
    expect(tokens).not.toContain("property-name:c");
  });

  test("keeps switch cases and block labels as code, not keys", () => {
    const tokens = types(
      "switch (x) { case 1: break; default: y; }\nif (a) { b: 1 }\nconst h = () => ({ k: 1 });",
      "js",
    );
    expect(tokens).toContain("control-keyword:default");
    expect(tokens).not.toContain("property-name:b");
    expect(tokens).toContain("property-name:k");
  });

  test("marks module specifiers as special strings", () => {
    expect(
      types(
        'import { A } from "pkg";\nimport "./app.css";\nconst s = "x";',
        "js",
      ),
    ).toEqual(
      expect.arrayContaining([
        'special-string:"pkg"',
        'special-string:"./app.css"',
        'string:"x"',
      ]),
    );
  });

  test("reads rules, not declarations, inside an at-rule block", () => {
    expect(
      types(
        "@media (min-width: 1px) { .a:hover { --x: 1px; color: var(--x); } }",
        "css",
      ),
    ).toEqual(
      expect.arrayContaining([
        "class-name:.a",
        "special::hover",
        "property-name:--x",
        "variable-name:--x",
      ]),
    );
  });
});
