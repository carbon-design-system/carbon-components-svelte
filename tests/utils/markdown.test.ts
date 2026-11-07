// @vitest-environment node
import { parseMarkdown, safeHref } from "../../src/utils/markdown.js";

function hrefs(source: string) {
  const out: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (typeof record.href === "string") out.push(record.href);
      Object.values(record).forEach(walk);
    }
  };
  walk(parseMarkdown(source));
  return out;
}

describe("safeHref", () => {
  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "\x01javascript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://user:pass@example.com",
    "//evil.example",
    "/relative",
    "#fragment",
    "https://exa​mple.com",
    "https://exa‮mple.com",
  ])("refuses %j", (raw) => {
    expect(safeHref(raw)).toBeUndefined();
  });

  it("accepts http, https and mailto, and www. as https", () => {
    expect(safeHref("https://example.com/a?b=1")).toBe(
      "https://example.com/a?b=1",
    );
    expect(safeHref("mailto:a@example.com")).toBe("mailto:a@example.com");
    expect(safeHref("www.example.com")).toBe("https://www.example.com/");
  });

  it("only accepts the schemes it is given, and never a script one", () => {
    expect(safeHref("https://example.com", ["mailto:"])).toBeUndefined();
    expect(safeHref("javascript:alert(1)", ["javascript:"])).toBeUndefined();
  });
});

describe("parseMarkdown links", () => {
  it("keeps a refused destination as text", () => {
    expect(hrefs("[x](javascript:alert(1)) [y](https://example.com)")).toEqual([
      "https://example.com/",
    ]);
  });

  it("makes raw HTML text, never a block or a run with markup", () => {
    const blocks = parseMarkdown(
      '<img src=x onerror="alert(1)">\n\n<script>x</script>',
    );
    expect(JSON.stringify(blocks)).toContain("<script>x</script>");
    for (const block of blocks) expect(block.type).toBe("paragraph");
  });
});

describe("task items", () => {
  it("reads [ ] and [x] as the item's checked state", () => {
    const [list] = parseMarkdown("- [ ] todo\n- [x] done\n- [X] also\n- plain");
    assert(list.type === "list");
    expect(list.items.map((item) => item.checked)).toEqual([
      false,
      true,
      true,
      undefined,
    ]);
    expect(list.items[0].runs.map((run) => run.text).join("")).toBe("todo");
  });

  it("needs the box to open the item, and a space after it", () => {
    const [list] = parseMarkdown("- a [ ] b\n- [x]nope");
    assert(list.type === "list");
    expect(list.items.map((item) => item.checked)).toEqual([
      undefined,
      undefined,
    ]);
  });
});
