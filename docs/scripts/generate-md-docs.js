// @ts-check
import fs from "node:fs";
import path from "node:path";
import { format as prettierFormat } from "prettier";
import { parse, walk } from "svelte/compiler";

const COMPONENTS_PATH = "./src/pages/components";
const RAW_COMPONENTS_OUT_DIR = "./public/components";

const files = fs.readdirSync(COMPONENTS_PATH);

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;
const COMPONENTS_KEY_RE = /^components\s*:/m;
const QUOTED_COMPONENT_RE = /"([^"]+)"|'([^']+)'/g;
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

const DIV_WRAPPER_RE = /<\/?div\b[^>]*>/gi;
const STRONG_TAG_CONTENT_RE = /<strong\b[^>]*>([\s\S]*?)<\/strong>/gi;
const TAG_STRIP_RE = /<[^>]+>/g;
const ANY_HTML_TAG_RE = /<\/?[^>]+>/g;
const TRAILING_WS_BEFORE_NL_RE = /[ \t]+\n/g;
const MULTI_NL_RE = /\n{3,}/g;

// Generic regex to match any component with svx-ignore attribute
const SVX_IGNORE_COMPONENT_RE = /<([A-Z][\w]*)\b[^>]*\bsvx-ignore[^>]*>/i;

const LEADING_SVELTE_SCRIPT_BLOCK_RE = /^\s*<script\b[\s\S]*?<\/script>\s*\n*/i;
const FILE_SOURCE_SRC_ATTR_RE = /src="([^"]+)"/i;
const FILE_SOURCE_START_RE = /^\s*<FileSource\b/;
const HAS_SCRIPT_TAG_RE = /<script\b/i;
const ICON_NAME_RE = /[A-Z][a-z]*/;

const componentApi = JSON.parse(
  fs.readFileSync(path.join("src", "COMPONENT_API.json"), "utf8"),
);

/** @type {Record<string, true>} */
const componentApiByName = componentApi.components.reduce((a, c) => {
  a[c.moduleName] = true;
  return a;
}, {});

/** @type {Map<string, any>} */
const componentApiByModuleName = new Map(
  componentApi.components.map((c) => [c.moduleName, c]),
);

const PIPE_RE = /\|/g;
const NEWLINE_RE = /\r?\n/g;
const AT_EXAMPLE_RE = /@example/;
const SVELTE_FENCE_RE = /```svelte\s*\n([\s\S]*?)```/;

/**
 * @param {string} source
 */
function splitFrontmatter(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: source };
  return { frontmatter: match[1], body: source.slice(match[0].length) };
}

/**
 * Extract component names from a `components: [...]` YAML flow sequence.
 *
 * @param {string | null} frontmatter
 * @returns {string[]}
 */
function extractComponents(frontmatter) {
  if (!frontmatter) return [];

  const keyIdx = frontmatter.search(COMPONENTS_KEY_RE);
  if (keyIdx === -1) return [];

  const afterKey = frontmatter.slice(keyIdx);
  const bracketStart = afterKey.indexOf("[");
  if (bracketStart === -1) return [];

  let i = bracketStart;
  let depth = 0;
  for (; i < afterKey.length; i++) {
    const ch = afterKey[i];
    if (ch === "[") depth++;
    if (ch === "]") {
      depth--;
      if (depth === 0) {
        i++; // include closing ]
        break;
      }
    }
  }

  const listText = afterKey.slice(bracketStart, i);
  const out = [];
  let match = QUOTED_COMPONENT_RE.exec(listText);
  while (match) {
    out.push(match[1] ?? match[2]);
    match = QUOTED_COMPONENT_RE.exec(listText);
  }

  return out;
}

/**
 * @param {string} text
 */
