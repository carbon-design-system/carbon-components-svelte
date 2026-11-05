// @vitest-environment node
import {
  createMarkdownParser,
  parseInline,
  parseMarkdown,
  safeHref,
} from "../../src/Markdown/markdown.js";

const text = (runs: { text: string }[]) => runs.map((r) => r.text).join("");

describe("parseMarkdown blocks", () => {
  it("reads headings, paragraphs, rules and fenced code", () => {
    const blocks = parseMarkdown(
      "# Title\n\nOne\ntwo\n\n---\n\n```ts\nconst a = 1;\n```\n",
    );

    expect(blocks.map((b) => b.type)).toEqual([
      "heading",
      "paragraph",
      "rule",
      "code",
    ]);
    expect(blocks[1]).toMatchObject({ runs: [{ text: "One\ntwo" }] });
    expect(blocks[3]).toMatchObject({
      lang: "ts",
      text: "const a = 1;",
      closed: true,
    });
  });

  it("keeps an unclosed fence open and its text verbatim", () => {
    const [code] = parseMarkdown("```js\nlet a = '**not bold**';\n");

    expect(code).toMatchObject({
      type: "code",
      closed: false,
      text: "let a = '**not bold**';\n",
    });
  });

  it("closes a fence only with the same character and enough of it", () => {
    const [code, after] = parseMarkdown("````\n```\nstill code\n````\nafter");

    expect(code).toMatchObject({ closed: true, text: "```\nstill code" });
    expect(after).toMatchObject({ type: "paragraph" });
  });

  it("reads nested lists, ordered starts and lazy lines", () => {
    const [list] = parseMarkdown("3. one\n   - nested\n4. two\nlazy");

    expect(list).toMatchObject({ type: "list", ordered: true, start: 3 });
    if (list.type !== "list") throw new Error("expected a list");
    expect(list.items).toHaveLength(2);
    expect(list.items[0].children[0]).toMatchObject({ type: "list" });
    expect(text(list.items[1].runs)).toBe("two\nlazy");
  });

  it("lets a list interrupt a paragraph", () => {
    const blocks = parseMarkdown("Steps:\n- a\n- b");

    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "list"]);
  });

  it("reads tables with alignment, and a pipe in a paragraph stays text", () => {
    const [table] = parseMarkdown(
      "| a | b |\n| :-- | --: |\n| 1 | 2 |\n| 3 \\| x | 4 |",
    );

    expect(table).toMatchObject({ type: "table", align: ["left", "right"] });
    if (table.type !== "table") throw new Error("expected a table");
    expect(table.rows).toHaveLength(2);
    expect(text(table.rows[1][0])).toBe("3 | x");
    expect(parseMarkdown("a | b\nc | d")[0].type).toBe("paragraph");
  });

  it("reads block quotes with blocks inside", () => {
    const [quote] = parseMarkdown("> # Hi\n> - a\n> - b");

    expect(quote).toMatchObject({ type: "quote" });
    if (quote.type !== "quote") throw new Error("expected a quote");
    expect(quote.blocks.map((b) => b.type)).toEqual(["heading", "list"]);
  });

  it("treats raw HTML as text", () => {
    const [p] = parseMarkdown(
      '<img src=x onerror="alert(1)"><script>x</script>',
    );

    expect(p).toMatchObject({ type: "paragraph" });
    if (p.type !== "paragraph") throw new Error("expected a paragraph");
    expect(text(p.runs)).toBe(
      '<img src=x onerror="alert(1)"><script>x</script>',
    );
  });

  it("stops nesting at a depth instead of recursing without end", () => {
    const blocks = parseMarkdown(`${"> ".repeat(500)}deep`);

    let depth = 0;
    let block = blocks[0];
    while (block?.type === "quote") {
      depth++;
      block = block.blocks[0];
    }
    expect(depth).toBeLessThanOrEqual(7);
  });
});

