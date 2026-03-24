import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walk } from "estree-walker";
import type { Blockquote, List, Paragraph } from "mdast";
import { escapeSvelte, mdsvex } from "mdsvex";
import { format } from "prettier";
import prettierPluginSvelte from "prettier-plugin-svelte";
import Prism from "prismjs";
import rehypeSlug from "rehype-slug";
import { parse } from "svelte/compiler";
import visit from "unist-util-visit";
import componentApi from "./src/COMPONENT_API.json" with { type: "json" };
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-typescript.js";
import "prism-svelte";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentApiByName = new Set(
  componentApi.components.map((c) => c.moduleName),
);

const ICON_NAME_REGEX = /[A-Z][a-z]*/;
const NODE_MODULES_REGEX = /node_modules/;
const PAGES_COMPONENTS_REGEX = /pages\/(components)/;
const SCRIPT_TAG_REGEX = /(<script[^>]*>)/i;
const FILE_SOURCE_SRC_REGEX = /src="([^"]+)"/;
/** Heuristics for skipping svelte/compiler parse in createImports (see snippetMayNeedCarbonImportScan). */
const SNIPPET_PASCAL_COMPONENT_RE = /<[A-Z][A-Za-z0-9]*/;
const SNIPPET_USE_ACTION_RE = /use:\s*\w/;
const SNIPPET_ICON_MUSTACHE_RE = /\{\s*[A-Z][A-Za-z0-9]*\s*[},]/;
const SNIPPET_TAG_RE = /<[a-zA-Z]/;
const SNIPPET_MUSTACHE_ANY_RE = /\{/;

const MDSVEX_LANG_ALIASES = {
  js: "javascript",
  ts: "typescript",
  html: "markup",
  svg: "markup",
} as const;

const SKIP_MDSVEX_PRETTIER = process.env.NODE_ENV === "development";

const previewCodeCache = new Map<
  string,
  { formattedCode: string; highlightedCode: string }
>();
const createImportsCache = new Map<string, string>();

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

function mdsvexPrismHighlighter(
  code: string,
  lang: string | null | undefined,
  _meta: string | null | undefined,
  _filename?: string,
  optimize = true,
): string {
  const raw = lang?.toLowerCase().trim() ?? "";
  const classLang = raw || "text";

  const grammarKey = raw ? (MDSVEX_LANG_ALIASES[raw] ?? raw) : "";
  const grammar =
    grammarKey && Prism.languages[grammarKey as keyof typeof Prism.languages]
      ? Prism.languages[grammarKey as keyof typeof Prism.languages]
      : null;

  const inner = grammar
    ? Prism.highlight(code, grammar, grammarKey)
    : escapeHtmlText(code);
  const highlighted = escapeSvelte(inner);

  return optimize
    ? `<pre class="language-${classLang}">{@html \`<code class="language-${classLang}">${highlighted}</code>\`}</pre>`
    : `<pre class="language-${classLang}"><code class="language-${classLang}">${highlighted}</code></pre>`;
}

const prettierSvelte = {
  parser: "svelte" as const,
  plugins: [prettierPluginSvelte],
  svelteSortOrder: "scripts-markup-styles-options" as const,
};

/** Avoid svelte/compiler parse when the snippet cannot reference Carbon components, actions, or icons. */
function snippetMayNeedCarbonImportScan(source: string): boolean {
  if (SNIPPET_PASCAL_COMPONENT_RE.test(source)) return true;
  if (SNIPPET_USE_ACTION_RE.test(source)) return true;
  if (SNIPPET_ICON_MUSTACHE_RE.test(source)) return true;
  if (SNIPPET_TAG_RE.test(source) && SNIPPET_MUSTACHE_ANY_RE.test(source)) {
    return true;
  }
  return false;
}

function createImportsUncached(source: string) {
  const inlineComponents = new Set<string>();
  const icons = new Set<string>();
  const actions = new Set<string>();

  // heuristic to guess if the inline component or expression name is a Carbon icon
  const isIcon = (text: string) =>
    ICON_NAME_REGEX.test(text) && !componentApiByName.has(text);

  walk(parse(source) as unknown as Parameters<typeof walk>[0], {
    enter(node) {
      const n = node as {
        type?: string;
        name?: string;
        expression?: { type?: string; name?: string };
      };
      if (n.type === "InlineComponent" && n.name) {
        if (isIcon(n.name)) {
          icons.add(n.name);
        } else {
          inlineComponents.add(n.name);
        }
      } else if (n.type === "MustacheTag" && n.expression) {
        if (
          n.expression.type === "Identifier" &&
          n.expression.name &&
          isIcon(n.expression.name)
        ) {
          icons.add(n.expression.name);
        }
      } else if (n.type === "Action" && n.name) {
        actions.add(n.name);
      }
    },
  });

  const actionImports = [...actions];
  const ccsImports = [...inlineComponents, ...actionImports];
  const iconImports = [...icons];

  if (ccsImports.length === 0) return "";

  const iconBlock =
    icons.size > 0
      ? `\n${iconImports
          .map(
            (icon) =>
              `  import ${icon} from "carbon-icons-svelte/lib/${icon}.svelte";`,
          )
          .join("\n")}`
      : "";

  return `<script>
  import { ${ccsImports.join(", ")} } from "carbon-components-svelte";${iconBlock}
</script>

`;
}

function createImports(source: string) {
  const cached = createImportsCache.get(source);
  if (cached !== undefined) return cached;
  const result = snippetMayNeedCarbonImportScan(source)
    ? createImportsUncached(source)
    : "";
  createImportsCache.set(source, result);
  return result;
}

async function formatAndHighlightPreviewSvelte(combinedSource: string) {
  const mode = SKIP_MDSVEX_PRETTIER ? "raw" : "fmt";
  const cacheKey = `${mode}:${hashKey(combinedSource)}`;
  const cached = previewCodeCache.get(cacheKey);
  if (cached) return cached;

  const formattedCode = SKIP_MDSVEX_PRETTIER
    ? combinedSource
    : await format(combinedSource, prettierSvelte);
  const highlightedCode = Prism.highlight(
    formattedCode,
    Prism.languages.svelte,
    "svelte",
  );
  const out = { formattedCode, highlightedCode };
  previewCodeCache.set(cacheKey, out);
  return out;
}

async function formatAndHighlightFileSourceSvelte(
  src: string,
  sourceCode: string,
  mtimeMs: number,
) {
  const mode = SKIP_MDSVEX_PRETTIER ? "raw" : "fmt";
  const cacheKey = `file:${src}:${mtimeMs}:${mode}`;
  const cached = previewCodeCache.get(cacheKey);
  if (cached) return cached;

  const formattedCode = SKIP_MDSVEX_PRETTIER
    ? sourceCode
    : await format(sourceCode, prettierSvelte);
  const highlightedCode = Prism.highlight(
    formattedCode,
    Prism.languages.svelte,
    "svelte",
  );
  const out = { formattedCode, highlightedCode };
  previewCodeCache.set(cacheKey, out);
  return out;
}

function plugin() {
  /** mdsvex / remark can surface `html` nodes that carry fenced-block metadata on `lang`. */
  async function visitHtml(
    node: { lang?: string; value: string } & import("unist").Node,
  ) {
    if (
      node.lang !== "svelte" &&
      !node.value.startsWith("<FileSource") &&
      !node.value.startsWith("<script>")
    ) {
      const scriptBlock = createImports(node.value);
      const { formattedCode, highlightedCode } =
        await formatAndHighlightPreviewSvelte(scriptBlock + node.value);

      node.value = `<Preview codeRaw={${JSON.stringify(formattedCode)}} code={${JSON.stringify(highlightedCode)}}>${node.value}</Preview>`;
    }

    if (node.value.startsWith("<FileSource")) {
      const srcMatch = node.value.match(FILE_SOURCE_SRC_REGEX);
      const src = srcMatch ? srcMatch[1] : "";

      const filePath = path.join(__dirname, "src/pages", `${src}.svelte`);
      const sourceCode = fs.readFileSync(filePath, "utf-8");
      const mtimeMs = fs.statSync(filePath).mtimeMs;
      const { formattedCode, highlightedCode } =
        await formatAndHighlightFileSourceSvelte(src, sourceCode, mtimeMs);

      node.value = `<Preview framed src="${src}" codeRaw={${JSON.stringify(formattedCode)}} code={${JSON.stringify(highlightedCode)}} />`;
    }
  }

  return async (tree) => {
    const jobs: Promise<void>[] = [];
    visit(tree, "html", (node) => {
      jobs.push(visitHtml(node as Parameters<typeof visitHtml>[0]));
    });
    await Promise.all(jobs);
  };
}

const H2_REGEX = /<h2[^>]+id="([^"]+)"[^>]*>([^<]+)<\/h2>/g;
const ADMONITION_RE = /^\[!(NOTE|WARNING|TIP|CAUTION)\]\s*/i;
const ADMONITION_LINK_REF_RE = /^!(NOTE|WARNING|TIP|CAUTION)$/;
const LEADING_WHITESPACE_RE = /^\n\s*/;