function escapeTableCell(text) {
  return String(text ?? "")
    .replace(PIPE_RE, "\\|")
    .replace(NEWLINE_RE, "<br />")
    .trim();
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 */
function renderMarkdownTable(headers, rows) {
  const headerLine = `| ${headers.map(escapeTableCell).join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map(
    (cells) => `| ${cells.map(escapeTableCell).join(" | ")} |`,
  );
  return [headerLine, sepLine, ...rowLines].join("\n");
}

/**
 * @param {string} description
 * @returns {{ mainDescription: string; exampleCode: string | null }}
 */
function parseDescription(description) {
  if (!description) return { mainDescription: "", exampleCode: null };

  const exampleIndex = description.search(AT_EXAMPLE_RE);
  if (exampleIndex === -1) {
    return { mainDescription: description.trim(), exampleCode: null };
  }

  const mainDescription = description.slice(0, exampleIndex).trim();
  const exampleSection = description.slice(exampleIndex);
  const codeBlockMatch = exampleSection.match(SVELTE_FENCE_RE);
  const exampleCode = codeBlockMatch ? codeBlockMatch[1].trim() : null;

  return { mainDescription, exampleCode };
}

/**
 * @param {any} component
 * @param {string} componentName
 */
function renderPropsSection(component, componentName) {
  const props = Array.isArray(component.props) ? component.props : [];
  if (props.length === 0) return "";

  const sorted = [...props].sort((a, b) => {
    if (a.isRequired !== b.isRequired) return b.isRequired ? 1 : -1;
    if (a.reactive !== b.reactive) return b.reactive ? 1 : -1;
    return 0;
  });

  const rows = sorted.map((prop) => {
    const markers = [
      prop.reactive ? "Reactive" : null,
      prop.isRequired ? "Required" : null,
    ].filter(Boolean);

    const nameCell = [
      `\`${prop.name}\``,
      markers.length ? `(${markers.join(", ")})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const { mainDescription } = parseDescription(prop.description ?? "");

    const typeCell = prop.type ? `\`${prop.type}\`` : "";

    const value = prop.value;
    const defaultCell =
      value === undefined || value === "undefined"
        ? "_undefined_"
        : `\`${String(value)}\``;

    return [nameCell, typeCell, mainDescription, defaultCell];
  });

  return `### \`${componentName}\` Props\n\n${renderMarkdownTable(
    ["Prop", "Type", "Description", "Default"],
    rows,
  )}`;
}

/**
 * @param {any} component
 * @param {string} componentName
 */
function renderTypedefsSection(component, componentName) {
  const typedefs = Array.isArray(component.typedefs) ? component.typedefs : [];
  if (typedefs.length === 0) return "";

  const ts = typedefs
    .map((t) => t?.ts)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!ts) return "";

  return `### \`${componentName}\` Typedefs\n\n\`\`\`ts\n${ts}\n\`\`\``;
}

/**
 * @param {any} component
 * @param {string} componentName
 */
function renderSlotsSection(component, componentName) {
  const slots = Array.isArray(component.slots) ? component.slots : [];
  if (slots.length === 0) return "";

  const rows = slots.map((slot) => {
    const name =
      slot?.default || slot?.name == null ? "default" : String(slot.name);
    const detail = slot?.slot_props ? String(slot.slot_props) : "";
    return [`\`${name}\``, detail ? `\`${detail}\`` : ""];
  });

  return `### \`${componentName}\` Slots\n\n${renderMarkdownTable(["Slot", "Detail"], rows)}`;
}

/**
 * @param {any} component
 * @param {string} componentName
 */
function renderEventsSection(component, componentName) {
  const events = Array.isArray(component.events) ? component.events : [];
  const forwarded = events.filter((e) => e?.type === "forwarded");
  const dispatched = events.filter((e) => e?.type === "dispatched");

  if (forwarded.length === 0 && dispatched.length === 0) return "";

  const forwardedMd =
    forwarded.length === 0
      ? ""
      : `### \`${componentName}\` Forwarded events\n\n${renderMarkdownTable(
          ["Event"],
          forwarded.map((e) => [`\`on:${e.name}\``]),
        )}`;

  const hasDispatchedDescription = dispatched.some((e) => e?.description);
  const dispatchedHeaders = hasDispatchedDescription
    ? ["Event", "Detail", "Description"]
    : ["Event", "Detail"];

  const dispatchedRows =
    dispatched.length === 0
      ? null
      : dispatched.map((e) => {
          const base = [
            `\`on:${e.name}\``,
            e.detail ? `\`${String(e.detail)}\`` : "",
          ];
          if (hasDispatchedDescription) base.push(e.description ?? "");
          return base;
        });

  const dispatchedMd =
    dispatched.length === 0
      ? ""
      : `### \`${componentName}\` Dispatched events\n\n${renderMarkdownTable(
          dispatchedHeaders,
          dispatchedRows ?? [],
        )}`;

  const sections = [forwardedMd, dispatchedMd].filter(Boolean);
  return sections.join("\n\n");
}

