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

const INLINE_NOTIFICATION_OPEN_TAG_RE = /<InlineNotification\b([^>]*)>/i;
const INLINE_NOTIFICATION_INNER_START_RE =
  /^[\s\S]*?<InlineNotification\b[^>]*>/i;
const INLINE_NOTIFICATION_INNER_END_RE = /<\/InlineNotification>[\s\S]*$/i;

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
 */
function renderPropsSection(component) {
  const props = Array.isArray(component.props) ? component.props : [];
  if (props.length === 0) return "";

  const sorted = [...props].sort((a, b) => {
    if (a.isRequired !== b.isRequired) return b.isRequired ? 1 : -1;
    if (a.reactive !== b.reactive) return b.reactive ? 1 : -1;
    return 0;
  });

  /** @type {{ name: string; code: string }[]} */
  const examples = [];

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

    const { mainDescription, exampleCode } = parseDescription(
      prop.description ?? "",
    );
    if (exampleCode) examples.push({ name: prop.name, code: exampleCode });

    const typeCell = prop.type ? `\`${prop.type}\`` : "";

    const value = prop.value;
    const defaultCell =
      value === undefined || value === "undefined"
        ? "_undefined_"
        : `\`${String(value)}\``;

    return [nameCell, typeCell, mainDescription, defaultCell];
  });

  let out = `### Props\n\n${renderMarkdownTable(
    ["Prop", "Type", "Description", "Default"],
    rows,
  )}`;

  if (examples.length > 0) {
    out += "\n\n#### Prop examples\n";
    for (const ex of examples) {
      out += `\n**\`${ex.name}\`**\n\n\`\`\`svelte\n${ex.code}\n\`\`\`\n`;
    }
    out = out.trimEnd();
  }

  return out;
}

/**
 * @param {any} component
 */
function renderTypedefsSection(component) {
  const typedefs = Array.isArray(component.typedefs) ? component.typedefs : [];
  if (typedefs.length === 0) return "";

  const ts = typedefs
    .map((t) => t?.ts)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!ts) return "";

  return `### Typedefs\n\n\`\`\`ts\n${ts}\n\`\`\``;
}

/**
 * @param {any} component
 */
function renderSlotsSection(component) {
  const slots = Array.isArray(component.slots) ? component.slots : [];
  if (slots.length === 0) return "";

  const rows = slots.map((slot) => {
    const name =
      slot?.default || slot?.name == null ? "default" : String(slot.name);
    const detail = slot?.slot_props ? String(slot.slot_props) : "";
    return [`\`${name}\``, detail ? `\`${detail}\`` : ""];
  });

  return `### Slots\n\n${renderMarkdownTable(["Slot", "Detail"], rows)}`;
}

/**
 * @param {any} component
 */
function renderEventsSection(component) {
  const events = Array.isArray(component.events) ? component.events : [];
  const forwarded = events.filter((e) => e?.type === "forwarded");
  const dispatched = events.filter((e) => e?.type === "dispatched");

  if (forwarded.length === 0 && dispatched.length === 0) return "";

  const forwardedMd =
    forwarded.length === 0
      ? ""
      : `### Forwarded events\n\n${renderMarkdownTable(
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
      : `### Dispatched events\n\n${renderMarkdownTable(
          dispatchedHeaders,
          dispatchedRows ?? [],
        )}`;

  const sections = [forwardedMd, dispatchedMd].filter(Boolean);
  return sections.join("\n\n");
}

/**
 * @param {any} component
 */
function renderRestPropsSection(component) {
  const rest = component?.rest_props;
  if (!rest) return "";

  if (rest.type === "Element") {
    return `### $$restProps\n\n\`${component.moduleName}\` spreads \`$$restProps\` to the \`${rest.name}\` element.`;
  }

  return `### $$restProps\n\n\`${component.moduleName}\` spreads \`$$restProps\` to the \`${rest.name}\` component.`;
}

/**
 * @param {string} moduleName
 */
function renderComponentApiMarkdown(moduleName) {
  const entry = componentApiByModuleName.get(moduleName);
  if (!entry) {
    return `## Component API: ${moduleName}\n\nAPI data not found.`;
  }

  const sections = [
    `## Component API: ${moduleName}`,
    renderPropsSection(entry),
    renderTypedefsSection(entry),
    renderSlotsSection(entry),
    renderEventsSection(entry),
    renderRestPropsSection(entry),
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
 * @param {string} body
 */
function transformInlineNotifications(body) {
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

    if (!line.includes("<InlineNotification")) {
      out.push(line);
      continue;
    }

    /** @type {string[]} */
    const blockLines = [line];
    let foundClose = line.includes("</InlineNotification>");
    while (!foundClose && i + 1 < lines.length) {
      i++;
      blockLines.push(lines[i]);
      if (lines[i].includes("</InlineNotification>")) foundClose = true;
    }

    const block = blockLines.join("\n");
    const openTagMatch = block.match(INLINE_NOTIFICATION_OPEN_TAG_RE);
    const openTag = openTagMatch
      ? `<InlineNotification${openTagMatch[1]}>`
      : "";
    const kind = getAttr(openTag, "kind")?.toLowerCase();
    const title = getAttr(openTag, "title")?.toLowerCase() ?? "";

    let label = "NOTE";
    if (kind === "warning") label = "WARNING";
    else if (kind === "error" || kind === "danger") label = "CAUTION";
    else if (kind === "success") label = "TIP";
    else if (title.includes("note")) label = "NOTE";

    const inner = block
      .replace(INLINE_NOTIFICATION_INNER_START_RE, "")
      .replace(INLINE_NOTIFICATION_INNER_END_RE, "");
    const mdBody = inlineNotificationBodyToMarkdown(inner);
    const bodyLines = mdBody.length ? mdBody.split("\n") : [];

    out.push(`> [!${label}]`);
    for (const l of bodyLines) out.push(l.trim() ? `> ${l}` : ">");
    out.push("");
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
  const bodyWithAdmonitions = transformInlineNotifications(
    bodyWithInlinedFileSources,
  );
  const fencedBody = fenceInlineSvelte(bodyWithAdmonitions);

  const generatedMd =
    `# ${componentName}\n\n` +
    fencedBody +
    "\n\n---\n\n" +
    componentsForUsage.map(renderComponentApiMarkdown).join("\n\n");

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
