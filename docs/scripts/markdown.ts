import fs from "node:fs";
import path from "node:path";
import { format as prettierFormat } from "prettier";
import prettierPluginSvelte from "prettier-plugin-svelte";
import { parse } from "svelte/compiler";
import { stripDocsOnly } from "./strip-docs-only.ts";

export type ComponentApiProp = {
  name: string;
  description?: string;
  type?: string;
  value?: unknown;
  isRequired?: boolean;
  reactive?: boolean;
};

export type ComponentApiTypedef = {
  ts?: string;
};

export type ComponentApiSlot = {
  default?: boolean;
  name?: string | null;
  slot_props?: string;
};

export type ComponentApiEvent = {
  type?: string;
  name?: string;
  detail?: string;
  description?: string;
};

export type ComponentApiEntry = {
  moduleName: string;
  props?: ComponentApiProp[];
  typedefs?: ComponentApiTypedef[];
  slots?: ComponentApiSlot[];
  events?: ComponentApiEvent[];
  rest_props?: { type: string; name: string };
};

export type ComponentApiFile = {
  components: ComponentApiEntry[];
};

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;
const TAG_LINE_RE = /^\s*</;
const WHITESPACE_RE = /\s+/;

const HTML_TAG_RE = /<\s*(\/?)\s*([A-Za-z][\w:-]*)[^>]*?(\/?)\s*>/g;
const HTML_VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const DOC_KBD_SELF_CLOSING_DQUOT_RE =
  /<DocKbd\b\s+label\s*=\s*"([^"]*)"\s*\/>/g;
const DOC_KBD_SELF_CLOSING_SQUOT_RE =
  /<DocKbd\b\s+label\s*=\s*'([^']*)'\s*\/>/g;

const KBD_HTML_ESCAPE_AMP = /&/g;
const KBD_HTML_ESCAPE_LT = /</g;
const KBD_HTML_ESCAPE_GT = />/g;
const MD_LINE_OPENS_KBD_RE = /^<kbd\b/i;
const MD_LINE_OPENS_KBD_CLOSE_RE = /^<\/kbd>/i;

export const LEADING_SVELTE_SCRIPT_BLOCK_RE =
  /^\s*<script\b[\s\S]*?<\/script[^>]*>\s*\n*/i;
const FILE_SOURCE_SRC_ATTR_RE = /src="([^"]+)"/i;
const FILE_SOURCE_START_RE = /^\s*<FileSource\b/;
const HAS_SCRIPT_TAG_RE = /<script\b/i;
const ICON_NAME_RE = /[A-Z][a-z]*/;

export const componentApi = JSON.parse(
  fs.readFileSync(
    new URL("../src/COMPONENT_API.json", import.meta.url),
    "utf8",
  ),
) as ComponentApiFile;

const componentApiByName = componentApi.components.reduce<Record<string, true>>(
  (a, c) => {
    a[c.moduleName] = true;
    return a;
  },
  {},
);

const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const ATX_HEADING_RE = /^(#{1,6})(\s+)(.*)$/;

export function splitFrontmatter(source: string) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: source };
  return { frontmatter: match[1], body: source.slice(match[0].length) };
}

function escapeKbdInnerText(label: string) {
  return label
    .replace(KBD_HTML_ESCAPE_AMP, "&amp;")
    .replace(KBD_HTML_ESCAPE_LT, "&lt;")
    .replace(KBD_HTML_ESCAPE_GT, "&gt;");
}

export function convertDocKbdToKbdForMarkdown(body: string) {
  return body
    .replace(DOC_KBD_SELF_CLOSING_DQUOT_RE, (_m, label: string) => {
      return `<kbd>${escapeKbdInnerText(label)}</kbd>`;
    })
    .replace(DOC_KBD_SELF_CLOSING_SQUOT_RE, (_m, label: string) => {
      return `<kbd>${escapeKbdInnerText(label)}</kbd>`;
    });
}

function lineOpensKbdMarkdownHtml(line: string) {
  const t = line.trimStart();
  return MD_LINE_OPENS_KBD_RE.test(t) || MD_LINE_OPENS_KBD_CLOSE_RE.test(t);
}