/**
 * @param {any} component
 * @param {string} componentName
 */
function renderRestPropsSection(component, componentName) {
  const rest = component?.rest_props;
  if (!rest) return "";

  if (rest.type === "Element") {
    return `### \`${componentName}\` $$restProps\n\n\`${component.moduleName}\` spreads \`$$restProps\` to the \`${rest.name}\` element.`;
  }

  return `### \`${componentName}\` $$restProps\n\n\`${component.moduleName}\` spreads \`$$restProps\` to the \`${rest.name}\` component.`;
}

/**
 * @param {string} moduleName
 */
function renderComponentApiMarkdown(moduleName) {
  const entry = componentApiByModuleName.get(moduleName);
  if (!entry) {
    throw new Error(`API data not found for component: ${moduleName}`);
  }

  const sections = [
    renderPropsSection(entry, moduleName),
    renderTypedefsSection(entry, moduleName),
    renderSlotsSection(entry, moduleName),
    renderEventsSection(entry, moduleName),
    renderRestPropsSection(entry, moduleName),
  ].filter(Boolean);

  return sections.join("\n\n");
}

/**
 * @param {string} openTag
 * @param {string} name
 */
function getAttr(openTag, name) {
  const m = openTag.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return m?.[1] ?? null;
}

/**
 * @param {string} html
 */
function inlineNotificationBodyToMarkdown(html) {
  let s = html;
  s = s.replace(DIV_WRAPPER_RE, "");
  s = s.replace(STRONG_TAG_CONTENT_RE, (_, t) => {
    const text = String(t).replace(TAG_STRIP_RE, "").trim();
    return text ? `\`${text}\`` : "";
  });
  s = s.replace(ANY_HTML_TAG_RE, "");
  s = s.replace(TRAILING_WS_BEFORE_NL_RE, "\n");
  s = s.replace(MULTI_NL_RE, "\n\n");
  return s.trim();
}

/**
 * Convert InlineNotification component to markdown admonition
 * @param {string} openTag
 * @param {string} innerContent
 * @returns {string[]}
 */
function convertInlineNotification(openTag, innerContent) {
  const kind = getAttr(openTag, "kind")?.toLowerCase();
  const title = getAttr(openTag, "title")?.toLowerCase() ?? "";

  let label = "NOTE";
  if (kind === "warning") label = "WARNING";
  else if (kind === "error" || kind === "danger") label = "CAUTION";
  else if (kind === "success") label = "TIP";
  else if (title.includes("note")) label = "NOTE";

  const mdBody = inlineNotificationBodyToMarkdown(innerContent);
  const bodyLines = mdBody.length ? mdBody.split("\n") : [];

  const out = [`> [!${label}]`];
  for (const l of bodyLines) out.push(l.trim() ? `> ${l}` : ">");
  out.push("");
  return out;
}

/**
 * Convert UnorderedList component to markdown list
 * @param {string} _openTag
 * @param {string} innerContent
 * @returns {string[]}
 */
function convertUnorderedList(_openTag, innerContent) {
  const listItemRe = /<ListItem\b[^>]*>([\s\S]*?)<\/ListItem>/gi;
  const items = [];
  let match = listItemRe.exec(innerContent);

  while (match !== null) {
    let itemText = match[1];
    // Convert <strong> tags to markdown bold
    itemText = itemText.replace(STRONG_TAG_CONTENT_RE, (_, t) => {
      const text = String(t).replace(TAG_STRIP_RE, "").trim();
      return text ? `**${text}**` : "";
    });
    // Strip remaining HTML tags
    itemText = itemText.replace(ANY_HTML_TAG_RE, "");
    // Clean up whitespace
    itemText = itemText.replace(TRAILING_WS_BEFORE_NL_RE, "\n");
    itemText = itemText.replace(MULTI_NL_RE, "\n\n");
    itemText = itemText.trim();
    if (itemText) items.push(`- ${itemText}`);
    match = listItemRe.exec(innerContent);
  }

  const out = items.length > 0 ? items : [];
  if (out.length > 0) out.push("");
  return out;
}