describe("parseInline", () => {
  it("reads code, strong, em, del and nesting as flat runs", () => {
    expect(parseInline("a **b *c* d** `e` ~~f~~")).toEqual([
      { text: "a " },
      { text: "b ", strong: true },
      { text: "c", strong: true, em: true },
      { text: " d", strong: true },
      { text: " " },
      { text: "e", code: true },
      { text: " " },
      { text: "f", del: true },
    ]);
  });

  it("leaves arithmetic, snake_case and lone markers alone", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ text: "2 * 3 * 4" }]);
    expect(text(parseInline("snake_case_name, ~one~"))).toBe(
      "snake_case_name, ~one~",
    );
  });

  it("escapes with a backslash and keeps code verbatim", () => {
    expect(parseInline("\\*not em\\* `**raw**`")).toEqual([
      { text: "*not em* " },
      { text: "**raw**", code: true },
    ]);
  });

  it("links bare addresses without taking the sentence's punctuation", () => {
    expect(parseInline("See https://a.com/x_y_z, or www.b.org.")).toEqual([
      { text: "See " },
      { text: "https://a.com/x_y_z", href: "https://a.com/x_y_z" },
      { text: ", or " },
      { text: "www.b.org", href: "https://www.b.org/" },
      { text: "." },
    ]);
  });

  it("makes a hard break from two spaces or a backslash", () => {
    expect(parseInline("a  \nb")).toEqual([
      { text: "a" },
      { text: "\n", br: true },
      { text: "b" },
    ]);
  });

  describe("while text is arriving", () => {
    it("shows an unfinished span as formatted, not as punctuation", () => {
      expect(parseInline("a **bo", { streaming: true })).toEqual([
        { text: "a " },
        { text: "bo", strong: true },
      ]);
      expect(parseInline("a `co", { streaming: true })).toEqual([
        { text: "a " },
        { text: "co", code: true },
      ]);
      expect(parseInline("a **bo")).toEqual([{ text: "a **bo" }]);
    });

    it("shows a link's text alone until its address is complete", () => {
      expect(parseInline("[docs](https://exa", { streaming: true })).toEqual([
        { text: "docs" },
      ]);
      expect(
        parseInline("[docs](https://example.com)", { streaming: true }),
      ).toEqual([{ text: "docs", href: "https://example.com/" }]);
    });

    it("doesn't open a span at a marker with nothing after it", () => {
      expect(parseInline("wait **", { streaming: true })).toEqual([
        { text: "wait **" },
      ]);
    });
  });
});