export function inlineFileSources(body: string, pagesDir = "src/pages") {
  const lines = body.split("\n");
  const out: string[] = [];

  let inFence = false;
  const isFence = (line: string) => line.trimStart().startsWith("```");

  for (const line of lines) {
    if (isFence(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    const trimmed = line.trimStart();
    if (
      inFence ||
      !FILE_SOURCE_START_RE.test(trimmed) ||
      !trimmed.includes("src=") ||
      !trimmed.includes("/>")
    ) {
      out.push(line);
      continue;
    }

    const srcMatch = line.match(FILE_SOURCE_SRC_ATTR_RE);
    const src = srcMatch?.[1];
    if (!src) {
      out.push(line);
      continue;
    }

    const rel = src.startsWith("/") ? src.slice(1) : src;
    const filePath = path.join(pagesDir, `${rel}.svelte`);

    try {
      const source = stripDocsOnly(fs.readFileSync(filePath, "utf8"));
      out.push("```svelte");
      out.push(source.trimEnd());
      out.push("```");
      out.push("");
    } catch {
      out.push(line);
    }
  }

  return out.join("\n");
}

function isIconName(text: string): boolean {
  return ICON_NAME_RE.test(text) && !(text in componentApiByName);
}

/** Depth-first walk of legacy (`modern: false`) Svelte template AST nodes (no `svelte/compiler` walk in v5). */
function walkLegacySvelteNode(
  node: unknown,
  enter: (n: Record<string, unknown>) => void,
): void {
  if (node === null || node === undefined || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  if (typeof n.type === "string") enter(n);
  for (const v of Object.values(n)) {
    if (Array.isArray(v)) {
      for (const item of v) walkLegacySvelteNode(item, enter);
    } else if (v !== null && typeof v === "object") {
      walkLegacySvelteNode(v, enter);
    }
  }
}

function injectImportsIntoSvelteSnippet(code: string): string {
  const trimmed = code.trimStart();
  if (HAS_SCRIPT_TAG_RE.test(code)) return code;
  if (FILE_SOURCE_START_RE.test(trimmed)) return code;

  const inlineComponents = new Set<string>();
  const icons = new Set<string>();
  const actions = new Set<string>();

  try {
    const ast = parse(code, { modern: false }) as { html?: unknown };
    const root = ast.html;
    if (!root) return code;

    walkLegacySvelteNode(root, (node) => {
      if (node.type === "InlineComponent" && typeof node.name === "string") {
        if (node.name.startsWith("svelte:")) return;
        if (isIconName(node.name)) icons.add(node.name);
        else inlineComponents.add(node.name);
      } else if (node.type === "MustacheTag") {
        const expr = node.expression as
          { type?: string; name?: string } | undefined;
        if (expr?.type === "Identifier" && expr.name && isIconName(expr.name)) {
          icons.add(expr.name);
        }
      } else if (node.type === "Action" && typeof node.name === "string") {
        actions.add(node.name);
      }
    });
  } catch {
    return code;
  }

  const actionImports = [...actions];
  const ccsImports = [...inlineComponents, ...actionImports].filter(Boolean);
  const iconImports = [...icons].filter(Boolean);

  if (ccsImports.length === 0 && iconImports.length === 0) return code;

  ccsImports.sort();
  iconImports.sort();

  const scriptLines = [
    "<script>",
    ...(ccsImports.length
      ? [
          `  import { ${ccsImports.join(", ")} } from "carbon-components-svelte";`,
        ]
      : []),
    ...iconImports.map(
      (icon) =>
        `  import ${icon} from "carbon-icons-svelte/lib/${icon}.svelte";`,
    ),
    "</script>",
    "",
  ];

  return scriptLines.join("\n") + code.trimStart();
}

/** The open-tag depth after `line`, given the depth before it. */
function applyTagDepth(depthBefore: number, line: string) {
  let depth = depthBefore;
  HTML_TAG_RE.lastIndex = 0;
  let m = HTML_TAG_RE.exec(line);
  while (m) {
    const isClosing = m[1] === "/";
    const tagName = m[2]?.toLowerCase() ?? "";
    const isSelfClosing = m[3] === "/" || HTML_VOID_TAGS.has(tagName);

    if (isClosing) depth = Math.max(0, depth - 1);
    else if (!isSelfClosing) depth += 1;

    m = HTML_TAG_RE.exec(line);
  }
  return depth;
}

export function fenceInlineSvelte(body: string) {
  const lines = body.split("\n");
  const out: string[] = [];

  let inCodeFence = false;
  let inSvelteFence = false;
  let tagDepth = 0;

  const isFence = (line: string) => line.trimStart().startsWith("```");
  const isTagLine = (line: string) => TAG_LINE_RE.test(line);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (isFence(line)) {
      if (inSvelteFence) {
        out.push("```");
        inSvelteFence = false;
        tagDepth = 0;
      }
      inCodeFence = !inCodeFence;
      out.push(line);
      continue;
    }

    if (
      !inCodeFence &&
      !inSvelteFence &&
      isTagLine(line) &&
      !lineOpensKbdMarkdownHtml(line)
    ) {
      out.push("```svelte");
      inSvelteFence = true;
      tagDepth = 0;
    }

    if (inSvelteFence) {
      tagDepth = applyTagDepth(tagDepth, line);
      out.push(line);

      const nextLine = lines[idx + 1] ?? "";
      if (tagDepth === 0 && nextLine.trim() === "") {
        out.push("```");
        inSvelteFence = false;
        tagDepth = 0;
      }
      continue;
    }

    out.push(line);
  }

  if (inSvelteFence) out.push("```");

  return out.join("\n");
}

type MdChunk =
  | { type: "line"; line: string }
  | {
      type: "fence";
      open: string;
      close: string | null;
      lang: string;
      code: string;
    };

export async function formatSvelteFences(markdown: string) {
  const lines = markdown.split("\n");

  const chunks: MdChunk[] = [];
  const isFenceLine = (line: string) => line.trimStart().startsWith("```");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isFenceLine(line)) {
      chunks.push({ type: "line", line });
      continue;
    }

    const open = line;
    const info = line.trim().slice(3).trim();
    const lang = info.split(WHITESPACE_RE)[0]?.toLowerCase() ?? "";

    const codeLines: string[] = [];
    let close: string | null = null;

    for (let j = i + 1; j < lines.length; j++) {
      if (isFenceLine(lines[j])) {
        close = lines[j];
        i = j;
        break;
      }
      codeLines.push(lines[j]);
    }

    if (close === null) i = lines.length;

    chunks.push({
      type: "fence",
      open,
      close,
      lang,
      code: codeLines.join("\n"),
    });
  }

  const fenceChunks = chunks.filter(
    (c): c is Extract<MdChunk, { type: "fence" }> => c.type === "fence",
  );
  const svelteFences = fenceChunks.filter((c) => c.lang === "svelte");

  const formattedCodes = await Promise.all(
    svelteFences.map(async (c) => {
      try {
        const injected = injectImportsIntoSvelteSnippet(c.code);
        const formatted = await prettierFormat(injected, {
          parser: "svelte",
          plugins: [prettierPluginSvelte],
          svelteSortOrder: "scripts-markup-styles-options",
        });
        return String(formatted).trimEnd();
      } catch {
        return null;
      }
    }),
  );

  const out: string[] = [];
  let formattedIdx = 0;

  for (const chunk of chunks) {
    if (chunk.type === "line") {
      out.push(chunk.line);
      continue;
    }

    out.push(chunk.open);
    if (chunk.lang === "svelte") {
      const formatted = formattedCodes[formattedIdx++];
      const codeToUse = formatted ?? chunk.code ?? "";
      if (codeToUse.length > 0) out.push(...codeToUse.split("\n"));
    } else {
      const md = chunk.code ?? "";
      if (md.length > 0) out.push(...md.split("\n"));
    }
    if (chunk.close !== null) out.push(chunk.close);
  }

  return out.join("\n");
}

