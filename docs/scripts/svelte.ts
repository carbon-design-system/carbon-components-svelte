import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, type SvelteBunOptions } from "svelte-bun";
import { highlight } from "../../src/syntax/index.js";
import { PAGE_EXTENSION } from "./constants.ts";
import { exampleSource, isInstanceScript } from "./example-source.ts";
import { createFormatter } from "./format.ts";
import type { Node as MdastNode } from "./markdown.ts";
import { compilePage } from "./page.ts";
import { requireLeadingHeading } from "./require-leading-heading.ts";
import { rehypeSlug } from "./slug.ts";
import { stripDocsOnly } from "./strip-docs-only.ts";
import { visit } from "./visit.ts";

const DOCS = path.resolve(import.meta.dirname, "..");

const NODE_MODULES_REGEX = /node_modules/;
const PAGES_COMPONENTS_REGEX = /pages\/(components)/;
const SCRIPT_TAG_REGEX = /(<script[^>]*>)/i;
const METADATA_RE = /export const metadata = (\{.*\});/;
const LAYOUT_OPEN_TAG_RE = /<PageLayout\b[^>]*>/;
const FILE_SOURCE_SRC_REGEX = /src="([^"]+)"/;
const NO_PREVIEW_HTML_RE = /^\s*<DocKbd\b/;
const HTML_COMMENT_RE = /^\s*<!--/;
const DOC_KBD_IMPORT_STMT =
  '  import DocKbd from "../../components/DocKbd.svelte";';
const DOC_KBD_IMPORT_RE = /import\s+DocKbd\s+from/;
const DOC_KBD_USAGE_RE = /<DocKbd\b/;

