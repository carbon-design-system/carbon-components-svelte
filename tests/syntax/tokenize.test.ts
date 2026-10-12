// @vitest-environment node
// biome-ignore-all lint/suspicious/noTemplateCurlyInString: the strings are source code to tokenize
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
      "keyword:on",
      "punctuation::",
      "attribute-name:click",
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
      "keyword:on",
      "punctuation::",
      "attribute-name:click",
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

/** `type:text` for the named tokens, in order. */
const named = (code: string, lang = "svelte") => types(code, lang) ?? [];

describe("tokenize: Svelte 4 and 5", () => {
  test("declares the names blocks bind, not their expressions", () => {
    expect(named("{#each items as item, i (item.id)}{/each}")).toEqual(
      expect.arrayContaining(["definition:item", "definition:i"]),
    );
    expect(named("{#each items as item, i (item.id)}{/each}")).not.toContain(
      "function:i",
    );
    expect(named("{#each rows as { id, cells: [first] }}{/each}")).toEqual(
      expect.arrayContaining([
        "definition:id",
        "property-name:cells",
        "definition:first",
      ]),
    );
    // Svelte 5: no `as`.
    expect(named("{#each { length: 3 }, i}{/each}")).toContain("definition:i");
    expect(named("{#await p then value}{/await}")).toEqual(
      expect.arrayContaining(["control-keyword:then", "definition:value"]),
    );
    expect(named("{#await load() catch error}{/await}")).toEqual(
      expect.arrayContaining(["control-keyword:catch", "definition:error"]),
    );
    expect(named("{#await p.then(f)}{/await}")).not.toContain(
      "control-keyword:then",
    );
    expect(named("{:then { data }}{:catch e}")).toEqual(
      expect.arrayContaining(["definition:data", "definition:e"]),
    );
    expect(named("{@const { a, b } = pair}{@const total = a + b}")).toEqual(
      expect.arrayContaining([
        "definition:a",
        "definition:b",
        "definition:total",
      ]),
    );
    expect(named("{#snippet row(item, index = 0)}{/snippet}")).toEqual(
      expect.arrayContaining([
        "definition:row",
        "definition:item",
        "definition:index",
      ]),
    );
  });

  test("splits directives into keyword, name, and modifiers", () => {
    expect(
      named(
        '<a on:click|preventDefault|once={go} bind:this={el} style:--gap="1px" />',
      ),
    ).toEqual(
      expect.arrayContaining([
        "keyword:on",
        "attribute-name:click",
        "modifier:preventDefault",
        "modifier:once",
        "keyword:bind",
        "attribute-name:this",
        "keyword:style",
        "attribute-name:--gap",
      ]),
    );
    for (const prefix of [
      "class",
      "use",
      "transition",
      "in",
      "out",
      "animate",
      "let",
    ]) {
      expect(named(`<a ${prefix}:x />`), prefix).toContain(`keyword:${prefix}`);
    }
    // Svelte 5 event attributes and `{@attach}` are plain attributes and tags.
    expect(named("<a onclick={go} {@attach tip} />")).toEqual(
      expect.arrayContaining([
        "attribute-name:onclick",
        "control-keyword:@attach",
      ]),
    );
  });

  test("colors runes, $store references, and $: statements in Svelte only", () => {
    const script = `<script>
  let { a = 1, b: renamed, ...rest } = $props();
  let n = $state(0);
  const d = $derived.by(() => n * 2);
  $: doubled = $count * 2;
  $: if (a) console.log($$restProps);
</script>`;
    expect(named(script)).toEqual(
      expect.arrayContaining([
        "definition:a",
        "property-name:b",
        "definition:renamed",
        "definition:rest",
        "keyword:$props",
        "keyword:$state",
        "keyword:$derived",
        "keyword:$:",
        "definition:doubled",
        "special:$count",
        "special:$$restProps",
      ]),
    );
    // Plain JavaScript keeps `$` names as ordinary identifiers.
    const js = named("const $el = $(x);\n$: a = 1;", "js");
    expect(js).toContain("definition:$el");
    expect(
      js.filter((t) => t.startsWith("special:") || t === "keyword:$:"),
    ).toEqual([]);
  });

  test("reads :global() selectors, nested rules, and SCSS in <style>", () => {
    expect(named("<style>\n  :global(.x) .y { color: red }\n</style>")).toEqual(
      expect.arrayContaining([
        "special::global",
        "class-name:.x",
        "class-name:.y",
      ]),
    );
    const scss = `<style lang="scss">
  // comment
  $gap: 1rem;
  .card {
    padding: $gap;
    &:hover .title { color: #{$accent}; }
    @media (min-width: 40rem) { padding: 0; }
  }
</style>`;
    expect(named(scss)).toEqual(
      expect.arrayContaining([
        "comment:// comment",
        "variable-name:$gap",
        "property-name:padding",
        "special::hover",
        "class-name:.title",
        "special:#{$accent}",
        "property-name:min-width",
      ]),
    );
    // Plain CSS nesting, without SCSS.
    expect(named(".a { color: red; .b { margin: 0 } }", "css")).toEqual(
      expect.arrayContaining(["class-name:.b", "property-name:margin"]),
    );
  });

  test("splits character references out of text", () => {
    expect(named("<p>a &amp; b &#123; c</p>")).toEqual(
      expect.arrayContaining(["character:&amp;", "character:&#123;"]),
    );
  });

  test("keeps every character of a full Svelte 4 and 5 component", () => {
    const code = `<script lang="ts" generics="T">
  import { fade } from "svelte/transition";
  let { items = [], children }: { items: T[]; children?: any } = $props();
  let open = $state(false);
  $effect.pre(() => { if (open) console.log(items.length); });
</script>

<svelte:window on:keydown|preventDefault={(e) => e.key === "Escape" && (open = false)} />
<svelte:boundary>
  {#each items as item, i (i)}
    <button class:active={open} transition:fade|local onclick={() => (open = !open)}>
      {i}: {@html String(item)} &nbsp;
    </button>
  {:else}
    {@render children?.()}
  {/each}
</svelte:boundary>

<style lang="scss">
  button { &.active { outline: 1px solid; } }
</style>`;
    expect(
      tokenize(code, "svelte")
        ?.map((token) => token.text)
        .join(""),
    ).toBe(code);
  });
});

