import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { highlight } from "../src/syntax/index.js";
import { PAGE_EXTENSION } from "./scripts/constants.ts";
import { exampleSource, isInstanceScript } from "./scripts/example-source.ts";
import { createFormatter, formatterVersion } from "./scripts/format.ts";
import type { Node as MdastNode } from "./scripts/markdown.ts";
import { compilePage } from "./scripts/page.ts";
import { requireLeadingHeading } from "./scripts/require-leading-heading.ts";
import { rehypeSlug } from "./scripts/slug.ts";
import { stripDocsOnly } from "./scripts/strip-docs-only.ts";
import { tocHeadings } from "./scripts/toc-headings.ts";
import { visit } from "./scripts/visit.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NODE_MODULES_REGEX = /node_modules/;
const PAGES_COMPONENTS_REGEX = /pages\/(components)/;
const SCRIPT_TAG_REGEX = /(<script[^>]*>)/i;
const METADATA_RE = /export const metadata = (\{.*\});/;
const LAYOUT_OPEN_TAG_RE = /<PageLayout\b[^>]*>/;
const FILE_SOURCE_SRC_REGEX = /src="([^"]+)"/;
/** Prose-only inline HTML: do not wrap in Preview (see visitHtml). */
const NO_PREVIEW_HTML_RE = /^\s*<DocKbd\b/;
/** HTML comments (such as maintainer notes in guide pages) render nothing and must not become a Preview. */
const HTML_COMMENT_RE = /^\s*<!--/;
const DOC_KBD_IMPORT_STMT =
  '  import DocKbd from "../../components/DocKbd.svelte";';
const DOC_KBD_IMPORT_RE = /import\s+DocKbd\s+from/;
const DOC_KBD_USAGE_RE = /<DocKbd\b/;

const SKIP_PREVIEW_FORMAT = process.env.NODE_ENV === "development";

type PreviewCode = { formattedCode: string; highlightedCode: string };

const previewCodeCache = new Map<string, PreviewCode>();

/**
 * Formatted and highlighted example code persists here so a cold build only
 * formats and highlights the examples that changed. Gitignored via `node_modules`.
 */
const PREVIEW_CODE_CACHE_DIR = path.join(
  __dirname,
  "node_modules/.cache/ccs-docs-preview-code",
);

function hashKey(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex").slice(0, 32);
}

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

function highlightSvelte(formattedCode: string): PreviewCode {
  const highlightedCode = highlight(formattedCode, "svelte") ?? "";
  return { formattedCode, highlightedCode };
}

/**
 * Changing the formatter or the highlighter invalidates every entry.
 */
const PREVIEW_CODE_CACHE_SALT = JSON.stringify([
  formatterVersion(),
  hashKey(
    fs.readFileSync(path.join(__dirname, "../src/syntax/tokenize.js"), "utf8"),
  ),
]);

async function readPreviewCodeCache(file: string, key: string) {
  try {
    const entry = JSON.parse(await fs.promises.readFile(file, "utf8"));
    if (
      entry?.key === key &&
      typeof entry.formattedCode === "string" &&
      typeof entry.highlightedCode === "string"
    ) {
      return {
        formattedCode: entry.formattedCode,
        highlightedCode: entry.highlightedCode,
      } as PreviewCode;
    }
  } catch {
    // Missing or corrupt entry: format again.
  }
  return undefined;
}

let previewCodeCacheDirReady: Promise<unknown> | undefined;

async function writePreviewCodeCache(
  file: string,
  key: string,
  code: PreviewCode,
) {
  // Write to a unique temp file, then rename, so parallel builds never see a
  // partial entry.
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    previewCodeCacheDirReady ??= fs.promises.mkdir(PREVIEW_CODE_CACHE_DIR, {
      recursive: true,
    });
    await previewCodeCacheDirReady;
    await fs.promises.writeFile(tmp, JSON.stringify({ key, ...code }));
    await fs.promises.rename(tmp, file);
  } catch {
    await fs.promises.rm(tmp, { force: true }).catch(() => {});
  }
}

