import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderGuideMarkdown, shiftMarkdownHeadings } from "./markdown.ts";

const GUIDE = `---
title: Sample guide
layout: guide
description: A guide for the test.
---

<script>
  import { Button } from "carbon-components-svelte";
  const scriptOnly = true;
</script>

## First section

Press <DocKbd label="Enter" /> to submit.

<Button>Rendered demo</Button>

<FileSource src="/framed/Sample/Example" />

| Do | Why |
| :-- | :-- |
| Keep tables. | They are prose. |

\`\`\`svelte
<Button>Kept in a fence</Button>
\`\`\`
`;

let pagesDir: string;

beforeAll(() => {
  pagesDir = fs.mkdtempSync(path.join(os.tmpdir(), "guide-pages-"));
  fs.mkdirSync(path.join(pagesDir, "framed", "Sample"), { recursive: true });
  fs.writeFileSync(
    path.join(pagesDir, "framed", "Sample", "Example.svelte"),
    "<script>\n  let count = 0;\n</script>\n\n<p>{count}</p>\n",
  );
});

afterAll(() => {
  fs.rmSync(pagesDir, { recursive: true, force: true });
});

describe("renderGuideMarkdown", () => {
  test("drops the script block and the rendered demo markup", async () => {
    const { md } = await renderGuideMarkdown(GUIDE, {
      name: "sample",
      pagesDir,
    });

    expect(md).not.toContain("scriptOnly");
    expect(md).not.toContain("Rendered demo");
    expect(md).not.toContain("<FileSource");
    expect(md).not.toContain("---\ntitle");
  });

  test("keeps the title, prose, keys, tables, and fences", async () => {
    const { title, md } = await renderGuideMarkdown(GUIDE, {
      name: "sample",
      pagesDir,
    });

    expect(title).toBe("Sample guide");
    expect(md).toStartWith("# Sample guide\n\nA guide for the test.\n");
    expect(md).toContain("## First section");
    expect(md).toContain("Press <kbd>Enter</kbd> to submit.");
    expect(md).toContain("| Keep tables. | They are prose. |");
    expect(md).toContain("<Button>Kept in a fence</Button>");
  });

  test("inlines a <FileSource> as a Svelte fence", async () => {
    const { md } = await renderGuideMarkdown(GUIDE, {
      name: "sample",
      pagesDir,
    });

    expect(md).toContain("```svelte\n<script>\n  let count = 0;\n</script>");
    expect(md).toContain("<p>{count}</p>");
  });
});

describe("shiftMarkdownHeadings", () => {
  test("shifts a rendered guide so its title sits under the llms-full heading", async () => {
    const { md } = await renderGuideMarkdown(GUIDE, {
      name: "sample",
      pagesDir,
    });
    const shifted = shiftMarkdownHeadings(md);

    expect(shifted).toStartWith("## Sample guide\n");
    expect(shifted).toContain("\n### First section\n");
  });
});