const SKIP_PREVIEW_FORMAT = process.env.NODE_ENV === "development";

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escapes what would end `{@html \`...\`}` early or read as Svelte. */
function escapeSvelte(html: string): string {
  return html
    .replace(
      /[{}`]/g,
      (char) => ({ "{": "&#123;", "}": "&#125;", "`": "&#96;" })[char] ?? char,
    )
    .replace(/\\([trn])/g, "&#92;$1");
}

function highlightCodeBlock(code: string, lang: string | null): string {
  const raw = lang?.toLowerCase().trim() ?? "";
  const classLang = raw || "text";
  const inner = (raw && highlight(code, raw)) || escapeHtmlText(code);
  const highlighted = escapeSvelte(inner);
  return `<pre class="language-${classLang}">{@html \`<code class="language-${classLang}">${highlighted}</code>\`}</pre>`;
}

const formatSvelte = createFormatter("svelte");

/**
 * `Preview` highlights in the browser, which keeps the highlighted markup,
 * most of a page's size, out of the bundle.
 */
function formatPreviewCode(source: string): Promise<string> {
  return SKIP_PREVIEW_FORMAT ? Promise.resolve(source) : formatSvelte(source);
}

function plugin() {
  async function visitHtml(
    node: { lang?: string; value: string } & MdastNode,
    isWholeParagraph: boolean,
    pageScript: string | undefined,
  ) {
    // A paragraph that opens with `<DocKbd>` parses as an HTML block, so it
    // misses carbonify's `<p>`. Add it back at the root only: in a
    // paragraph or table cell it must stay inline.
    if (NO_PREVIEW_HTML_RE.test(node.value)) {
      if (isWholeParagraph) {
        node.value = `<p class="bx--type-body-02">${node.value}</p>`;
      }
      return;
    }

    if (HTML_COMMENT_RE.test(node.value)) return;

    if (
      node.lang !== "svelte" &&
      !node.value.startsWith("<FileSource") &&
      !node.value.startsWith("<script>")
    ) {
      const formattedCode = await formatPreviewCode(
        exampleSource(node.value, pageScript),
      );

      node.value = `<Preview code={${JSON.stringify(formattedCode)}}>${node.value}</Preview>`;
    }

    if (node.value.startsWith("<FileSource")) {
      const srcMatch = node.value.match(FILE_SOURCE_SRC_REGEX);
      const src = srcMatch ? srcMatch[1] : "";

      const filePath = path.join(DOCS, "src/pages", `${src}.svelte`);
      const sourceCode = stripDocsOnly(fs.readFileSync(filePath, "utf-8"));
      const formattedCode = await formatPreviewCode(sourceCode);

      node.value = `<Preview framed src="${src}" code={${JSON.stringify(formattedCode)}} />`;
    }
  }

  return async (tree: Parameters<typeof visit>[0]) => {
    const pageScript = (
      (tree as { children?: { type: string; value?: string }[] }).children ?? []
    ).find(
      (node) => node.type === "html" && isInstanceScript(node.value ?? ""),
    )?.value;
    const jobs: Promise<void>[] = [];
    visit(tree, "html", (node, _index, parent) => {
      const isWholeParagraph =
        (parent as { type?: string } | null)?.type === "root";
      jobs.push(
        visitHtml(
          node as Parameters<typeof visitHtml>[0],
          isWholeParagraph,
          pageScript,
        ),
      );
    });
    await Promise.all(jobs);
  };
}

function importGuideHelpers(code: string, filename: string): string {
  const dir = path
    .relative(path.dirname(filename), path.join(DOCS, "src/components"))
    .split(path.sep)
    .join("/");
  const imports: string[] = [];
  if (code.includes("<Preview") && !code.includes("import Preview")) {
    imports.push(`  import Preview from "${dir}/Preview.svelte";`);
  }
  if (DOC_KBD_USAGE_RE.test(code) && !DOC_KBD_IMPORT_RE.test(code)) {
    imports.push(`  import DocKbd from "${dir}/DocKbd.svelte";`);
  }
  if (imports.length === 0) return code;
  const block = imports.join("\n");
  return SCRIPT_TAG_REGEX.test(code)
    ? code.replace(SCRIPT_TAG_REGEX, `$1\n${block}`)
    : `<script>\n${block}\n</script>\n\n${code}`;
}

function isStandaloneSectionIntro(next: unknown): boolean {
  if (!next || typeof next !== "object" || !("type" in next)) return false;
  const node = next as { type?: string; depth?: number };
  if (node.type === "table") return true;
  return (
    node.type === "heading" && typeof node.depth === "number" && node.depth >= 3
  );
}

function isH2Heading(node: unknown): node is { type: "heading"; depth: 2 } {
  return (
    node != null &&
    typeof node === "object" &&
    "type" in node &&
    node.type === "heading" &&
    "depth" in node &&
    node.depth === 2
  );
}

function isH2SectionIntro(
  parent: { children: unknown[] } | null | undefined,
  index: number | null | undefined,
): boolean {
  if (!parent || index == null || index === 0) return false;
  return (
    isH2Heading(parent.children[index - 1]) &&
    isStandaloneSectionIntro(parent.children[index + 1])
  );
}

function rehypeHeadingAnchors() {
  return (tree: Parameters<typeof visit>[0]) => {
    visit(tree, "element", (node) => {
      const el = node as {
        tagName?: string;
        properties?: Record<string, unknown>;
        children?: unknown[];
      };
      if (el.tagName !== "h2" && el.tagName !== "h3") return;

      const id = el.properties?.id;
      if (typeof id !== "string" || !id) return;

      el.children = el.children ?? [];
      el.children.push({
        type: "element",
        tagName: "a",
        properties: {
          href: `#${id}`,
          className: ["heading-anchor"],
          ariaLabel: "Copy link to this heading",
        },
        children: [{ type: "text", value: "#" }],
      });
    });
  };
}

function carbonify() {
  return (tree: Parameters<typeof visit>[0]) => {
    visit(tree, (node, index, parent) => {
      switch (node.type) {
        case "link":
          node.data = { hProperties: { class: "bx--link bx--link--muted" } };
          return;
        case "list": {
          const list = node as MdastNode & { ordered?: boolean };
          list.data = {
            hProperties: {
              class: list.ordered ? "bx--list--ordered" : "bx--list--unordered",
            },
          };
          return;
        }
        case "listItem":
          node.data = { hProperties: { class: "bx--list__item" } };
          return;
        case "paragraph": {
          const className = isH2SectionIntro(parent, index)
            ? "bx--type-heading-03 prose-section-intro"
            : "bx--type-body-02";
          node.data = { hProperties: { class: className } };
          return;
        }
        case "heading": {
          const heading = node as { depth?: number };
          if (heading.depth === 2) {
            node.data = {
              hProperties: { class: "bx--type-heading-04" },
            };
          } else if (heading.depth === 3) {
            node.data = {
              hProperties: { class: "bx--type-heading-03" },
            };
          }
          return;
        }
        case "inlineCode":
          node.data = { hProperties: { class: "bx--type-code-01" } };
          return;
        case "table": {
          const table = node as MdastNode & { children: MdastNode[] };
          const headerClass = "bx--type-label-01";
          const bodyClass = "bx--type-label-01 bx--type-text-secondary";
          for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
            const row = table.children[rowIndex];
            if (row.type !== "tableRow") continue;
            const cellClass = rowIndex === 0 ? headerClass : bodyClass;
            for (const cell of row.children ?? []) {
              if (cell.type === "tableCell") {
                cell.data = { hProperties: { class: cellClass } };
              }
            }
          }
          return;
        }
      }
    });
  };
}

const HEADING_RE = /<h([23])[^>]+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
const HEADING_ANCHOR_TAG_RE =
  /<a\b[^>]*\bclass="heading-anchor"[^>]*>[\s\S]*?<\/a\s*>/g;
const TAG_RE = /<[^>]+>/g;
const ENTITY_RE = /&(?:#x([\da-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi;
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(ENTITY_RE, (_, hex, dec, name) =>
    hex
      ? String.fromCodePoint(Number.parseInt(hex, 16))
      : dec
        ? String.fromCodePoint(Number(dec))
        : NAMED_ENTITIES[name.toLowerCase()],
  );
}

