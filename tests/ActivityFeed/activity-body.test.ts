// @vitest-environment node
import {
  activityBodyToText,
  parseActivityBody,
  safeUrl,
} from "../../src/ActivityFeed/activity-body.js";

const first = (body: string) => parseActivityBody(body)[0];

describe("safeUrl", () => {
  it("allows http, https and mailto only", () => {
    expect(safeUrl("https://example.com/a?b=1")).toBe(
      "https://example.com/a?b=1",
    );
    expect(safeUrl("mailto:ada@example.com")).toBe("mailto:ada@example.com");
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("JaVaScRiPt:alert(1)")).toBeUndefined();
    expect(safeUrl("java\tscript:alert(1)")).toBeUndefined();
    expect(safeUrl("data:text/html,<script>")).toBeUndefined();
    expect(safeUrl("//evil.example")).toBeUndefined();
    expect(safeUrl("/relative")).toBeUndefined();
  });
});

describe("parseActivityBody", () => {
  it("keeps HTML as text", () => {
    const block = first('<img src=x onerror="alert(1)"><script>x</script>');
    expect(block).toEqual({
      type: "paragraph",
      runs: [
        {
          type: "text",
          text: '<img src=x onerror="alert(1)"><script>x</script>',
        },
      ],
    });
  });

  it("refuses an unsafe link target and keeps the text", () => {
    expect(first("[click](javascript:alert(1))")).toEqual({
      type: "paragraph",
      runs: [{ type: "text", text: "[click](javascript:alert(1))" }],
    });
  });

  it("reads mention tokens and cannot be spoofed with private-use text", () => {
    expect(first("hi @[Ada \\] L](u\\)1)!")).toEqual({
      type: "paragraph",
      runs: [
        { type: "text", text: "hi " },
        { type: "mention", trigger: "@", text: "Ada ] L", id: "u)1" },
        { type: "text", text: "!" },
      ],
    });
    expect(first("0")).toEqual({
      type: "paragraph",
      runs: [{ type: "text", text: "0" }],
    });
  });

  it("splits paragraphs on a blank line and breaks on a newline", () => {
    expect(parseActivityBody("a\nb\n\nc")).toEqual([
      {
        type: "paragraph",
        runs: [
          { type: "text", text: "a" },
          { type: "br" },
          { type: "text", text: "b" },
        ],
      },
      { type: "paragraph", runs: [{ type: "text", text: "c" }] },
    ]);
  });

  it("marks bold, italic and code, nested", () => {
    expect(first("**bold *both* end** `x*y*` snake_case_name")).toEqual({
      type: "paragraph",
      runs: [
        { type: "text", text: "bold ", strong: true },
        { type: "text", text: "both", strong: true, em: true },
        { type: "text", text: " end", strong: true },
        { type: "text", text: " " },
        { type: "code", text: "x*y*" },
        { type: "text", text: " snake_case_name" },
      ],
    });
  });

  it("links bare URLs without their trailing punctuation", () => {
    expect(first("see (https://example.com/a).")).toEqual({
      type: "paragraph",
      runs: [
        { type: "text", text: "see (" },
        {
          type: "link",
          text: "https://example.com/a",
          href: "https://example.com/a",
        },
        { type: "text", text: ")." },
      ],
    });
  });

  it("reads fences, quotes and bullets, and keeps fenced text literal", () => {
    expect(parseActivityBody("> q\n- a\n- b\n```\n**x**\n```")).toEqual([
      { type: "quote", runs: [{ type: "text", text: "q" }] },
      {
        type: "list",
        items: [[{ type: "text", text: "a" }], [{ type: "text", text: "b" }]],
      },
      { type: "code", text: "**x**" },
    ]);
  });

  it("stays linear on hostile input", () => {
    const hostile = [
      "[".repeat(19_000),
      "*a ".repeat(6_000),
      "`".repeat(19_000),
    ];
    for (const body of hostile) {
      const start = performance.now();
      parseActivityBody(body);
      expect(performance.now() - start).toBeLessThan(200);
    }
  });

  it("cuts a body that is too long", () => {
    const text = (first("a".repeat(50_000)) as { runs: { text: string }[] })
      .runs[0].text;
    expect(text.length).toBe(20_000);
  });
});

describe("activityBodyToText", () => {
  it("flattens marks and mentions", () => {
    expect(
      activityBodyToText("**Hi** @[Ada](u1),\n`x` [t](https://a.co)"),
    ).toBe("Hi @Ada, x t");
  });
});
