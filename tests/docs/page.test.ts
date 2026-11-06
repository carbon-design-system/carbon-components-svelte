// @vitest-environment node
import { parseMarkdown } from "../../docs/scripts/markdown";
import { compilePage } from "../../docs/scripts/page";

const strip = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (key, v) => (key === "position" ? undefined : v)),
  );

describe("parseMarkdown", () => {
  it("parses blocks as mdsvex did", () => {
    const tree = parseMarkdown(
      [
        "Use `Stack` or",
        "<DocKbd label='Enter' /> to submit.",
        "",
        "<Stack>",
        "  <Text />",
        "",
        "| Do | Why |",
        "| :- | -: |",
        "| `a \\| b` | see [docs](/a) |",
      ].join("\n"),
    );
    expect(strip(tree.children)).toEqual([
      // A line that opens with a tag ends the paragraph.
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Use " },
          { type: "inlineCode", value: "Stack" },
          { type: "text", value: " or" },
        ],
      },
      { type: "html", value: "<DocKbd label='Enter' /> to submit." },
      // A component block ends at a blank line.
      { type: "html", value: "<Stack>\n  <Text />" },
      {
        type: "table",
        align: ["left", "right"],
        children: [
          {
            type: "tableRow",
            children: [
              { type: "tableCell", children: [{ type: "text", value: "Do" }] },
              { type: "tableCell", children: [{ type: "text", value: "Why" }] },
            ],
          },
          {
            type: "tableRow",
            children: [
              {
                type: "tableCell",
                children: [{ type: "inlineCode", value: "a | b" }],
              },
              {
                type: "tableCell",
                children: [
                  { type: "text", value: "see " },
                  {
                    type: "link",
                    title: null,
                    url: "/a",
                    children: [{ type: "text", value: "docs" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
});

describe("parseMarkdown block ends", () => {
  const values = (source: string) =>
    parseMarkdown(source).children.map((node) => node.value);

  it.each([
    ["a component", "<Stack>\n  <Text />\n\n  <Text />\n</Stack>"],
    ["a top-level {#if} block", "{#if open}\n  <Text />\n\n  <Text />\n{/if}"],
  ])("keeps %s with a blank line in it whole", (_, source) => {
    expect(values(source)).toEqual([source]);
  });
});

describe("compilePage", () => {
  it("puts front matter in a module script and wraps the page in its layout", async () => {
    const code = await compilePage(
      [
        "---",
        "description: A summary.",
        'components: ["Button"]',
        "---",
        "",
        "<script>",
        '  import { Button } from "carbon-components-svelte";',
        "</script>",
        "",
        "## Basic",
        "",
        "Use `{x}`.",
      ].join("\n"),
      "Button.md",
      { highlight: (code) => code, layouts: { _: "/Layout.svelte" } },
    );
    expect(code).toBe(
      [
        '<script context="module">',
        '\texport const metadata = {"description":"A summary.","components":["Button"]};',
        "\tconst { description, components } = metadata;",
        "</script>",
        "<script>",
        "\timport PageLayout from '/Layout.svelte';",
        '  import { Button } from "carbon-components-svelte";',
        "</script>",
        "<PageLayout {...$$props} {...metadata}>",
        "",
        "<h2>Basic</h2>",
        "<p>Use <code>&#123;x&#125;</code>.</p>",
        "</PageLayout>",
      ].join("\n"),
    );
  });
});