describe("tokenize: precision", () => {
  test("splits template literals into strings, interpolations, and script", () => {
    expect(types("`a ${b + `c ${d}`} e`", "js")).toEqual([
      "string:`a ",
      "special:${",
      "operator:+",
      "string:`c ",
      "special:${",
      "special:}",
      "string:`",
      "special:}",
      "string: e`",
    ]);
    expect(types("html`<p>${x}</p>`", "js")?.[0]).toBe("function:html");
  });

  test("splits escape sequences out of strings", () => {
    expect(types('"a\\nb\\u00e9\\u{1F600}"', "js")).toEqual([
      'string:"a',
      "escape:\\n",
      "string:b",
      "escape:\\u00e9",
      "escape:\\u{1F600}",
      'string:"',
    ]);
  });

  test("declares parameters, not their types, defaults, or call arguments", () => {
    const tokens = types(
      "function f(a, { b = c }, ...rest) {}\nconst g = (x: Map<string, T>, y = z) => x;\nconst h = w => w;\nlist.map((item) => item);\ntry {} catch (err) {}\nclass A { m(p) {} }\nif (cond) {}\ncall(arg);",
      "ts",
    );
    for (const name of ["a", "b", "rest", "x", "y", "w", "item", "err", "p"]) {
      expect(tokens, name).toContain(`definition:${name}`);
    }
    for (const name of ["c", "z", "cond", "arg"]) {
      expect(tokens, name).not.toContain(`definition:${name}`);
    }
    expect(tokens).toEqual(
      expect.arrayContaining([
        "type-name:Map",
        "type-name:string",
        "type-name:T",
      ]),
    );
    // Methods with return types and TypeScript parameter properties.
    const members = types(
      "class R { async load(id: string, { retries = 3 }: O = {}): Promise<T> {} constructor(readonly config: C) {} }\nconst v = ok ? f(x) : y;",
      "ts",
    );
    expect(members).toEqual(
      expect.arrayContaining([
        "definition:id",
        "definition:retries",
        "keyword:readonly",
        "definition:config",
      ]),
    );
    expect(members).not.toContain("definition:x");
  });

  test("colors private names, decorators, and TypeScript type keywords", () => {
    expect(
      types(
        "class A extends B { #n = 0; @tracked x; }\ntype U<T> = T extends Array<infer E> ? E : never;\nfunction is(x: unknown): x is string {}",
        "ts",
      ),
    ).toEqual(
      expect.arrayContaining([
        "keyword:extends",
        "type-name:B",
        "property-name:#n",
        "annotation:@tracked",
        "keyword:infer",
        "keyword:is",
        "type-name:string",
      ]),
    );
  });

  test("reads doctypes, attribute selectors, combinators, and !important", () => {
    expect(types("<!doctype html><p>a</p>", "html")?.[0]).toBe(
      "meta:<!doctype html>",
    );
    expect(
      types("input[type='text'] > .a + b ~ c { color: red !important }", "css"),
    ).toEqual(
      expect.arrayContaining([
        "attribute-name:type",
        "attribute-value:'text'",
        "operator:>",
        "operator:+",
        "operator:~",
        "keyword:!important",
      ]),
    );
  });

  test("marks diff file headers and shell assignments", () => {
    expect(
      types(
        "diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b",
        "diff",
      ),
    ).toEqual([
      "meta:diff --git a/x b/x\n",
      "meta:--- a/x\n",
      "meta:+++ b/x\n",
      "meta:@@ -1 +1 @@\n",
      "deleted:-a\n",
      "inserted:+b",
    ]);
    expect(
      types("NODE_ENV=production bun run $(git rev-parse HEAD)", "bash"),
    ).toEqual(
      expect.arrayContaining([
        "variable-name:NODE_ENV",
        "function:bun",
        "operator:$(",
        "function:git",
      ]),
    );
  });

  test("keeps every character of random slices of code in every language", () => {
    const samples: [string, string][] = [
      [
        "svelte",
        '<script lang="ts">\n  let { a = 1 }: P = $props();\n  $: b = `x ${a}`;\n</script>\n{#each items as { id }, i (id)}<B on:click|once={() => f(i)} {...rest}>&amp;{id}</B>{/each}\n<style lang="scss">\n  $g: 1rem; .a { &:hover { color: #{$c}; } }\n</style>',
      ],
      [
        "ts",
        'import { a } from "b";\nclass A extends B<T> { #x = "q\\"\\n"; @d m(p: string = `t${1}`): void { return /re[/]x/g.test(p) ? 1 : 2; } }\nconst f = (a, { b }) => a ?? b;',
      ],
      [
        "css",
        '@media (min-width: 1px) { a[href^="x"] > .b::before { content: "\\201C"; width: calc(1rem + 2px) !important; } }',
      ],
      ["json", '{ "a": [1, true, null, "x\\"y"], "b": { "c": -2.5e3 } }'],
      [
        "bash",
        "# c\nFOO=bar baz --flag \"x $y\" 'z' | grep -q $(cmd ${V}) > out && echo $ done; (sub)",
      ],
      ["diff", "diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\n c"],
    ];
    // Deterministic slices: unterminated strings, half tags, open braces.
    let seed = 1;
    const random = () => {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
      return seed / 2_147_483_648;
    };
    for (const [lang, code] of samples) {
      for (let i = 0; i < 300; i++) {
        const start = Math.floor(random() * code.length);
        const slice = code.slice(start, start + Math.floor(random() * 80));
        const tokens = tokenize(slice, lang) ?? [];
        expect(
          tokens.map((t) => t.text).join(""),
          `${lang}: ${JSON.stringify(slice)}`,
        ).toBe(slice);
        expect(
          tokens.every((t) => t.text.length > 0),
          lang,
        ).toBe(true);
      }
    }
  });
});