/**
 * Convert CodeSnippet component to markdown code block
 * @param {string} openTag
 * @param {string} innerContent
 * @returns {string[]}
 */
function convertCodeSnippet(openTag, innerContent) {
  // Try to get code from prop first
  let code = getAttr(openTag, "code");

  // If no code prop, extract from slot content
  if (!code) {
    // Strip HTML tags and get text content
    code = innerContent.replace(ANY_HTML_TAG_RE, "").trim();
  }

  if (!code) return [];

  // Use empty language for code fence
  const lang = "";

  const out = [`\`\`\`${lang}`];
  out.push(...code.split("\n"));
  out.push("```");
  out.push("");
  return out;
}

/**
 * Find matching closing tag for a component (handles self-closing tags)
 * @param {string} componentName
 * @param {string[]} lines
 * @param {number} startIdx
 * @returns {{ endIdx: number; block: string; isSelfClosing: boolean } | null}
 */
function findComponentBlock(componentName, lines, startIdx) {
  const openTagRe = new RegExp(`<${componentName}\\b([^>]*?)(/?)>`, "i");
  const closeTagRe = new RegExp(`</${componentName}>`, "i");

  const openMatch = lines[startIdx].match(openTagRe);
  if (!openMatch) return null;

  // Check if it's a self-closing tag
  const isSelfClosing =
    openMatch[2] === "/" || lines[startIdx].trimEnd().endsWith("/>");

  if (isSelfClosing) {
    return {
      endIdx: startIdx,
      block: lines[startIdx],
      isSelfClosing: true,
    };
  }

  /** @type {string[]} */
  const blockLines = [lines[startIdx]];
  let foundClose = !!lines[startIdx].match(closeTagRe);
  let depth = 1;
  let i = startIdx;

  while (depth > 0 && i + 1 < lines.length) {
    i++;
    const line = lines[i];
    blockLines.push(line);

    if (openTagRe.test(line)) depth++;
    if (closeTagRe.test(line)) {
      depth--;
      if (depth === 0) foundClose = true;
    }
  }

  if (!foundClose) return null;

  return {
    endIdx: i,
    block: blockLines.join("\n"),
    isSelfClosing: false,
  };
}

/**
 * Extract inner content from component block
 * @param {string} componentName
 * @param {string} block
 * @returns {string}
 */
function extractInnerContent(componentName, block) {
  const openTagRe = new RegExp(`<${componentName}\\b[^>]*>`, "i");
  const closeTagRe = new RegExp(`</${componentName}>`, "i");

  const openMatch = block.match(openTagRe);
  if (!openMatch || openMatch.index === undefined) return "";

  const startIdx = openMatch.index + openMatch[0].length;
  const closeMatch = block.slice(startIdx).match(closeTagRe);
  if (!closeMatch || closeMatch.index === undefined) return "";

  return block.slice(startIdx, startIdx + closeMatch.index);
}

/**
 * Convert svx-ignore components to markdown
 * @param {string} body
 */
