/**
 * The 0.114 upgrade: Carbon v10 names to v11, `light` to `Layer`, and the
 * DatePicker and CopyInput prop changes. See docs/migrations/v0.114.x.md.
 *
 * `transform` is pure. It takes a file's text and returns the new text plus
 * notes for what it left for a person to decide. Markup is read with
 * Svelte's own parser (passed in, so the caller can load the app's copy).
 */
import {
  addComponentImport,
  applyEdits,
  attributeExpression,
  CSS_EXTENSION,
  findBlocks,
  forEachString,
  INDENT,
  isSvx,
  note,
  parseMarkup,
  propertyKey,
  propText,
  readImports,
  removeAttribute,
  resolveComponent,
  staticBoolean,
  SVELTE_EXTENSION,
  unwrap,
  walkMarkup,
  WHITESPACE,
} from "../lib/svelte.js";
import {
  COLOR_TOKENS,
  FLATPICKR_RENAMES,
  flatpickrAdvice,
  LAYER_03_PROPS,
  LIGHT_COMPONENTS,
  MODAL_COMPONENTS,
  propertyClass,
  SPLIT_TOKENS,
  TYPE_STYLES,
} from "./maps.js";

/**
 * @typedef {import("../lib/svelte.js").Edit} Edit
 * @typedef {import("../lib/svelte.js").Note} Note
 * @typedef {import("../lib/svelte.js").Imports} Imports
 * @typedef {import("../lib/svelte.js").BaseOptions & { keepLayer03Color?: boolean }} Options
 * @typedef {{ text: string; notes: Note[]; options: Options }} Context
 */

const byLength = (/** @type {string} */ a, /** @type {string} */ b) =>
  b.length - a.length;
const COLOR_NAMES = Object.keys(COLOR_TOKENS).sort(byLength).join("|");
const TYPE_NAMES = Object.keys(TYPE_STYLES).sort(byLength).join("|");

const COLOR_TOKEN = new RegExp(
  `(?<![\\w-])--cds-(${COLOR_NAMES})(?![\\w-])`,
  "g",
);
const TYPE_CLASS = new RegExp(
  `(?<![\\w-])bx--type-(${TYPE_NAMES})(?![\\w-])`,
  "g",
);
const TYPE_PROPERTY = new RegExp(
  `(?<![\\w-])--cds-(${TYPE_NAMES})(?=-(?:font-|line-height|letter-spacing))`,
  "g",
);
const QUOTED_TOKEN_KEY = new RegExp(`(["'])(${COLOR_NAMES})\\1(?=\\s*:)`, "g");