/**
 * Pass `embeddedCode: false` to leave the code in fences as written. Prettier
 * otherwise reformats it, which turns a deliberate fragment such as an
 * unclosed `<html>` tag into a complete element.
 */
export async function formatMarkdown(
  markdown: string,
  { embeddedCode = true }: { embeddedCode?: boolean } = {},
) {
  try {
    const formatted = await prettierFormat(markdown, {
      parser: "markdown",
      proseWrap: "never",
      embeddedLanguageFormatting: embeddedCode ? "auto" : "off",
    });
    return `${String(formatted).trimEnd()}\n`;
  } catch {
    return markdown;
  }
}

/**
 * Output is always valid UTF-8, but some clients (browsers, editors, download
 * tools) assume Windows-1252/Latin-1 and show mojibake for typographic Unicode
 * (e.g. `â€"` for an em dash). Normalizing to ASCII keeps generated `.md` /
 * `llms-full.txt` readable everywhere without changing meaning much.
 */
export function asciiNormalizeGeneratedMarkdown(text: string): string {
  return (
    text
      // Dashes / quotes / spaces (common in prose)
      .replaceAll("\u2014", "--") // em dash —
      .replaceAll("\u2013", "-") // en dash –
      .replaceAll("\u2212", "-") // minus sign −
      .replaceAll("\u2018", "'")
      .replaceAll("\u2019", "'")
      .replaceAll("\u201c", '"')
      .replaceAll("\u201d", '"')
      .replaceAll("\u2026", "...")
      .replaceAll("\u00a0", " ")
      // Keys / symbols sometimes pasted from macOS docs
      .replaceAll("\u2318", "Cmd") // ⌘
      .replaceAll("\u2325", "Option") // ⌥
      .replaceAll("\u21e7", "Shift") // ⇧
      .replaceAll("\u238b", "Esc") // ⎋ (less common)
      // Strip BOM if present upstream
      .replaceAll("\ufeff", "")
  );
}