function tocHeadings(html: string) {
  return Array.from(html.matchAll(HEADING_RE), (match) => ({
    id: match[2],
    text: decodeEntities(
      match[3].replace(HEADING_ANCHOR_TAG_RE, "").replace(TAG_RE, ""),
    ).trim(),
    depth: Number(match[1]) as 2 | 3,
  }));
}

/** The local modules `file` imports, and theirs, by path. */
function localImports(file: string, seen = new Set<string>()): Set<string> {
  const transpiler = new Bun.Transpiler({ loader: "ts" });
  for (const { path: spec } of transpiler.scanImports(
    fs.readFileSync(file, "utf8"),
  )) {
    if (!spec.startsWith(".")) continue;
    const dep = path.resolve(path.dirname(file), spec);
    if (seen.has(dep) || !fs.existsSync(dep)) continue;
    seen.add(dep);
    if (/\.[jt]s$/.test(dep)) localImports(dep, seen);
  }
  return seen;
}

/**
 * What the preprocessing reads: this module, the modules it imports, such
 * as the page compiler and the highlighter, and the bun that formats
 * preview code.
 */
const PREPROCESS_INPUTS = Bun.hash(
  [
    fileURLToPath(import.meta.url),
    ...localImports(fileURLToPath(import.meta.url)),
  ]
    .sort()
    .map((file) => `${file}\0${fs.readFileSync(file, "utf8")}`)
    .concat(Bun.version)
    .join("\0"),
).toString(16);

const FILE_SOURCE_RE = /<FileSource\s+src="([^"]+)"/g;

/**
 * svelte-bun's `cacheKey`: the inputs above, and for a page, each framed
 * example a `<FileSource>` inlines.
 */
function cacheKey(file: string, source: string): string {
  if (!file.endsWith(PAGE_EXTENSION)) return PREPROCESS_INPUTS;
  const framed = Array.from(source.matchAll(FILE_SOURCE_RE), ([, src]) => {
    const example = path.join(DOCS, "src/pages", `${src}.svelte`);
    return fs.existsSync(example) ? fs.readFileSync(example, "utf8") : "";
  });
  return [PREPROCESS_INPUTS, ...framed].join("\0");
}

/**
 * svelte-bun's options: the dev server loads this module from
 * `bunfig.toml`, and the build and the example render spread `options`
 * with their own `production` and `side`. svelte-bun reads them from the
 * plugin, so there's no `svelte.config.*`.
 */
export const options = {
  root: DOCS,
  cache: true,
  cacheKey,
  extensions: [".svelte", PAGE_EXTENSION],
  preprocess: [
    {
      async markup({
        content,
        filename,
      }: {
        content: string;
        filename: string;
      }) {
        if (!filename.endsWith(PAGE_EXTENSION)) return null;
        return {
          code: await compilePage(content, filename, {
            highlight: highlightCodeBlock,
            remarkPlugins: [requireLeadingHeading, plugin, carbonify],
            rehypePlugins: [rehypeSlug, rehypeHeadingAnchors],
            layouts: {
              guide: path.join(DOCS, "src/layouts/GuideLayout.svelte"),
              _: path.join(DOCS, "src/layouts/ComponentLayout.svelte"),
            },
          }),
        };
      },
    },
    {
      markup({ content, filename }: { content: string; filename: string }) {
        if (NODE_MODULES_REGEX.test(filename)) return null;
        if (!filename.match(PAGES_COMPONENTS_REGEX)) {
          return filename.endsWith(PAGE_EXTENSION)
            ? { code: importGuideHelpers(content, filename) }
            : null;
        }

        // Import each documented component's API on its own, so the page
        // doesn't carry every component's.
        const metadata = JSON.parse(METADATA_RE.exec(content)?.[1] ?? "{}");
        const names: string[] = metadata.components ?? [
          path.basename(filename, PAGE_EXTENSION),
        ];
        const apiLocals = names.map((_, i) => `__component_api_${i}`);
        let code = content.replace(
          LAYOUT_OPEN_TAG_RE,
          (tag) =>
            `${tag.slice(0, -1)} headings={${JSON.stringify(tocHeadings(content))}} api={[${apiLocals.join(", ")}]}>`,
        );
        code = code.replace(
          SCRIPT_TAG_REGEX,
          (open) =>
            `${open}\n${names.map((name, i) => `  import ${apiLocals[i]} from "virtual:component-api/${name}";`).join("\n")}`,
        );

        if (!code.includes("import Preview")) {
          code = code.replace(
            SCRIPT_TAG_REGEX,
            '$1\n  import Preview from "../../components/Preview.svelte";',
          );
        }

        if (DOC_KBD_USAGE_RE.test(code) && !DOC_KBD_IMPORT_RE.test(code)) {
          if (SCRIPT_TAG_REGEX.test(code)) {
            code = code.replace(SCRIPT_TAG_REGEX, `$1\n${DOC_KBD_IMPORT_STMT}`);
          } else {
            code = `<script>\n${DOC_KBD_IMPORT_STMT}\n</script>\n\n${code}`;
          }
        }

        return { code };
      },
    },
  ],
} satisfies SvelteBunOptions;

export default svelte(options);