const NOTIFICATION_ICONS = {
  info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path fill="none" d="M16,8a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,13.875H17.125v-8H13v2.25h1.875v5.75H12v2.25h8Z" data-icon-path="inner-path"></path><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,6a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,16.125H12v-2.25h2.875v-5.75H13v-2.25h4.125v8H20Z"></path></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path d="M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14C30,8.3,23.7,2,16,2z M14.9,8h2.2v11h-2.2V8z M16,25c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22c0.8,0,1.5,0.7,1.5,1.5S16.8,25,16,25z"></path><path fill="none" d="M17.5,23.5c0,0.8-0.7,1.5-1.5,1.5c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22C16.8,22,17.5,22.7,17.5,23.5z M17.1,8h-2.2v11h2.2V8z" data-icon-path="inner-path" opacity="0"></path></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2ZM14,21.5908l-5-5L10.5906,15,14,18.4092,21.41,11l1.5957,1.5859Z"></path><path fill="none" d="M14 21.591L9 16.591 10.591 15 14 18.409 21.41 11 23.005 12.585 14 21.591z" data-icon-path="inner-path"></path></svg>',
  error:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path fill="none" d="M14.9 7.2H17.1V24.799H14.9z" data-icon-path="inner-path" transform="rotate(-45 16 16)"></path><path d="M16,2A13.914,13.914,0,0,0,2,16,13.914,13.914,0,0,0,16,30,13.914,13.914,0,0,0,30,16,13.914,13.914,0,0,0,16,2Zm5.4449,21L9,10.5557,10.5557,9,23,21.4448Z"></path></svg>',
};