function transformSvxIgnoreComponents(body) {
  const lines = body.split("\n");
  /** @type {string[]} */
  const out = [];

  let inFence = false;
  const isFence = (line) => line.trimStart().startsWith("```");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isFence(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // Check if line contains a component with svx-ignore
    const svxIgnoreMatch = line.match(SVX_IGNORE_COMPONENT_RE);
    if (!svxIgnoreMatch) {
      out.push(line);
      continue;
    }

    const componentName = svxIgnoreMatch[1];
    const componentBlock = findComponentBlock(componentName, lines, i);

    if (!componentBlock) {
      out.push(line);
      continue;
    }

    // Extract open tag
    const openTagMatch = componentBlock.block.match(
      new RegExp(`<${componentName}\\b([^>]*?)(/?)>`, "i"),
    );
    const openTag = openTagMatch
      ? `<${componentName}${openTagMatch[1]}${openTagMatch[2]}>`
      : "";

    // Extract inner content (empty for self-closing tags)
    const innerContent = componentBlock.isSelfClosing
      ? ""
      : extractInnerContent(componentName, componentBlock.block);

    // Route to appropriate converter
    let convertedLines = [];
    if (componentName === "InlineNotification") {
      convertedLines = convertInlineNotification(openTag, innerContent);
    } else if (componentName === "UnorderedList") {
      convertedLines = convertUnorderedList(openTag, innerContent);
    } else if (componentName === "CodeSnippet") {
      convertedLines = convertCodeSnippet(openTag, innerContent);
    } else {
      // Unknown component - just skip it (or could output as-is)
      out.push(line);
      i = componentBlock.endIdx;
      continue;
    }

    out.push(...convertedLines);
    i = componentBlock.endIdx;
  }

  return out.join("\n");
}

/**
 * @param {string} body
 */