export function shiftMarkdownHeadings(md: string) {
  const lines = md.split("\n");
  let inFence = false;
  const isFence = (line: string) => line.trimStart().startsWith("```");

  return lines
    .map((line: string) => {
      if (isFence(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      if (ATX_HEADING_RE.test(line)) return `#${line}`;
      return line;
    })
    .join("\n");
}

/** Removes HTML comments, repeating so a removal cannot leave a new one. */
function stripHtmlComments(text: string) {
  let out = text;
  let prev: string;
  do {
    prev = out;
    out = out.replace(HTML_COMMENT_RE, "");
  } while (out !== prev);
  return out;
}

/**
 * Drops the markup a guide renders as a live demo (a component or an HTML
 * block outside a code fence) and its HTML comments, which have no meaning
 * in Markdown. Run it after
 * `<FileSource>` is inlined and `<DocKbd>` is converted, so the code
 * examples stay as fences and `<kbd>` stays as prose.
 */
export function stripRenderedMarkup(body: string) {
  const out: string[] = [];
  let inFence = false;
  let depth = 0;
  let inDemo = false;

  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    const text = stripHtmlComments(line).trimEnd();

    if (!inDemo && TAG_LINE_RE.test(text) && !lineOpensKbdMarkdownHtml(text)) {
      inDemo = true;
      depth = 0;
    }

    if (inDemo) {
      depth = applyTagDepth(depth, text);
      if (depth === 0) inDemo = false;
      continue;
    }

    if (text.trim() === "" && out.at(-1)?.trim() === "") continue;
    out.push(text);
  }

  return out.join("\n");
}

/**
 * Renders a guide page (`src/pages/<name>.svx`) to Markdown with the same
 * steps as a component page: the frontmatter is split off (its `title`
 * becomes the heading), `<FileSource>` is inlined, and Svelte fences,
 * Markdown, and characters are normalized. Returns the title and the Markdown. Pass `pagesDir` to resolve
 * `<FileSource>` paths elsewhere.
 */
export async function renderGuideMarkdown(
  source: string,
  { name, pagesDir }: { name: string; pagesDir?: string },
) {
  const { frontmatter, body } = splitFrontmatter(source);
  const meta = frontmatter ? (Bun.YAML.parse(frontmatter) ?? {}) : {};
  const title = typeof meta.title === "string" ? meta.title : name;
  const description =
    typeof meta.description === "string" ? `\n\n${meta.description}` : "";

  const content = stripRenderedMarkup(
    inlineFileSources(
      convertDocKbdToKbdForMarkdown(
        body.replace(LEADING_SVELTE_SCRIPT_BLOCK_RE, ""),
      ),
      pagesDir,
    ),
  );

  const md = `# ${title}${description}\n\n${content.trim()}`;
  const svelteFormatted = await formatSvelteFences(md);
  return {
    title,
    md: asciiNormalizeGeneratedMarkdown(
      await formatMarkdown(svelteFormatted, { embeddedCode: false }),
    ),
  };
}