describe("createMarkdownParser", () => {
  const doc = [
    "# Plan",
    "",
    "Intro with **bold** and `code`.",
    "",
    "- first",
    "- second",
    "  - nested",
    "",
    "```js",
    "const x = 1;",
    "",
    "const y = 2;",
    "```",
    "",
    "| a | b |",
    "|---|---|",
    "| 1 | 2 |",
    "",
    "> quote",
    "",
    "Last paragraph.",
  ].join("\n");

  it("returns the finished blocks as the same objects each time", () => {
    const parser = createMarkdownParser();
    const first = parser.parse("# Title\n\nPara one\n\nPar\n");
    const second = parser.parse("# Title\n\nPara one\n\nParagraph two\n");

    expect(first.frozen).toBe(2);
    expect(second.blocks[0]).toBe(first.blocks[0]);
    expect(second.blocks[1]).toBe(first.blocks[1]);
    expect(second.blocks[2]).not.toBe(first.blocks[2]);
  });

  it("keeps the block above a line still being written open", () => {
    // `#` is an empty heading, but `#tag` is text that joins the paragraph.
    const parser = createMarkdownParser();
    const before = parser.parse("A paragraph\n#");
    const after = parser.parse("A paragraph\n#tag");

    expect(before.blocks.map((b) => b.type)).toEqual(["paragraph", "heading"]);
    expect(before.frozen).toBe(0);
    expect(after.blocks).toEqual(parseMarkdown("A paragraph\n#tag"));
    expect(after.blocks).toHaveLength(1);
  });

  it("gives a table's header back when its delimiter row stops being one", () => {
    const parser = createMarkdownParser();
    parser.parse("Intro\n| a | b |\n|---|---|");
    const broken = parser.parse("Intro\n| a | b |\n|---|---|x");

    expect(broken.blocks).toEqual(
      parseMarkdown("Intro\n| a | b |\n|---|---|x"),
    );
    expect(broken.blocks.map((b) => b.type)).toEqual(["paragraph"]);
  });

  it("matches a fresh parse of the whole text after every append", () => {
    // Appending in chunks of every size must end where one parse of the
    // whole text does, and so must every step along the way.
    for (const size of [1, 2, 3, 7, 16, 50]) {
      const parser = createMarkdownParser();
      for (let end = size; end < doc.length + size; end += size) {
        const source = doc.slice(0, Math.min(end, doc.length));
        expect(parser.parse(source).blocks).toEqual(parseMarkdown(source));
      }
    }
  });

  it("matches a fresh parse for random documents and random chunking", () => {
    const pieces = [
      "# ",
      "#",
      "text **b** ",
      "- ",
      "  - ",
      "1. ",
      "\n",
      "\n\n",
      "```js\n",
      "```",
      "~~~\n",
      "> ",
      "| a | b |\n",
      "|---|---|\n",
      "| 1 | 2 |\n",
      "`x` ",
      "[l](https://a.com) ",
      "[x](",
      "---\n",
      "*e* ",
      "|",
      "x",
    ];
    let seed = 7;
    const next = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed >>> 8) % n;
    };
    for (let round = 0; round < 300; round++) {
      let source = "";
      const parser = createMarkdownParser();
      for (let step = 0; step < 30; step++) {
        const piece = pieces[next(pieces.length)];
        source += piece.slice(0, 1 + next(piece.length));
        expect(parser.parse(source).blocks).toEqual(parseMarkdown(source));
      }
    }
  });

  it("starts over when the text is replaced", () => {
    const parser = createMarkdownParser();
    parser.parse("# One\n\nalpha\n\nbeta");
    const replaced = parser.parse("different\n\nstart");

    expect(replaced.blocks).toEqual(parseMarkdown("different\n\nstart"));
  });

  it("parses only the open block again as text arrives", () => {
    // Work stays with the open block: one more piece on 3,000 finished
    // paragraphs costs a small fraction of parsing them all. Both are
    // measured on this machine, so a slow runner doesn't matter.
    const parser = createMarkdownParser();
    let source = "";
    for (let i = 0; i < 3000; i++) {
      source += `Paragraph ${i} with **bold** and \`code\`.\n\n`;
      parser.parse(`${source}tail`);
    }
    const mean = (run: () => void, times: number) => {
      const start = performance.now();
      for (let i = 0; i < times; i++) run();
      return (performance.now() - start) / times;
    };
    let tail = 0;
    const step = mean(() => parser.parse(`${source}tail ${tail++}`), 50);
    const whole = mean(() => parseMarkdown(`${source}tail`), 3);

    expect(step * 20).toBeLessThan(whole);
  });
});

