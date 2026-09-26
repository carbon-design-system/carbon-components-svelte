// @vitest-environment node
import {
  stripDocComments,
  stripSvelteDocComments,
} from "../../scripts/lib/doc-comments";

describe("stripDocComments", () => {
  test("removes doc comments along with the lines they own", () => {
    expect(
      stripDocComments(
        "/**\n * Size.\n * @type {'sm' | 'lg'}\n */\nexport let size = 'sm';\n",
      ),
    ).toBe("export let size = 'sm';\n");
  });

  test("removes inline doc comments such as type casts", () => {
    expect(stripDocComments("let a = /** @type {X} */ (b);")).toBe(
      "let a =  (b);",
    );
  });

  test("keeps plain block, legal and line comments", () => {
    const code =
      "/* keep */\nconst a = /* @__PURE__ */ f();\n/*! legal */\n// line\n";
    expect(stripDocComments(code)).toBe(code);
  });

  test("leaves `/**` inside strings, templates and regexes alone", () => {
    const code =
      'const a = "src/**/*.js";\nconst b = `/** keep */`;\nconst c = /\\/**/;\n';
    expect(stripDocComments(code)).toBe(code);
  });

  test("keeps a line break where a multi-line comment separated tokens", () => {
    expect(stripDocComments("return /**\n*/ value;")).toBe("return \n value;");
  });
});

describe("stripSvelteDocComments", () => {
  test("strips script blocks only", () => {
    const markup =
      "<!-- svelte-ignore a11y-click-events-have-key-events -->\n<p>/** not code */</p>\n";
    expect(
      stripSvelteDocComments(
        `<script context="module">\n  /** @typedef {string} Id */\n</script>\n\n<script>\n  /** Label. */\n  export let label = "";\n</script>\n\n${markup}`,
      ),
    ).toBe(
      `<script context="module">\n</script>\n\n<script>\n  export let label = "";\n</script>\n\n${markup}`,
    );
  });

  test("matches script tags case-insensitively, including end tags with trailing whitespace", () => {
    expect(
      stripSvelteDocComments(
        '<SCRIPT>\n  /** Label. */\n  export let label = "";\n</Script >\n',
      ),
    ).toBe('<SCRIPT>\n  export let label = "";\n</Script >\n');
  });
});