const NOTIFICATION_KINDS = {
  NOTE: "info",
  WARNING: "warning",
  TIP: "success",
  CAUTION: "error",
};

const NOTIFICATION_TITLES = {
  NOTE: "Note:",
  WARNING: "Warning:",
  TIP: "Tip:",
  CAUTION: "Caution:",
};

function serializeInlineNodes(nodes) {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return node.value;
        case "inlineCode":
          return `<code>${node.value}</code>`;
        case "strong":
          return `<strong>${serializeInlineNodes(node.children)}</strong>`;
        case "emphasis":
          return `<em>${serializeInlineNodes(node.children)}</em>`;
        case "link":
          return `<a class="bx--link" href="${node.url}">${serializeInlineNodes(node.children)}</a>`;
        case "break":
          return "<br/>";
        default:
          return "";
      }
    })
    .join("");
}

function carbonify() {
  return (tree: Parameters<typeof visit>[0]) => {
    visit(tree, (node, index, parent) => {
      switch (node.type) {
        case "link":
          node.data = { hProperties: { class: "bx--link" } };
          return;
        case "list": {
          const list = node as List;
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
        case "blockquote":
          break;
        default:
          return;
      }

      {
        if (!parent || index == null) return;

        const bq = node as Blockquote;
        const firstChild = bq.children[0];
        if (!firstChild || firstChild.type !== "paragraph") return;

        const para = firstChild as Paragraph;
        const first = para.children[0];
        if (!first) return;

        let type: string | null = null;

        if (first.type === "text") {
          // [!NOTE] parsed as plain text
          const match = first.value.match(ADMONITION_RE);
          if (!match) return;
          type = match[1].toUpperCase();
          first.value = first.value.slice(match[0].length);
          if (!first.value) {
            firstChild.children.shift();
            if (firstChild.children[0]?.type === "break") {
              firstChild.children.shift();
            }
          }
        } else if (first.type === "linkReference") {
          // remark may parse [!NOTE] as a shortcut link reference
          const id = (first.identifier || "").toUpperCase();
          const admonitionMatch = id.match(ADMONITION_LINK_REF_RE);
          if (!admonitionMatch) return;
          type = admonitionMatch[1];
          firstChild.children.shift();
          // Clean up leading whitespace/break after the marker
          while (firstChild.children.length > 0) {
            const next = firstChild.children[0];
            if (next.type === "break") {
              firstChild.children.shift();
            } else if (next.type === "text") {
              next.value = next.value.replace(LEADING_WHITESPACE_RE, "");
              if (!next.value) firstChild.children.shift();
              break;
            } else {
              break;
            }
          }
        } else {
          return;
        }

        if (!type) return;

        const kind =
          NOTIFICATION_KINDS[type as keyof typeof NOTIFICATION_KINDS];
        const title =
          NOTIFICATION_TITLES[type as keyof typeof NOTIFICATION_TITLES];
        const icon = NOTIFICATION_ICONS[kind];

        // If the first paragraph is now empty, remove it
        if (para.children.length === 0) {
          bq.children.shift();
        }

        // Serialize paragraph children directly to avoid <p> wrappers
        const body = bq.children
          .map((child) =>
            child.type === "paragraph"
              ? serializeInlineNodes((child as Paragraph).children)
              : "",
          )
          .join("<br/>");

        const html = {
          type: "html",
          value: `<div role="alert" class="bx--inline-notification bx--inline-notification--low-contrast bx--inline-notification--hide-close-button bx--inline-notification--${kind}"><div class="bx--inline-notification__details">${icon}<div class="bx--inline-notification__text-wrapper"><p class="bx--inline-notification__title">${title}</p><div class="body-short-01">${body}</div></div></div></div>`,
        };

        (parent as { children: unknown[] }).children.splice(index, 1, html);
      }
    });
  };
}

export default {
  extensions: [".svelte", ".svx"],
  preprocess: [
    mdsvex({
      smartypants: false,
      highlight: { highlighter: mdsvexPrismHighlighter },
      remarkPlugins: [plugin, carbonify],
      rehypePlugins: [rehypeSlug],
      layout: {
        _: path.join(__dirname, "src/layouts/ComponentLayout.svelte"),
      },
    }),
    {
      markup({ content, filename }) {
        if (NODE_MODULES_REGEX.test(filename)) return null;
        if (!filename.match(PAGES_COMPONENTS_REGEX)) return null;

        const toc: { id: string; text: string }[] = [];

        for (const match of content.matchAll(H2_REGEX)) {
          toc.push({ id: match[1], text: match[2] });
        }

        let code = content.replace(
          "</Layout_MDSVEX_DEFAULT>",
          `<div slot="aside">
                <ul class="bx--list--unordered">
                    ${toc
                      .map(
                        (item) =>
                          `<li class="bx--list__item"><a class="bx--link" href="#${item.id}">${item.text}</a></li>`,
                      )
                      .join("")}
                  <h5>Component API</h5>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#props">Props</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#typedefs">Typedefs</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#slots">Slots</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#forwarded-events">Forwarded events</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#dispatched-events">Dispatched events</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#rest-props">restProps</a>
                  </li>
                </ul>
              </div>
            </Layout_MDSVEX_DEFAULT>`,
        );

        // Auto-import Preview component used by the mdsvex remark plugin.
        if (!code.includes("import Preview")) {
          code = code.replace(
            SCRIPT_TAG_REGEX,
            '$1\n  import Preview from "../../components/Preview.svelte";',
          );
        }

        return { code };
      },
    },
  ],
};
