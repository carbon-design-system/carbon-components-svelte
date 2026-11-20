import {
  parseInline,
  parseMarkdown,
} from "../../src/FilePreview/markdown-lite.js";

describe("parseMarkdown", () => {
  it("parses headings, lists, quotes, rules and fenced code", () => {
    const blocks = parseMarkdown(
      "# Title\n\nSome **bold** and `code`.\n\n- a\n  - nested\n- b\n\n> quote\n\n---\n\n```sh\nls -l\n```\n",
    );

    expect(blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "quote",
      "rule",
      "code",
    ]);
    const list = blocks[2];
    if (list.type !== "list") throw new Error("expected a list");
    expect(list.items[0].blocks[0].type).toBe("list");
    expect(blocks[5]).toMatchObject({ lang: "sh", text: "ls -l" });
  });

  it("keeps raw HTML as text and never produces an element", () => {
    const [block] = parseMarkdown(
      '<img src=x onerror="alert(1)"><script>alert(1)</script>',
    );

    expect(block.type).toBe("paragraph");
    if (block.type !== "paragraph") return;
    expect(block.runs.map((run) => run.text).join("")).toContain(
      "<script>alert(1)</script>",
    );
    expect(block.runs.every((run) => run.href === undefined)).toBe(true);
  });

  it("links http, https and mailto, and shows other schemes as text", () => {
    const runs = parseInline(
      "[a](https://x.test/) [b](javascript:alert(1)) [c](data:text/html,x) <mailto:a@b.test>",
    );
    const linked = runs.filter((run) => run.href).map((run) => run.href);

    expect(linked).toEqual(["https://x.test/", "mailto:a@b.test"]);
    expect(runs.map((run) => run.text).join("")).toContain("b");
  });

  it("turns an image into its alt text and loads nothing", () => {
    const runs = parseInline("![tracking pixel](https://tracker.test/p.gif)");

    expect(runs).toEqual([{ text: "tracking pixel" }]);
  });

  it("does not hang on text built to make a parser rescan", () => {
    const shapes = [
      "[".repeat(100_000),
      "`".repeat(100_000),
      "<".repeat(100_000),
      "*_".repeat(50_000),
      "> ".repeat(5_000),
      "- ".repeat(5_000),
      "* ".repeat(5_000),
      "[a](".repeat(20_000),
      "![](".repeat(20_000),
      `${"1. a\n".repeat(20_000)}`,
      "# ".repeat(50_000),
    ];
    for (const shape of shapes) {
      const start = performance.now();
      parseMarkdown(shape);
      expect(performance.now() - start).toBeLessThan(2000);
    }
  });

  it("stops nesting past a depth, so a deep quote cannot overflow the stack", () => {
    expect(() => parseMarkdown(`${"> ".repeat(5000)}x`)).not.toThrow();
    expect(() => parseMarkdown(`${"- ".repeat(5000)}x`)).not.toThrow();
  });
});