async function formatAndHighlightSvelteCached(source: string) {
  const key = createHash("sha256")
    .update(PREVIEW_CODE_CACHE_SALT, "utf8")
    .update("\0")
    .update(source, "utf8")
    .digest("hex");
  const file = path.join(PREVIEW_CODE_CACHE_DIR, `${key}.json`);
  const cached = await readPreviewCodeCache(file, key);
  if (cached) return cached;

  const out = highlightSvelte(await formatSvelte(source));
  await writePreviewCodeCache(file, key, out);
  return out;
}

async function formatAndHighlightSvelte(source: string) {
  const mode = SKIP_PREVIEW_FORMAT ? "raw" : "fmt";
  const cacheKey = `${mode}:${hashKey(source)}`;
  const cached = previewCodeCache.get(cacheKey);
  if (cached) return cached;

  const out = SKIP_PREVIEW_FORMAT
    ? highlightSvelte(source)
    : await formatAndHighlightSvelteCached(source);
  previewCodeCache.set(cacheKey, out);
  return out;
}

function plugin() {
  async function visitHtml(
    node: { lang?: string; value: string } & MdastNode,
    isWholeParagraph: boolean,
    pageScript: string | undefined,
  ) {
    // A paragraph that *opens* with `<DocKbd ...>` parses as a raw HTML
    // block instead of a normal paragraph (CommonMark treats a line
    // starting with a tag as an HTML block), so the whole paragraph becomes
    // this "html" node directly under the document root (not nested inside
    // a "paragraph" node) and never gets `carbonify()`'s `<p>` wrapper/class.
    // Restore both here. A `<DocKbd ...>` used mid-sentence stays nested
    // inside a real "paragraph" node, which is already wrapped correctly,
    // and one inside a table cell must stay inline, so only touch the
    // root-level case.
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
      const { formattedCode, highlightedCode } = await formatAndHighlightSvelte(
        exampleSource(node.value, pageScript),
      );

      node.value = `<Preview codeRaw={${JSON.stringify(formattedCode)}} code={${JSON.stringify(highlightedCode)}}>${node.value}</Preview>`;
    }

    if (node.value.startsWith("<FileSource")) {
      const srcMatch = node.value.match(FILE_SOURCE_SRC_REGEX);
      const src = srcMatch ? srcMatch[1] : "";

      const filePath = path.join(__dirname, "src/pages", `${src}.svelte`);
      const sourceCode = stripDocsOnly(fs.readFileSync(filePath, "utf-8"));
      const { formattedCode, highlightedCode } =
        await formatAndHighlightSvelte(sourceCode);

      node.value = `<Preview framed src="${src}" codeRaw={${JSON.stringify(formattedCode)}} code={${JSON.stringify(highlightedCode)}} />`;
    }
  }

  return async (tree: Parameters<typeof visit>[0]) => {
    // An inline example's code view takes what it uses from the page script.
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

/**
 * Imports `Preview` and `DocKbd` into a guide page that uses them, as the
 * markup preprocessor does for component pages. The remark plugin wraps
 * each live example in `Preview`, so a page never imports it itself.
 */
function importGuideHelpers(code: string, filename: string): string {
  const dir = path
    .relative(path.dirname(filename), path.join(__dirname, "src/components"))
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

/** h2 intro that leads to subsections or a table—not a multi-paragraph demo block. */
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

/** Appends a `#` anchor link to each slugged h2/h3 so its heading can be hovered/copied. */
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

export default {
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
              guide: path.join(__dirname, "src/layouts/GuideLayout.svelte"),
              _: path.join(__dirname, "src/layouts/ComponentLayout.svelte"),
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

        // The layout renders the table of contents from the page's headings,
        // and the API of each component the page documents, imported one by
        // one so the page doesn't carry every component's.
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

        // Auto-import Preview component used by the remark plugin.
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
};