describe("links and safety", () => {
  const SCHEMES = ["http:", "https:", "mailto:"];

  const hrefs = (source: string) =>
    parseMarkdown(source).flatMap(
      (block) => JSON.stringify(block).match(/"href":"[^"]*"/g) ?? [],
    );

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    " javascript:alert(1)",
    "\u0001javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://a.com/x",
    "//evil.com",
    "/relative",
    "#frag",
    "about:blank",
    "&#106;avascript:alert(1)",
  ])("never links %j", (dest) => {
    expect(safeHref(dest)).toBeUndefined();
    expect(hrefs(`[click](<${dest}>)`)).toEqual([]);
    expect(hrefs(`[click](${dest.replace(/\s/g, "")})`)).toEqual([]);
  });

  it("links http, https and mailto, normalized", () => {
    expect(safeHref("HTTPS://Example.com/a b")).toBe(
      "https://example.com/a%20b",
    );
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
  });

  it("honors a narrower scheme list", () => {
    expect(safeHref("http://a.com", ["https:"])).toBeUndefined();
    expect(parseInline("[a](tel:+1)", { schemes: ["tel:"] })[0].href).toBe(
      "tel:+1",
    );
  });

  it("shows the real address when the text names another site", () => {
    expect(
      parseInline("[https://bank.com](https://evil.example/login)"),
    ).toEqual([
      {
        text: "https://evil.example/login",
        href: "https://evil.example/login",
      },
    ]);
    expect(parseInline("[bank.com](https://evil.example)")[0].text).toBe(
      "https://evil.example/",
    );
    expect(parseInline("[bank.com](https://www.bank.com/a)")[0].text).toBe(
      "bank.com",
    );
    expect(parseInline("[our docs](https://evil.example)")[0].text).toBe(
      "our docs",
    );
  });

  it("never loads an image: it links, and an empty alt shows the address", () => {
    expect(parseInline("![](https://evil.example/p.png?d=secret)")).toEqual([
      {
        text: "https://evil.example/p.png?d=secret",
        href: "https://evil.example/p.png?d=secret",
      },
    ]);
    expect(parseInline("![cat](https://a.com/c.png)")[0]).toEqual({
      text: "cat",
      href: "https://a.com/c.png",
    });
    expect(
      JSON.stringify(parseMarkdown("![x](javascript:alert(1))")),
    ).not.toContain("href");
  });

  it("keeps markup in a link's text as text", () => {
    const [p] = parseMarkdown("[<img src=x onerror=alert(1)>](https://a.com)");

    expect(JSON.stringify(p)).toContain("<img src=x onerror=alert(1)>");
    expect(JSON.stringify(p)).not.toContain('"html"');
  });

  describe("fuzzing", () => {
    const atoms = [
      "[",
      "]",
      "(",
      ")",
      "<",
      ">",
      "`",
      "``",
      "*",
      "**",
      "_",
      "__",
      "~~",
      "!",
      "\\",
      "\n",
      "\n\n",
      "  ",
      "\t",
      "> ",
      "- ",
      "1. ",
      "# ",
      "| ",
      "|---|",
      "```",
      "javascript:",
      "JAVASCRIPT:",
      "data:",
      "vbscript:",
      "http://",
      "https://a.com/",
      "www.",
      "x",
      "a",
      "alert(1)",
      "<script>",
      "</script>",
      "&lt;",
      "&#x6A;",
      "‮",
      "\u0000",
      "\ud800",
      "ال",
      "mailto:",
      "@",
    ];

    it("only ever links an allowed scheme, never throws, keeps ids unique", () => {
      let seed = 42;
      const next = (n: number) => {
        seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
        return (seed >>> 8) % n;
      };
      for (let round = 0; round < 1500; round++) {
        let source = "";
        for (let i = 0, n = 5 + next(60); i < n; i++) {
          source += atoms[next(atoms.length)];
        }
        const blocks = parseMarkdown(source, { streaming: round % 2 === 0 });
        const json = JSON.stringify(blocks);
        for (const [, href] of json.matchAll(/"href":"((?:[^"\\]|\\.)*)"/g)) {
          const value = JSON.parse(`"${href}"`);
          const url = new URL(value);
          expect(SCHEMES).toContain(url.protocol);
          expect(url.href).toBe(value);
        }
        const ids = blocks.map((b) => b.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it.each([
      ["emphasis markers", "*a ".repeat(3900)],
      ["closing markers", "a* ".repeat(3900)],
      ["mixed markers", "*_~~a ".repeat(1900)],
      ["open brackets", "[".repeat(11900)],
      ["link starts", "[a](".repeat(2900)],
      ["backtick runs", "`a ``b ```c ".repeat(990)],
      ["quotes", "> ".repeat(20000)],
      ["list markers", "- ".repeat(20000)],
      [
        "indented lists",
        Array.from({ length: 800 }, (_, i) => `${"  ".repeat(i % 40)}- x`).join(
          "\n",
        ),
      ],
      [
        "table rows",
        `|${"a|".repeat(500)}\n|${"-|".repeat(500)}\n${`|${"b|".repeat(500)}\n`.repeat(200)}`,
      ],
      ["delimiter row tabs", `a|b\n-${"\t".repeat(80000)}x`],
      ["delimiter row cells", `a|b\n${"-\t|\t".repeat(20000)}x`],
      ["fence info", `\`\`\`x${" ".repeat(80000)}y`],
      ["heading spaces", `#${" ".repeat(80000)}x`],
      ["rule spaces", `-${" ".repeat(80000)}x`],
      ["dotted words", "a.".repeat(20000)],
      ["addresses", "http://a.b ".repeat(1000)],
    ])("stays fast on %s", (_, source) => {
      const start = performance.now();
      parseMarkdown(source, { streaming: true });
      expect(performance.now() - start).toBeLessThan(1500);
    });
  });
});