function inlineFileSources(body) {
  const lines = body.split("\n");
  /** @type {string[]} */
  const out = [];

  let inFence = false;
  const isFence = (line) => line.trimStart().startsWith("```");

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
    const filePath = path.join("src/pages", `${rel}.svelte`);

    try {
      const source = fs.readFileSync(filePath, "utf8");
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

/**
 * @param {string} text
 */
function isIconName(text) {
  return ICON_NAME_RE.test(text) && !(text in componentApiByName);
}

/**
 * @param {string} code
 */
function injectImportsIntoSvelteSnippet(code) {
  const trimmed = code.trimStart();
  if (HAS_SCRIPT_TAG_RE.test(code)) return code;
  if (FILE_SOURCE_START_RE.test(trimmed)) return code;

  const inlineComponents = new Set();
  const icons = new Set();
  const actions = new Set();

  try {
    /** @type {any} */
    const ast = parse(code);
    walk(ast.html, {
      /** @param {any} node */
      enter(node) {
        if (node.type === "InlineComponent") {
          if (isIconName(node.name)) icons.add(node.name);
          else inlineComponents.add(node.name);
        } else if (node.type === "MustacheTag") {
          if (
            node.expression?.type === "Identifier" &&
            isIconName(node.expression.name)
          ) {
            icons.add(node.expression.name);
          }
        } else if (node.type === "Action") {
          actions.add(node.name);
        }
      },
    });
  } catch {
    return code;
  }

  const actionImports = Array.from(actions.keys());
  const ccsImports = [
    ...Array.from(inlineComponents.keys()),
    ...actionImports,
  ].filter(Boolean);
  const iconImports = Array.from(icons.keys()).filter(Boolean);

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

/**
 * @param {string} body
 */
function fenceInlineSvelte(body) {
  const lines = body.split("\n");
  /** @type {string[]} */
  const out = [];

  let inCodeFence = false;
  let inSvelteFence = false;
  let tagDepth = 0;

  const isFence = (line) => line.trimStart().startsWith("```");
  const isTagLine = (line) => TAG_LINE_RE.test(line);

  /**
   * @param {string} line
   */
  const applyTagDepth = (line) => {
    HTML_TAG_RE.lastIndex = 0;
    let m = HTML_TAG_RE.exec(line);
    while (m) {
      const isClosing = m[1] === "/";
      const tagName = m[2]?.toLowerCase() ?? "";
      const isSelfClosing = m[3] === "/" || HTML_VOID_TAGS.has(tagName);

      if (isClosing) tagDepth = Math.max(0, tagDepth - 1);
      else if (!isSelfClosing) tagDepth += 1;

      m = HTML_TAG_RE.exec(line);
    }
  };

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

    if (!inCodeFence && !inSvelteFence && isTagLine(line)) {
      out.push("```svelte");
      inSvelteFence = true;
      tagDepth = 0;
    }

    if (inSvelteFence) {
      applyTagDepth(line);
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

/**
 * @param {string} markdown
 */
async function formatSvelteFences(markdown) {
  const lines = markdown.split("\n");
  /**
   * @typedef {{ type: "line"; line: string } | { type: "fence"; open: string; close: string | null; lang: string; code: string }} Chunk
   */

  /** @type {Chunk[]} */
  const chunks = [];
  const isFenceLine = (line) => line.trimStart().startsWith("```");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isFenceLine(line)) {
      chunks.push({ type: "line", line });
      continue;
    }

    const open = line;
    const info = line.trim().slice(3).trim();
    const lang = info.split(WHITESPACE_RE)[0]?.toLowerCase() ?? "";

    /** @type {string[]} */
    const codeLines = [];
    let close = null;

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

  /** @type {Extract<Chunk, { type: "fence" }>[]} */
  const fenceChunks = chunks.filter((c) => c.type === "fence");
  const svelteFences = fenceChunks.filter((c) => c.lang === "svelte");

  const formattedCodes = await Promise.all(
    svelteFences.map(async (c) => {
      try {
        const injected = injectImportsIntoSvelteSnippet(c.code);
        const formatted = await prettierFormat(injected, {
          parser: "svelte",
          svelteSortOrder: "scripts-markup-styles-options",
        });
        return String(formatted).trimEnd();
      } catch {
        return null;
      }
    }),
  );

  /** @type {string[]} */
  const out = [];
  let formattedIdx = 0;

  for (const chunk of chunks) {
    if (chunk.type === "line") {
      out.push(chunk.line);
      continue;
    }

    out.push(chunk.open);
    if (chunk.lang === "svelte") {
      const formatted = formattedCodes[formattedIdx++];
      const codeToUse = formatted ?? chunk.code;
      if (codeToUse.length > 0) out.push(...codeToUse.split("\n"));
    } else {
      if (chunk.code.length > 0) out.push(...chunk.code.split("\n"));
    }
    if (chunk.close !== null) out.push(chunk.close);
  }

  return out.join("\n");
}

/**
 * @param {string} markdown
 */
async function formatMarkdown(markdown) {
  try {
    const formatted = await prettierFormat(markdown, {
      parser: "markdown",
      proseWrap: "always",
      printWidth: 80,
    });
    return `${String(formatted).trimEnd()}\n`;
  } catch {
    return markdown;
  }
}

// Fresh output every run.
fs.rmSync(RAW_COMPONENTS_OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(RAW_COMPONENTS_OUT_DIR, { recursive: true });

/** @type {{ componentName: string; md: string }[]} */
const generatedMdByComponent = [];

for (const file of files) {
  if (!file.endsWith(".svx")) continue;
  const [componentName] = file.split(".");

  const filePath = path.join(COMPONENTS_PATH, file);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(fileContent);
  const components = extractComponents(frontmatter);

  const componentsForUsage =
    components.length > 0 ? components : [componentName];

  const bodyWithoutLeadingScript = body.replace(
    LEADING_SVELTE_SCRIPT_BLOCK_RE,
    "",
  );
  const bodyWithInlinedFileSources = inlineFileSources(
    bodyWithoutLeadingScript,
  );
  const bodyWithSvxIgnoreConverted = transformSvxIgnoreComponents(
    bodyWithInlinedFileSources,
  );
  const fencedBody = fenceInlineSvelte(bodyWithSvxIgnoreConverted);

  const apiSections = componentsForUsage
    .map(renderComponentApiMarkdown)
    .filter(Boolean);
  const apiMarkdown =
    apiSections.length > 0
      ? `\n\n---\n\n## Component API\n\n${apiSections.join("\n\n")}`
      : "";

  const generatedMd = `# ${componentName}\n\n${fencedBody}${apiMarkdown}`;

  generatedMdByComponent.push({ componentName, md: generatedMd });
}

await Promise.all(
  generatedMdByComponent.map(async ({ componentName, md }) => {
    const svelteFormatted = await formatSvelteFences(md);
    const docFormatted = await formatMarkdown(svelteFormatted);
    fs.writeFileSync(
      path.join(RAW_COMPONENTS_OUT_DIR, `${componentName}.md`),
      docFormatted,
    );
  }),
);
