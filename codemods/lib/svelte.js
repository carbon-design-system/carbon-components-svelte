/**
 * Helpers the upgrade codemods share: finding a file's script and style
 * blocks, parsing its markup with the app's Svelte, resolving Carbon
 * components, and applying text edits.
 *
 * Every rewrite is a text edit at a node's offsets, so the rest of the file
 * keeps its formatting.
 */

/**
 * @typedef {{ start: number; end: number; text: string }} Edit
 * @typedef {{ line: number; column: number; kind: string; message: string }} Note
 * @typedef {(source: string) => any} Parse
 * @typedef {{ filename: string; parse?: Parse }} BaseOptions
 * @typedef {{ text: string; notes: Note[]; options: BaseOptions }} Context
 * @typedef {{ tag: string; attributes: string; start: number; end: number }} Block
 * @typedef {{
 *   components: Map<string, string>;
 *   deep: Set<string>;
 *   namespaces: Set<string>;
 *   scripts: string;
 * }} Imports
 */

// Each branch of the attribute part starts with a different character, so
// matching stays linear.
const BLOCK =
  /<(script|style)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1\s*>/dgi;
const COMMENT = /\/\*[\s\S]*?\*\/|(?<![:"'\w])\/\/[^\n]*/g;
const NON_NEWLINE = /[^\n]/g;
const NAMED_IMPORT =
  /import\s+(type\s+)?(?:\w+\s*,\s*)?\{([^}]*)\}\s*from\s*(["'])(carbon-components-svelte(?:\/[^"']*)?)\3/g;
const DEFAULT_IMPORT =
  /import\s+(\w+)\s*(?:,\s*\{[^}]*\}\s*)?from\s*(["'])carbon-components-svelte\/src\/(?:[^"'/]+\/)*(\w+)\.svelte\2/g;
const DEEP_IMPORT =
  /^\s*import\s+\w+\s+from\s*["']carbon-components-svelte\/src\//;
const NAMESPACE_IMPORT =
  /import\s+\*\s+as\s+(\w+)\s+from\s*(["'])carbon-components-svelte\2/g;
const ANY_CARBON_IMPORT =
  /^([ \t]*)import\b[^;]*?from\s*(["'])carbon-components-svelte[^"']*\2;?[ \t]*$/gm;
const SPECIFIER = /^(type\s+)?(\w+)(?:\s+as\s+(\w+))?$/;
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?=\r?\n|$)/;
const FENCE =
  /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm;
const INLINE_CODE = /`[^`\n]+`/g;
const MODULE_SCRIPT = /\bcontext\s*=\s*["']module["']|(?:^|\s)module(?:\s|=|$)/;
const TS_SCRIPT = /\blang\s*=\s*["']ts["']/;
export const WHITESPACE = /^\s*$/;
const SAFE_STRING = /^[^"{}]*$/;
export const INDENT = /\n([ \t]*)\S/;
const TRAILING_INDENT = /\n([ \t]*)$/;
export const CSS_EXTENSION = /\.(?:css|scss)$/;
export const SVELTE_EXTENSION = /\.(?:svelte|svx)$/;
const BARREL = "carbon-components-svelte";

/** @param {string} filename */
export const isSvx = (filename) => filename.endsWith(".svx");

/**
 * Finds the top-level `<script>` and `<style>` blocks, plus front matter
 * and code in an .svx page (tag `code`). `start` and `end` bound the
 * block's content.
 * @param {string} text
 * @param {boolean} [svx]
 * @returns {Block[]}
 */
export function findBlocks(text, svx = false) {
  /** @type {Block[]} */
  const code = [];
  if (svx) {
    const frontMatter = FRONT_MATTER.exec(text);
    if (frontMatter) {
      code.push({
        tag: "code",
        attributes: "",
        start: 0,
        end: frontMatter[0].length,
      });
    }
    for (const pattern of [FENCE, INLINE_CODE]) {
      for (const match of text.matchAll(pattern)) {
        const start = /** @type {number} */ (match.index);
        if (code.some((range) => start >= range.start && start < range.end))
          continue;
        code.push({
          tag: "code",
          attributes: "",
          start,
          end: start + match[0].length,
        });
      }
    }
  }

  /** @type {Block[]} */
  const blocks = [];
  for (const match of text.matchAll(BLOCK)) {
    const indices = /** @type {RegExpIndicesArray} */ (match.indices);
    const [start, end] = /** @type {[number, number]} */ (indices[3]);
    if (code.some((range) => start >= range.start && start < range.end))
      continue;
    blocks.push({
      tag: match[1].toLowerCase(),
      attributes: match[2],
      start,
      end,
    });
  }
  return [...blocks, ...code];
}

/**
 * The component's instance script: the `<script>` without `context="module"`
 * or `module`.
 * @param {Block[]} blocks
 */
export function instanceScript(blocks) {
  return blocks.find(
    (block) => block.tag === "script" && !MODULE_SCRIPT.test(block.attributes),
  );
}

/** @param {Block} block */
export const isTypeScript = (block) => TS_SCRIPT.test(block.attributes);

/**
 * Parses markup with styles and .svx code blanked out (Sass and Markdown
 * may not parse), then with scripts blanked too (Svelte 3 and 4 can't read
 * TypeScript).
 * @param {string} text
 * @param {Block[]} blocks
 * @param {Parse} parse
 */
export function parseMarkup(text, blocks, parse) {
  const styles = blank(
    text,
    blocks.filter((block) => block.tag !== "script"),
  );
  try {
    return parse(styles);
  } catch {
    try {
      return parse(blank(text, blocks));
    } catch {
      return undefined;
    }
  }
}

/**
 * Replaces every character but newlines in each range with a space, so
 * offsets and line numbers stay the same.
 * @param {string} text
 * @param {{ start: number; end: number }[]} ranges
 */
export function blank(text, ranges) {
  let out = text;
  for (const { start, end } of ranges) {
    out =
      out.slice(0, start) +
      out.slice(start, end).replace(NON_NEWLINE, " ") +
      out.slice(end);
  }
  return out;
}

/**
 * Visits every element and block in document order. `ancestors` holds the
 * elements and components around the node, nearest last.
 * @param {any} node
 * @param {(node: any, ancestors: any[]) => void} visit
 * @param {any[]} [ancestors]
 */
export function walkMarkup(node, visit, ancestors = []) {
  if (!node || typeof node !== "object") return;
  visit(node, ancestors);
  const next = node.attributes ? [...ancestors, node] : ancestors;
  for (const key of ["children", "else", "pending", "then", "catch"]) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) walkMarkup(item, visit, next);
    } else if (child && typeof child === "object") {
      walkMarkup(child, visit, next);
    }
  }
}

/**
 * Visits every node of an ESTree expression.
 * @param {any} node
 * @param {(node: any) => void} visit
 * @param {WeakSet<object>} [seen]
 */
function walkScript(node, visit, seen = new WeakSet()) {
  if (!node || typeof node.type !== "string" || seen.has(node)) return;
  seen.add(node);
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "metadata") continue;
    if (Array.isArray(value)) {
      for (const item of value) walkScript(item, visit, seen);
    } else if (value && typeof value === "object") {
      walkScript(value, visit, seen);
    }
  }
}

/**
 * The text of every script block, comments removed.
 * @param {string} text
 * @param {boolean} svx
 */
export function scriptText(text, svx) {
  return findBlocks(text, svx)
    .filter((block) => block.tag === "script")
    .map((block) => text.slice(block.start, block.end).replace(COMMENT, ""))
    .join("\n");
}

/**
 * Maps local names to the Carbon components they import. `deep` holds the
 * local names imported from `carbon-components-svelte/src/…`.
 * @param {string} text
 * @param {boolean} svx
 * @returns {Imports}
 */
export function readImports(text, svx) {
  const scripts = scriptText(text, svx);

  /** @type {Map<string, string>} */
  const components = new Map();
  /** @type {Set<string>} */
  const deep = new Set();
  /** @type {Set<string>} */
  const namespaces = new Set();

  for (const match of scripts.matchAll(NAMED_IMPORT)) {
    if (match[1]) continue;
    for (const part of match[2].split(",")) {
      const specifier = SPECIFIER.exec(part.trim());
      if (specifier && !specifier[1]) {
        components.set(specifier[3] ?? specifier[2], specifier[2]);
      }
    }
  }
  for (const match of scripts.matchAll(DEFAULT_IMPORT)) {
    components.set(match[1], match[3]);
    deep.add(match[1]);
  }
  for (const match of scripts.matchAll(NAMESPACE_IMPORT)) {
    namespaces.add(match[1]);
  }

  return { components, deep, namespaces, scripts };
}

/**
 * The Carbon component a markup node renders, if any.
 * @param {Imports} imports
 * @param {any} node
 */
export function resolveComponent(imports, node) {
  if (node?.type !== "InlineComponent") return undefined;
  const local = node.name;
  if (imports.components.has(local)) return imports.components.get(local);
  const dot = local.indexOf(".");
  if (dot > 0 && imports.namespaces.has(local.slice(0, dot))) {
    return local.slice(dot + 1);
  }
  return undefined;
}

/**
 * A node's attributes of one type, by name.
 * @param {any} node
 * @param {string} [type]
 * @returns {Map<string, any>}
 */
export function attributesOf(node, type = "Attribute") {
  /** @type {Map<string, any>} */
  const attributes = new Map();
  for (const attribute of node.attributes ?? []) {
    if (attribute.type === type) attributes.set(attribute.name, attribute);
  }
  return attributes;
}

/**
 * `true` or `false` for `prop`, `prop={true}` and `prop={false}`;
 * `undefined` for anything else.
 * @param {any} attribute
 */
export function staticBoolean(attribute) {
  if (attribute.value === true) return true;
  const expression = attributeExpression(attribute);
  if (expression?.type === "Literal" && typeof expression.value === "boolean") {
    return expression.value;
  }
  return undefined;
}

/**
 * The value of `prop="text"` or `prop={"text"}`; `undefined` for anything
 * else.
 * @param {any} attribute
 */
export function staticString(attribute) {
  const { value } = attribute;
  if (!Array.isArray(value)) return undefined;
  if (value.length === 0) return "";
  if (value.length === 1 && value[0].type === "Text") return value[0].data;
  const expression = attributeExpression(attribute);
  if (expression?.type === "Literal" && typeof expression.value === "string") {
    return expression.value;
  }
  return undefined;
}

/**
 * The expression of `name={expression}` or `{name}`.
 * @param {any} attribute
 */
export function attributeExpression(attribute) {
  const { value } = attribute;
  if (!Array.isArray(value) || value.length !== 1) return undefined;
  return value[0].expression;
}

/** Strips TypeScript casts and parentheses. @param {any} node */
export function unwrap(node) {
  let current = node;
  while (
    current &&
    (current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSTypeAssertion" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * Calls back with the inner range and value of each string in an
 * attribute: static text, or string literals in its expression.
 * @param {any} attribute
 * @param {(start: number, end: number, value: string) => void} callback
 */
export function forEachString(attribute, callback) {
  if (!Array.isArray(attribute.value)) return;
  for (const part of attribute.value) {
    if (part.type === "Text") {
      callback(part.start, part.end, part.data);
    } else if (part.expression) {
      walkScript(part.expression, (node) => {
        if (node.type === "Literal" && typeof node.value === "string") {
          callback(node.start + 1, node.end - 1, node.value);
        }
      });
    }
  }
}

/**
 * Removes an attribute and the whitespace before it.
 * @param {string} text
 * @param {any} node
 * @param {any} attribute
 * @returns {Edit}
 */
export function removeAttribute(text, node, attribute) {
  let start = attribute.start;
  while (start > node.start && WHITESPACE.test(text[start - 1])) start--;
  // The only attribute, on a line of its own: close the tag on the name's
  // line, so `<A\n  prop\n>` becomes `<A>`, not `<A\n>`.
  if (
    node.attributes?.length === 1 &&
    text.slice(start, attribute.start).includes("\n")
  ) {
    let after = attribute.end;
    while (after < text.length && WHITESPACE.test(text[after])) after++;
    if (text[after] === ">") return { start, end: after, text: "" };
    if (text.startsWith("/>", after)) return { start, end: after, text: " " };
  }
  return { start, end: attribute.end, text: "" };
}

/**
 * The offset just past the `>` of a node's start tag.
 * @param {string} text
 * @param {any} node
 */
function startTagEnd(text, node) {
  const last = node.attributes?.at(-1);
  const from = last ? last.end : node.start + 1 + node.name.length;
  return text.indexOf(">", from) + 1;
}

/**
 * Whether a node closes itself: `<Theme />`.
 * @param {string} text
 * @param {any} node
 */
export function isSelfClosing(text, node) {
  return text.slice(node.start, startTagEnd(text, node)).endsWith("/>");
}

/**
 * The whitespace before a node on its line, or `undefined` when other text
 * comes first.
 * @param {string} text
 * @param {number} offset
 */
export function lineIndent(text, offset) {
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  const before = text.slice(lineStart, offset);
  return WHITESPACE.test(before) ? before : undefined;
}

/**
 * An object property as a component prop: `name`, `{name}`, `name="text"`
 * or `name={expression}`.
 * @param {string} text
 * @param {string} name
 * @param {any} property
 */
export function propText(text, name, property) {
  const value = property.value;
  if (value.type === "Literal" && value.value === true) return name;
  if (value.type === "Identifier" && value.name === name) return `{${name}}`;
  if (
    value.type === "Literal" &&
    typeof value.value === "string" &&
    SAFE_STRING.test(value.value)
  ) {
    return `${name}="${value.value}"`;
  }
  return `${name}={${text.slice(value.start, value.end)}}`;
}

/**
 * The key of a plain `key: value` property, or `undefined`.
 * @param {any} property
 * @returns {string | undefined}
 */
export function propertyKey(property) {
  if (property.type !== "Property" || property.computed) return undefined;
  if (property.kind !== "init" || property.method) return undefined;
  return property.key.type === "Identifier"
    ? property.key.name
    : String(property.key.value);
}

/**
 * Imports a Carbon component: into the file's barrel import, or as a new
 * import after the last Carbon import, in the same style (barrel or
 * `src/` path).
 * @param {Context} context
 * @param {{ name: string; local: string; folder: string }} component
 */
export function addComponentImport(context, { name, local, folder }) {
  const { text } = context;
  const specifier = local === name ? name : `${name} as ${local}`;
  const blocks = findBlocks(text, isSvx(context.options.filename));

  for (const block of blocks) {
    if (block.tag !== "script") continue;
    const script = text.slice(block.start, block.end);
    for (const match of script.matchAll(NAMED_IMPORT)) {
      if (match[1] || match[4] !== BARREL) continue;
      const open =
        block.start +
        /** @type {number} */ (match.index) +
        match[0].indexOf("{");
      const close = text.indexOf("}", open);
      const inside = text.slice(open + 1, close);
      context.text =
        text.slice(0, open + 1) +
        addSpecifier(inside, specifier) +
        text.slice(close);
      return;
    }
  }

  // No barrel import: add one after the last Carbon import, in its style.
  for (const block of blocks) {
    if (block.tag !== "script") continue;
    const script = text.slice(block.start, block.end);
    const lines = [...script.matchAll(ANY_CARBON_IMPORT)];
    const last = lines.at(-1);
    if (!last) continue;
    const statement = DEEP_IMPORT.test(last[0])
      ? `import ${local} from "carbon-components-svelte/src/${folder}/${name}.svelte";`
      : `import { ${specifier} } from "carbon-components-svelte";`;
    const at =
      block.start + /** @type {number} */ (last.index) + last[0].length;
    context.text = `${text.slice(0, at)}\n${last[1]}${statement}${text.slice(at)}`;
    return;
  }
}

/**
 * Adds a specifier to the text inside `import { … }`, in order when the
 * list is sorted.
 * @param {string} inside
 * @param {string} specifier
 */
function addSpecifier(inside, specifier) {
  const parts = inside
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const sorted = parts.every((part, i) => i === 0 || parts[i - 1] <= part);
  const index = sorted ? parts.findIndex((part) => part > specifier) : -1;
  parts.splice(index === -1 ? parts.length : index, 0, specifier);

  if (!inside.includes("\n")) return ` ${parts.join(", ")} `;
  const indent = INDENT.exec(inside)?.[1] ?? "  ";
  const closing = TRAILING_INDENT.exec(inside)?.[1] ?? "";
  const trailingComma = inside.trimEnd().endsWith(",") ? "," : "";
  return `\n${parts.map((part) => indent + part).join(",\n")}${trailingComma}\n${closing}`;
}

/**
 * Applies non-overlapping edits. An edit that overlaps an earlier one is
 * dropped; the next run picks it up.
 * @param {Context} context
 * @param {Edit[]} edits
 */
export function applyEdits(context, edits) {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let out = "";
  let from = 0;
  for (const edit of sorted) {
    if (edit.start < from) continue;
    out += context.text.slice(from, edit.start) + edit.text;
    from = edit.end;
  }
  context.text = out + context.text.slice(from);
}

/**
 * Records a note at an offset of the current text. Notes are taken before
 * any edit that adds or removes a line, so the line is the input's.
 * @param {Context} context
 * @param {number} offset
 * @param {string} kind
 * @param {string} message
 */
export function note(context, offset, kind, message) {
  const before = context.text.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - before.lastIndexOf("\n");
  context.notes.push({ line, column, kind, message });
}