const VAR_BEFORE = /var\(\s*$/;
const DECLARATION_START = /^\s*([\w$-]+)\s*:/;
const OBJECT_KEY = /["']?([\w$-]+)["']?\s*:\s*$/;
const COLON_AFTER = /^\s*:/;
const UPPERCASE = /[A-Z]/g;
const BOUNDARIES = new Set([";", "{", "}", '"', "'", "`"]);
const QUOTES = new Set(['"', "'", "`"]);

const OTHER_LAYER_BINDING =
  /\b(?:let|const|var|function|class)\s+Layer\b|import\s[^;]*\bLayer\b[^;]*from\s*["'](?!carbon-components-svelte)/;
const NEWLINE_BEFORE_TEXT = /\n(?=[^\n])/g;
const RAW_TEXT_ELEMENT = /<(?:pre|textarea)\b/;

/** What the CLI calls each kind of note. */
export const NOTE_TITLES = {
  token: "v10 tokens to rename by hand",
  theme: "Theme tokens",
  light: "Dynamic `light`",
  flatpickr: "flatpickrProps",
  "layer-03": "layer-03 color change",
  parse: "Files not fully migrated",
};

/** What the CLI says once per run, since no file shows it. */
export const SUMMARY = [
  "Safari 14.1 is the minimum. Stay on 0.113 if your users are on Safari 14.0.",
];

/**
 * @param {string} source
 * @param {Options} options
 * @returns {{ code: string; notes: Note[] }}
 */
export function transform(source, options) {
  /** @type {Context} */
  const context = { text: source, notes: [], options };

  if (SVELTE_EXTENSION.test(options.filename)) {
    transformSvelte(context);
  } else {
    const mode = CSS_EXTENSION.test(options.filename) ? "css" : "js";
    applyEdits(context, rewriteTokens(context, 0, source.length, mode));
    renameTypeStyles(context);
  }

  context.notes.sort((a, b) => a.line - b.line || a.column - b.column);
  return { code: context.text, notes: context.notes };
}

/** @param {Context} context */
function transformSvelte(context) {
  const { parse } = context.options;

  const svx = isSvx(context.options.filename);

  // Pass 1: names in CSS, scripts and attribute values. It never adds or
  // removes a line, so later notes keep the input's line numbers.
  const blocks = findBlocks(context.text, svx);
  const ast = parse ? parseMarkup(context.text, blocks, parse) : undefined;
  /** @type {Edit[]} */
  const edits = [];
  for (const block of blocks) {
    const mode = block.tag === "style" ? "css" : "js";
    edits.push(...rewriteTokens(context, block.start, block.end, mode));
  }
  if (ast) {
    walkMarkup(ast.html, (node) => {
      edits.push(...rewriteMarkupTokens(context, node));
    });
  } else {
    // Unparsed markup: only `var()` reads.
    let from = 0;
    const sorted = [...blocks].sort((a, b) => a.start - b.start);
    for (const block of [...sorted, { start: context.text.length, end: 0 }]) {
      edits.push(...rewriteTokens(context, from, block.start, "js"));
      from = block.end;
    }
  }
  applyEdits(context, edits);
  renameTypeStyles(context);

  if (!parse) {
    note(
      context,
      0,
      "parse",
      "Svelte was not found, so props were not migrated",
    );
    return;
  }

  // Pass 2: component props.
  const markup = parseMarkup(
    context.text,
    findBlocks(context.text, svx),
    parse,
  );
  const imports = readImports(context.text, svx);
  if (imports.components.size === 0 && imports.namespaces.size === 0) return;
  if (!markup) {
    note(
      context,
      0,
      "parse",
      "Svelte could not parse this file, so props were not migrated",
    );
    return;
  }

  /** @type {Edit[]} */
  const propEdits = [];
  walkMarkup(markup.html, (node, ancestors) => {
    const name = resolveComponent(imports, node);
    if (name) {
      propEdits.push(...migrateProps(context, node, name, ancestors, imports));
    }
  });
  applyEdits(context, propEdits);

  // Pass 3: wrap each `light` component in a Layer, one at a time, since a
  // wrap re-indents everything inside it.
  const layer = layerName(imports);
  let wrapped = false;
  // Each wrap removes one `light`. The bound only guards against a bug.
  for (let i = 0; i < 1000; i++) {
    const current = parseMarkup(
      context.text,
      findBlocks(context.text, svx),
      parse,
    );
    const target = current && findLightTarget(current.html, imports);
    if (!target) break;
    wrapInLayer(context, target, layer, imports);
    wrapped = true;
  }
  if (wrapped && !importedLayer(imports)) {
    addComponentImport(context, {
      name: "Layer",
      local: layer,
      folder: "Layer",
    });
  }
}

/**
 * Token rewrites for one markup node's attributes and expressions.
 * @param {Context} context
 * @param {any} node
 */
function rewriteMarkupTokens(context, node) {
  /** @type {Edit[]} */
  const edits = [];
  for (const attribute of node.attributes ?? []) {
    const range = valueRange(attribute);
    if (attribute.type === "StyleDirective") {
      const nameStart = attribute.start + "style:".length;
      const nameEnd = nameStart + attribute.name.length;
      edits.push(...rewriteTokens(context, nameStart, nameEnd, "name"));
      if (range) {
        edits.push(
          ...rewriteTokens(context, range[0], range[1], "css", attribute.name),
        );
      }
    } else if (attribute.type === "Attribute" && range) {
      const mode = attribute.name === "style" ? "css" : "js";
      edits.push(...rewriteTokens(context, range[0], range[1], mode));
    } else if (attribute.expression?.end) {
      const { start, end } = attribute.expression;
      edits.push(...rewriteTokens(context, start, end, "js"));
    }
  }
  if (!node.attributes && node.expression?.end) {
    const { start, end } = node.expression;
    edits.push(...rewriteTokens(context, start, end, "js"));
  }
  return edits;
}

/** @param {any} attribute */
function valueRange(attribute) {
  const { value } = attribute;
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return [value[0].start, value[value.length - 1].end];
}

/**
 * Renames `--cds-<v10>` color tokens in `text[start, end)`.
 *
 * In `css` mode every name is a token: a declaration sets it, anything else
 * reads it. In `js` mode only `var(--cds-…)` is a read; a bare name could
 * be anything, so it is reported. `name` mode is the name of a
 * `style:--cds-…` directive, which sets the token. `property` forces the
 * CSS property, for `style:<property>` directives.
 * @param {Context} context
 * @param {number} start
 * @param {number} end
 * @param {"css" | "js" | "name"} mode
 * @param {string} [property]
 * @returns {Edit[]}
 */
function rewriteTokens(context, start, end, mode, property) {
  const { text } = context;
  const region = text.slice(start, end);
  /** @type {Edit[]} */
  const edits = [];

  for (const match of region.matchAll(COLOR_TOKEN)) {
    const index = /** @type {number} */ (match.index);
    const offset = start + index;
    const name = match[1];
    const isRead = VAR_BEFORE.test(
      region.slice(Math.max(0, index - 12), index),
    );
    const nameStart = offset + "--cds-".length;
    const nameEnd = nameStart + name.length;

    if (!isRead && mode === "js") {
      note(
        context,
        offset,
        "token",
        `--cds-${name} is a v10 token. Rename it to ${describeTarget(name)}`,
      );
      continue;
    }

    const isWrite =
      mode === "name" ||
      (!isRead &&
        property === undefined &&
        WHITESPACE.test(cssSegment(region, index)) &&
        COLON_AFTER.test(region.slice(index + match[0].length)));

    if (isWrite) {
      if (SPLIT_TOKENS[name]) {
        note(
          context,
          offset,
          "token",
          `--cds-${name} was split in v11 into ${SPLIT_TOKENS[name].join(", ")}. Set the ones you need`,
        );
      } else {
        edits.push({
          start: nameStart,
          end: nameEnd,
          text: COLOR_TOKENS[name]["*"],
        });
      }
      continue;
    }

    const target = resolveRead(name, property ?? propertyAt(region, index));
    if (target) {
      edits.push({ start: nameStart, end: nameEnd, text: target });
    } else {
      note(
        context,
        offset,
        "token",
        `--cds-${name} was split in v11 and has no CSS property to pick by. Use ${SPLIT_TOKENS[name].join(", ")}`,
      );
    }
  }
  return edits;
}

/**
 * @param {string} name
 * @param {string | undefined} property
 */
function resolveRead(name, property) {
  const targets = COLOR_TOKENS[name];
  const kind = propertyClass(property);
  if (kind === undefined) {
    return Object.keys(targets).length > 1 ? undefined : targets["*"];
  }
  return targets[kind] ?? targets["*"];
}

/** @param {string} name */
function describeTarget(name) {
  const split = SPLIT_TOKENS[name];
  if (split) return `one of ${split.join(", ")}`;
  return `--cds-${COLOR_TOKENS[name]["*"]}`;
}

/**
 * The text between `index` and the previous `;`, `{`, `}` or quote, with
 * any comment before it dropped.
 * @param {string} text
 * @param {number} index
 */
function cssSegment(text, index) {
  let i = index - 1;
  while (i >= 0 && !BOUNDARIES.has(text[i])) i--;
  const segment = text.slice(i + 1, index);
  const comment = segment.lastIndexOf("*/");
  return comment === -1 ? segment : segment.slice(comment + 2);
}

/**
 * The CSS property a value at `index` belongs to, if one can be read.
 * @param {string} text
 * @param {number} index
 */
function propertyAt(text, index) {
  const declaration = DECLARATION_START.exec(cssSegment(text, index));
  if (declaration) return declaration[1];

  // A JS object value: `{ backgroundColor: "var(--cds-…)" }`.
  let i = index - 1;
  while (i >= 0 && !BOUNDARIES.has(text[i])) i--;
  if (i >= 0 && QUOTES.has(text[i])) {
    const key = OBJECT_KEY.exec(text.slice(Math.max(0, i - 60), i));
    if (key) return key[1].replace(UPPERCASE, (c) => `-${c.toLowerCase()}`);
  }
  return undefined;
}

/**
 * Renames v10 type styles in `.bx--type-*` classes and `--cds-<style>-*`
 * properties.
 * @param {Context} context
 */
function renameTypeStyles(context) {
  context.text = context.text
    .replace(TYPE_CLASS, (_, name) => `bx--type-${TYPE_STYLES[name]}`)
    .replace(TYPE_PROPERTY, (_, name) => `--cds-${TYPE_STYLES[name]}`);
}

/**
 * The name to wrap with: the imported Layer, or `Layer` unless the file
 * already binds that name to something else.
 * @param {Imports} imports
 */
function layerName(imports) {
  const layer = importedLayer(imports);
  if (layer) return layer;
  return OTHER_LAYER_BINDING.test(imports.scripts) ||
    imports.components.has("CarbonLayer")
    ? "CarbonLayer"
    : "Layer";
}

/**
 * The local name of an imported Layer, if any.
 * @param {Imports} imports
 */
function importedLayer(imports) {
  for (const [local, name] of imports.components) {
    if (name === "Layer") return local;
  }
  if (imports.namespaces.size > 0) return `${[...imports.namespaces][0]}.Layer`;
  return undefined;
}

/**
 * Prop changes on one Carbon component.
 * @param {Context} context
 * @param {any} node
 * @param {string} name
 * @param {any[]} ancestors
 * @param {Imports} imports
 * @returns {Edit[]}
 */
function migrateProps(context, node, name, ancestors, imports) {
  /** @type {Map<string, any>} */
  const attributes = new Map();
  for (const attribute of node.attributes) {
    if (attribute.type === "Attribute") {
      attributes.set(attribute.name, attribute);
    }
  }
  /** @type {Edit[]} */
  const edits = [];

  const light = attributes.get("light");
  if (light && LIGHT_COMPONENTS.has(name)) {
    const value = staticBoolean(light);
    const inModal = ancestors.some((ancestor) =>
      MODAL_COMPONENTS.has(resolveComponent(imports, ancestor) ?? ""),
    );
    if (value === undefined) {
      note(
        context,
        light.start,
        "light",
        `${name} has a dynamic \`light\`. Remove it and wrap the component in <Layer> where it was true`,
      );
    } else if (value === false || inModal) {
      edits.push(removeAttribute(context.text, node, light));
    }
  }

  const selectOnFocus = attributes.get("selectOnFocus");
  if (name === "CopyInput" && selectOnFocus) {
    if (attributes.has("selectTextOnFocus")) {
      edits.push(removeAttribute(context.text, node, selectOnFocus));
    } else {
      const start = selectOnFocus.start;
      edits.push({
        start,
        end: start + "selectOnFocus".length,
        text: "selectTextOnFocus",
      });
    }
  }

  const flatpickrProps = attributes.get("flatpickrProps");
  if (name === "DatePicker" && flatpickrProps) {
    edits.push(...migrateFlatpickrProps(context, flatpickrProps, attributes));
  }

  const tokens = attributes.get("tokens");
  if (name === "Theme" && tokens) {
    edits.push(...migrateThemeTokens(context, tokens));
  }

  const type = attributes.get("type");
  if ((name === "Text" || name === "Heading") && type) {
    forEachString(type, (start, end, value) => {
      if (Object.hasOwn(TYPE_STYLES, value)) {
        edits.push({ start, end, text: TYPE_STYLES[value] });
      }
    });
  }

  for (const prop of LAYER_03_PROPS[/** @type {"Box"} */ (name)] ?? []) {
    const attribute = attributes.get(prop);
    if (!attribute) continue;
    forEachString(attribute, (start, end, value) => {
      if (value !== "layer-03") return;
      if (context.options.keepLayer03Color) {
        edits.push({ start, end, text: "layer-accent" });
      } else {
        note(
          context,
          attribute.start,
          "layer-03",
          `${name} ${prop}="layer-03" now paints the real layer-03. Use "layer-accent" to keep the 0.113 color, or run with --keep-layer-03-color`,
        );
      }
    });
  }

  return edits;
}

/**
 * Moves `flatpickrProps` keys to DatePicker props.
 * @param {Context} context
 * @param {any} attribute
 * @param {Map<string, any>} attributes
 * @returns {Edit[]}
 */
function migrateFlatpickrProps(context, attribute, attributes) {
  const { text } = context;
  const object = unwrap(attributeExpression(attribute));
  if (object?.type !== "ObjectExpression") {
    note(
      context,
      attribute.start,
      "flatpickr",
      "flatpickrProps is not an object literal. Move its keys to DatePicker props by hand",
    );
    return [];
  }

  /** @type {string[]} */
  const moved = [];
  /** @type {any[]} */
  const kept = [];
  let changed = false;
  const isLiteral = (/** @type {any} */ node, /** @type {unknown} */ value) =>
    node.type === "Literal" && node.value === value;
  const keep = (/** @type {any} */ property, /** @type {string} */ message) => {
    kept.push(property);
    note(context, property.start, "flatpickr", message);
  };

  const properties = object.properties;
  const movedKeys = new Set();
  for (const property of properties) {
    const key = propertyKey(property);
    if (key === undefined) {
      keep(
        property,
        `flatpickrProps: move \`${text.slice(property.start, property.end)}\` by hand`,
      );
      continue;
    }
    if (key === "altInput") continue;

    if (key === "shorthandCurrentMonth" && isLiteral(property.value, false)) {
      changed = true;
      continue;
    }
    const target =
      key === "shorthandCurrentMonth" && isLiteral(property.value, true)
        ? "monthLabel"
        : FLATPICKR_RENAMES[/** @type {"minDate"} */ (key)];
    if (!target) {
      keep(property, `flatpickrProps.${key}: ${flatpickrAdvice(key)}`);
      continue;
    }
    if (attributes.has(target)) {
      keep(
        property,
        `flatpickrProps.${key}: DatePicker already sets \`${target}\`. Merge them by hand`,
      );
      continue;
    }
    moved.push(
      target === "monthLabel"
        ? 'monthLabel="short"'
        : propText(text, target, property),
    );
    movedKeys.add(key);
    changed = true;
  }

  for (const property of properties) {
    if (propertyKey(property) !== "altInput") continue;
    if (
      isLiteral(property.value, false) ||
      (isLiteral(property.value, true) && movedKeys.has("altFormat"))
    ) {
      changed = true;
    } else {
      keep(property, `flatpickrProps.altInput: ${flatpickrAdvice("altInput")}`);
    }
  }

  if (!changed) return [];
  kept.sort((a, b) => a.start - b.start);
  if (kept.length > 0) {
    const rest = kept.map((property) =>
      text.slice(property.start, property.end),
    );
    moved.push(`flatpickrProps={{ ${rest.join(", ")} }}`);
  }

  const lineStart = text.lastIndexOf("\n", attribute.start - 1) + 1;
  const indent = text.slice(lineStart, attribute.start);
  const separator = WHITESPACE.test(indent) ? `\n${indent}` : " ";
  return [
    { start: attribute.start, end: attribute.end, text: moved.join(separator) },
  ];
}

/**
 * Renames v10 keys in a Theme `tokens` object.
 * @param {Context} context
 * @param {any} attribute
 * @returns {Edit[]}
 */
function migrateThemeTokens(context, attribute) {
  const expression = unwrap(attributeExpression(attribute));
  if (expression?.type === "ObjectExpression") {
    /** @type {Edit[]} */
    const edits = [];
    for (const property of expression.properties) {
      const { key } = property;
      if (property.type !== "Property" || property.computed) continue;
      if (key.type !== "Literal" || typeof key.value !== "string") continue;
      const edit = renameThemeKey(context, key.value, key.start);
      if (edit) edits.push(edit);
    }
    return edits;
  }

  if (expression?.type === "Identifier") {
    const edits = migrateTokensVariable(context, expression.name);
    if (edits) return edits;
  }
  note(
    context,
    attribute.start,
    "theme",
    "Theme tokens is not an object literal. Rename any v10 keys in it by hand",
  );
  return [];
}

/**
 * Renames v10 keys in `const name = { … }` in a script block.
 * @param {Context} context
 * @param {string} name
 * @returns {Edit[] | undefined}
 */
function migrateTokensVariable(context, name) {
  const { text } = context;
  const declaration = new RegExp(
    `(?:\\b(?:const|let|var)\\s+${name}\\b[^=]*|\\$:\\s*${name}\\s*)=\\s*\\{`,
  );
  const svx = isSvx(context.options.filename);
  for (const block of findBlocks(text, svx)) {
    if (block.tag !== "script") continue;
    const script = text.slice(block.start, block.end);
    const match = declaration.exec(script);
    if (!match) continue;
    const open =
      block.start + /** @type {number} */ (match.index) + match[0].length - 1;
    const close = matchingBrace(text, open);
    if (close === -1) return undefined;
    /** @type {Edit[]} */
    const edits = [];
    for (const key of text.slice(open, close).matchAll(QUOTED_TOKEN_KEY)) {
      const edit = renameThemeKey(
        context,
        key[2],
        open + /** @type {number} */ (key.index),
      );
      if (edit) edits.push(edit);
    }
    return edits;
  }
  return undefined;
}

/**
 * @param {Context} context
 * @param {string} name
 * @param {number} quoteStart
 * @returns {Edit | undefined}
 */
function renameThemeKey(context, name, quoteStart) {
  if (!Object.hasOwn(COLOR_TOKENS, name)) return undefined;
  if (SPLIT_TOKENS[name]) {
    note(
      context,
      quoteStart,
      "token",
      `Theme token "${name}" was split in v11 into ${SPLIT_TOKENS[name].join(", ")}. Rename the key by hand`,
    );
    return undefined;
  }
  return {
    start: quoteStart + 1,
    end: quoteStart + 1 + name.length,
    text: COLOR_TOKENS[name]["*"],
  };
}

/**
 * @param {string} text
 * @param {number} open
 */
function matchingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/**
 * The first component whose `light` is static `true`.
 * @param {any} html
 * @param {Imports} imports
 */
function findLightTarget(html, imports) {
  /** @type {{ node: any; attribute: any } | undefined} */
  let target;
  walkMarkup(html, (node) => {
    if (target) return;
    const name = resolveComponent(imports, node);
    if (!name || !LIGHT_COMPONENTS.has(name)) return;
    const attribute = node.attributes.find(
      (/** @type {any} */ a) => a.type === "Attribute" && a.name === "light",
    );
    if (attribute && staticBoolean(attribute) === true) {
      target = { node, attribute };
    }
  });
  return target;
}

/**
 * Drops `light` and wraps the component in a Layer. A component on its own
 * lines gets the Layer on lines around it and one more indent; otherwise
 * the Layer goes inline.
 * @param {Context} context
 * @param {{ node: any; attribute: any }} target
 * @param {string} layer
 * @param {Imports} imports
 */
function wrapInLayer(context, target, layer, imports) {
  const { text } = context;
  const { node, attribute } = target;
  const removal = removeAttribute(text, node, attribute);
  const element =
    text.slice(node.start, removal.start) + text.slice(removal.end, node.end);

  const lineStart = text.lastIndexOf("\n", node.start - 1) + 1;
  const lineEnd = text.indexOf("\n", node.end);
  const before = text.slice(lineStart, node.start);
  const after = text.slice(node.end, lineEnd === -1 ? text.length : lineEnd);

  let wrapped = `<${layer}>${element}</${layer}>`;
  if (
    WHITESPACE.test(before) &&
    WHITESPACE.test(after) &&
    canReindent(element, node, imports)
  ) {
    const unit = indentUnit(element, before);
    const body = element.replace(NEWLINE_BEFORE_TEXT, `\n${unit}`);
    wrapped = `<${layer}>\n${before}${unit}${body}\n${before}</${layer}>`;
  }
  context.text = text.slice(0, node.start) + wrapped + text.slice(node.end);
}

/**
 * The file's indent step, read from the element's first indented line.
 * @param {string} element
 * @param {string} before the element's own indentation
 */
function indentUnit(element, before) {
  const inner = INDENT.exec(element)?.[1] ?? "";
  if (inner.length > before.length && inner.startsWith(before)) {
    return inner.slice(before.length);
  }
  return before.includes("\t") ? "\t" : "  ";
}

/**
 * Whether adding indentation inside an element keeps its content: not when
 * it holds a template literal, `<pre>`, `<textarea>` or CodeSnippet text.
 * @param {string} element
 * @param {any} node
 * @param {Imports} imports
 */
function canReindent(element, node, imports) {
  if (element.includes("`") || RAW_TEXT_ELEMENT.test(element)) return false;
  let safe = true;
  walkMarkup(node, (child) => {
    if (
      resolveComponent(imports, child) === "CodeSnippet" &&
      child.children?.length > 0
    ) {
      safe = false;
    }
  });
  return safe;
}
