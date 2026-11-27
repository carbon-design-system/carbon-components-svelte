/**
 * The 0.115 upgrade: Theme's `render` controls become ThemeToggle,
 * ThemeSelect and ThemeDropdown, and the props `:has()` made redundant go.
 * Everything else that changed is reported with its file and line. See
 * docs/migrations/v0.115.x.md.
 *
 * `transform` is pure, like the 0.114 one. Notes are taken before any edit
 * that adds or removes a line, so they point at the input's lines.
 */
import {
  addComponentImport,
  applyEdits,
  attributeExpression,
  attributesOf,
  blank,
  CSS_EXTENSION,
  findBlocks,
  INDENT,
  instanceScript,
  isSelfClosing,
  isSvx,
  isTypeScript,
  lineIndent,
  note,
  parseMarkup,
  propertyKey,
  propText,
  readImports,
  removeAttribute,
  resolveComponent,
  scriptText,
  staticBoolean,
  staticString,
  SVELTE_EXTENSION,
  unwrap,
  walkMarkup,
  WHITESPACE,
} from "../lib/svelte.js";
import {
  CONTROL_CLASSES,
  DEPRECATED_PROPS,
  FORM_FIELDS,
  INPUT_GROUP_SIZED,
  INPUT_GROUP_SPLIT,
  NOTIFICATIONS,
  REMOVED_CLASSES,
  REQUIRED_FIELDS,
  THEME_CONTROLS,
} from "./maps.js";

/**
 * @typedef {import("../lib/svelte.js").Edit} Edit
 * @typedef {import("../lib/svelte.js").Note} Note
 * @typedef {import("../lib/svelte.js").Imports} Imports
 * @typedef {import("../lib/svelte.js").Block} Block
 * @typedef {import("../lib/svelte.js").BaseOptions & { keepSizes?: boolean }} Options
 * @typedef {{ text: string; notes: Note[]; options: Options }} Context
 * @typedef {{
 *   mode: string;
 *   remove: any[];
 *   object: any;
 *   themeAttribute: any;
 *   binding: any;
 *   variable: string | undefined;
 *   initial: string;
 * }} ThemePlan
 */

/** What the CLI calls each kind of note. */
export const NOTE_TITLES = {
  theme: "Theme `render`",
  deprecated: "Deprecated props removed",
  "form-field": "Form field `class` and `style` go on the root",
  "combo-box": "ComboBox `name` submits `selectedId`",
  size: "SearchMenu defaults to 40px",
  layout: "Layout in InputGroup, TimePicker and ButtonSet",
  classes: "Classes no longer rendered",
  required: "Required fields show their own invalid state",
  "data-table": "DataTable shows a row when a filter matches none",
  dialog: "Dialog closes after its animation",
  notification: "Escape closes notifications",
  "link-segments": "linkSegments links fewer URLs",
  parse: "Files not fully migrated",
};

/** What the CLI says once per run, since no file shows it. */
export const SUMMARY = [
  "Chrome and Edge 105, Firefox 121 and Safari 15.4 are the minimum. Stay on 0.114 if your users are on older browsers.",
  "Arrow keys in Menu, MenuButton, ComboButton and ContextMenu now wrap focus at either end. Code that relied on them stopping must handle keydown itself.",
];

const REMOVED_CLASS = new RegExp(
  `(?<![\\w-])(${Object.keys(REMOVED_CLASSES).join("|")})(?![\\w-])`,
  "g",
);
const CONTROL_CLASS = new RegExp(
  `\\.(${CONTROL_CLASSES.join("|")})(?![\\w-])`,
  "g",
);
const CONSUMER_CLASS = /\.(?!bx--)([\w-]+)/;
const SELECTOR_BOUNDARY = /[\s,{}>+~()]/;
const CLASS_NAMES = /\S+/g;
const SAFE_CLASS = /^[\w-]+$/;
const RUNES = /\$(?:state|props|derived|effect)\b/;
const IMPORT_STATEMENT =
  /^[ \t]*import\b[\s\S]*?["'][^"'\n]*["'][ \t]*;?[ \t]*$/gm;
const THEME_TYPE =
  'import("carbon-components-svelte/src/Theme/theme-labels.js").CarbonTheme';
const MAX_LINE = 80;
const CARBON_NAMED_IMPORT =
  /import\s+(?:type\s+)?(?:\w+\s*,\s*)?\{[^}]*\}\s*from\s*(["'])carbon-components-svelte(?:\/[^"']*)?\1/g;
const CARBON_NAMESPACE_IMPORT =
  /import\s+\*\s+as\s+(\w+)\s+from\s*(["'])carbon-components-svelte\2/g;
const LINK_SEGMENTS = /\blinkSegments\b/;
const LINK_SEGMENTS_MESSAGE =
  "linkSegments now leaves URLs with credentials, like `https://google.com@evil.example/`, as text, and ends a link at a bidi or zero-width character, a quote, `{`, `}`, `|` or CJK punctuation. Check the text it splits and tests of its output";

/**
 * @param {string} source
 * @param {Options} options
 * @returns {{ code: string; notes: Note[] }}
 */
export function transform(source, options) {
  /** @type {Context} */
  const context = { text: source, notes: [], options };
  const svelte = SVELTE_EXTENSION.test(options.filename);
  const blocks = svelte ? findBlocks(source, isSvx(options.filename)) : [];

  const code = blocks.filter((block) => block.tag === "code");
  reportRemovedClasses(context, code);
  if (!CSS_EXTENSION.test(options.filename)) reportLinkSegments(context, code);
  if (svelte) {
    transformSvelte(context, blocks);
  } else if (CSS_EXTENSION.test(options.filename)) {
    reportControlSelectors(context, 0, source.length);
  }

  context.notes.sort((a, b) => a.line - b.line || a.column - b.column);
  return { code: context.text, notes: context.notes };
}

/**
 * Notes every class the components no longer render, outside .svx code.
 * @param {Context} context
 * @param {{ start: number; end: number }[]} skip
 */
function reportRemovedClasses(context, skip) {
  for (const match of context.text.matchAll(REMOVED_CLASS)) {
    const offset = /** @type {number} */ (match.index);
    if (skip.some((range) => offset >= range.start && offset < range.end)) {
      continue;
    }
    note(
      context,
      offset,
      "classes",
      `\`${match[1]}\` is no longer rendered. Select \`${REMOVED_CLASSES[match[1]]}\` instead`,
    );
  }
}

/**
 * Notes each import of `linkSegments`, and each use through a namespace
 * import, outside .svx code. Its splits changed, and no file shows how.
 * @param {Context} context
 * @param {{ start: number; end: number }[]} skip
 */
function reportLinkSegments(context, skip) {
  const { text } = context;
  /** @param {number} offset */
  const skipped = (offset) =>
    skip.some((range) => offset >= range.start && offset < range.end);
  for (const match of text.matchAll(CARBON_NAMED_IMPORT)) {
    const name = LINK_SEGMENTS.exec(match[0]);
    const offset = /** @type {number} */ (match.index) + (name?.index ?? 0);
    if (name && !skipped(offset)) {
      note(context, offset, "link-segments", LINK_SEGMENTS_MESSAGE);
    }
  }
  for (const match of text.matchAll(CARBON_NAMESPACE_IMPORT)) {
    if (skipped(/** @type {number} */ (match.index))) continue;
    const use = new RegExp(`\\b${match[1]}\\.linkSegments\\b`, "g");
    for (const member of text.matchAll(use)) {
      const offset = /** @type {number} */ (member.index);
      if (!skipped(offset)) {
        note(context, offset, "link-segments", LINK_SEGMENTS_MESSAGE);
      }
    }
  }
}

/**
 * Notes a compound selector that joins a control's class with another
 * class, like `.bx--text-input.name`. The other class now lands on the
 * field's root, so the compound matches nothing.
 * @param {Context} context
 * @param {number} start
 * @param {number} end
 * @returns {{ start: number; end: number }[]} the compounds it noted
 */
function reportControlSelectors(context, start, end) {
  const { text } = context;
  const region = text.slice(start, end);
  /** @type {{ start: number; end: number }[]} */
  const reported = [];
  for (const match of region.matchAll(CONTROL_CLASS)) {
    const index = /** @type {number} */ (match.index);
    let from = index;
    while (from > 0 && !SELECTOR_BOUNDARY.test(region[from - 1])) from--;
    let to = index + match[0].length;
    while (to < region.length && !SELECTOR_BOUNDARY.test(region[to])) to++;
    const compound = region.slice(from, to);
    const other = CONSUMER_CLASS.exec(compound.replace(match[0], ""));
    if (!other) continue;
    reported.push({ start: start + from, end: start + to });
    note(
      context,
      start + from,
      "form-field",
      `\`${compound}\` expects \`${other[0]}\` on the control. Form fields put \`class\` on their root now; select \`${other[0]} .${match[1]}\``,
    );
  }
  return reported;
}

/**
 * @param {Context} context
 * @param {Block[]} blocks
 */
function transformSvelte(context, blocks) {
  const { parse } = context.options;
  const svx = isSvx(context.options.filename);
  const styles = blocks.filter((block) => block.tag === "style");
  const compounds = styles.flatMap((style) =>
    reportControlSelectors(context, style.start, style.end),
  );

  const imports = readImports(context.text, svx);
  if (imports.components.size === 0 && imports.namespaces.size === 0) return;
  const markup = parse ? parseMarkup(context.text, blocks, parse) : undefined;
  if (!markup) {
    note(
      context,
      0,
      "parse",
      parse
        ? "Svelte could not parse this file, so props were not migrated"
        : "Svelte was not found, so props were not migrated",
    );
    return;
  }

  // Pass 1: notes and the edits that keep lines in place, from the input.
  /** @type {Edit[]} */
  const edits = [];
  /** @type {Map<string, string>} consumer class to the field it is on */
  const fieldClasses = new Map();
  walkMarkup(markup.html, (node, ancestors) => {
    const name = resolveComponent(imports, node);
    if (!name) return;
    edits.push(
      ...checkComponent(context, node, name, ancestors, imports, fieldClasses),
    );
  });

  for (const [className, field] of fieldClasses) {
    const pattern = new RegExp(`\\.${className}(?![\\w-])`, "g");
    for (const style of styles) {
      const css = context.text.slice(style.start, style.end);
      for (const match of css.matchAll(pattern)) {
        const offset = style.start + /** @type {number} */ (match.index);
        if (compounds.some((c) => offset >= c.start && offset < c.end)) {
          continue;
        }
        const control = FORM_FIELDS[field];
        note(
          context,
          offset,
          "form-field",
          control
            ? `\`.${className}\` styled ${field}'s control. It now matches the field's root; select \`.${className} ${control}\` for the control`
            : `\`.${className}\` styled FileUploaderButton's hidden input. It now matches the button`,
        );
      }
    }
  }
  applyEdits(context, edits);

  // Pass 2: one Theme at a time, since each adds lines and imports.
  // Each pass removes a `render`. The bound only guards against a bug.
  for (let i = 0; i < 100; i++) {
    const current = readImports(context.text, svx);
    const ast = parseMarkup(context.text, findBlocks(context.text, svx), parse);
    if (!ast) break;
    /** @type {{ node: any; plan: ThemePlan | "strip" } | undefined} */
    let target;
    walkMarkup(ast.html, (node) => {
      if (target || resolveComponent(current, node) !== "Theme") return;
      const plan = planTheme(context.text, node);
      if (plan && !isReport(plan)) target = { node, plan };
    });
    if (!target) break;
    convertTheme(context, target.node, target.plan, current, ast);
  }
}

/**
 * Notes and line-keeping edits for one Carbon component.
 * @param {Context} context
 * @param {any} node
 * @param {string} name
 * @param {any[]} ancestors
 * @param {Imports} imports
 * @param {Map<string, string>} fieldClasses
 * @returns {Edit[]}
 */
function checkComponent(context, node, name, ancestors, imports, fieldClasses) {
  const { text } = context;
  const attributes = attributesOf(node);
  const has = (/** @type {string} */ prop) =>
    attributes.has(prop) || attributesOf(node, "Binding").has(prop);
  const hasSpread = node.attributes.some(
    (/** @type {any} */ attribute) => attribute.type === "Spread",
  );
  const parent = resolveComponent(imports, ancestors.at(-1));
  /** @type {Edit[]} */
  const edits = [];

  if (name === "Theme") {
    const plan = planTheme(text, node);
    if (isReport(plan)) {
      note(context, plan.at, "theme", plan.report);
    } else if (plan === "strip") {
      for (const prop of ["render", "toggle", "select", "dropdown"]) {
        const attribute = attributes.get(prop);
        if (attribute) {
          note(
            context,
            attribute.start,
            "theme",
            `Removed Theme \`${prop}\`: it did nothing without a \`render\` control`,
          );
        }
      }
    } else if (plan) {
      noteThemeLabels(context, plan);
    }
  }

  if (Object.hasOwn(FORM_FIELDS, name)) {
    for (const prop of ["class", "style"]) {
      const attribute = attributes.get(prop);
      if (!attribute) continue;
      const control = FORM_FIELDS[name];
      note(
        context,
        attribute.start,
        "form-field",
        control
          ? `${name} puts \`${prop}\` on its root now, not on its ${describeControl(control)}`
          : `FileUploaderButton puts \`${prop}\` on its button now, not on the hidden file input`,
      );
      if (prop === "class") {
        for (const [className] of (staticString(attribute) ?? "").matchAll(
          CLASS_NAMES,
        )) {
          if (SAFE_CLASS.test(className)) fieldClasses.set(className, name);
        }
      }
    }
  }

  if (name === "ComboBox" && attributes.has("name") && !has("inputName")) {
    note(
      context,
      attributes.get("name").start,
      "combo-box",
      "ComboBox `name` submits `selectedId` through a hidden input now, not the typed text. Add `inputName` to submit the text too",
    );
  }

  if (name === "SearchMenu" && !has("size")) {
    if (hasSpread) {
      note(
        context,
        node.start,
        "size",
        "SearchMenu is 40px now unless `size` is set, and a spread here may set it",
      );
    } else if (context.options.keepSizes) {
      const at = node.start + 1 + node.name.length;
      edits.push({ start: at, end: at, text: ' size="xl"' });
    } else {
      note(
        context,
        node.start,
        "size",
        'SearchMenu is 40px now, not 48px. Add size="xl" to keep 48px, or run with --keep-sizes',
      );
    }
  }

  if (parent === "InputGroup" && INPUT_GROUP_SPLIT.has(name)) {
    note(
      context,
      node.start,
      "layout",
      `In an InputGroup, ${name} now splits the row with the other fields. Wrap it in a Box with a width to fix its width`,
    );
  } else if (
    parent === "InputGroup" &&
    INPUT_GROUP_SIZED.has(name) &&
    !has("size")
  ) {
    note(
      context,
      node.start,
      "layout",
      `In an InputGroup, ${name} now takes the group's size`,
    );
  }
  if (name === "TimePicker" && holds(node, imports, "TimePickerSelect")) {
    note(
      context,
      node.start,
      "layout",
      "TimePicker now puts 1px before every select, not Carbon's 2px margin on both sides",
    );
  }
  if (name === "ButtonSet" && !attributes.has("stacked")) {
    note(
      context,
      node.start,
      "layout",
      "ButtonSet buttons now start from their label's width instead of splitting the set evenly",
    );
  }

  for (const [prop, reason] of Object.entries(DEPRECATED_PROPS[name] ?? {})) {
    const attribute = attributes.get(prop);
    if (!attribute) continue;
    if (name === "ContentSwitcher" && !everySwitchHasIcon(node, imports)) {
      note(
        context,
        attribute.start,
        "deprecated",
        "ContentSwitcher `iconOnly` is deprecated, but a Switch here sets no `icon`, so the switcher would stop fitting its switches. Left in place",
      );
      continue;
    }
    edits.push(removeAttribute(text, node, attribute));
    note(
      context,
      attribute.start,
      "deprecated",
      `Removed ${name} \`${prop}\`: ${reason}`,
    );
  }

  if (REQUIRED_FIELDS.has(name)) {
    const required = attributes.get("required");
    if (
      required &&
      staticBoolean(required) !== false &&
      !has("requiredInvalidText") &&
      !has("invalid")
    ) {
      note(
        context,
        required.start,
        "required",
        `A blocked submit now shows ${name}'s invalid state and focuses it, instead of the browser's bubble. Set \`requiredInvalidText\` to change the message`,
      );
    }
  }

  if (
    name === "DatePickerInput" &&
    !has("patternInvalidText") &&
    !has("invalid")
  ) {
    const picker = ancestors.findLast(
      (ancestor) => resolveComponent(imports, ancestor) === "DatePicker",
    );
    const type = picker && attributesOf(picker).get("datePickerType");
    if (type && staticString(type) === "simple") {
      note(
        context,
        node.start,
        "required",
        "A blocked submit with a typed date that doesn't match `dateFormat` now shows DatePickerInput's invalid state, instead of the browser's bubble. Set `patternInvalidText` to change the message",
      );
    }
  }

  if (
    name === "DataTable" &&
    !has("noResultsText") &&
    filters(node, imports) &&
    !hasSlot(node, "noResults")
  ) {
    note(
      context,
      node.start,
      "data-table",
      'A filter that matches no rows now shows a "No results" row. Set noResultsText="" to keep an empty body',
    );
  }

  if (name === "Dialog") {
    const closes =
      node.attributes.some(
        (/** @type {any} */ attribute) =>
          attribute.type === "EventHandler" && attribute.name === "close",
      ) ||
      attributes.has("onclose") ||
      attributesOf(node, "Binding").has("open");
    if (closes) {
      note(
        context,
        node.start,
        "dialog",
        "Dialog animates its close now: `open` turns false and `close` fires up to 240 ms later",
      );
    }
  }

  if (
    NOTIFICATIONS.has(name) &&
    !has("closeOnEscape") &&
    !has("actionable") &&
    !(
      attributes.has("hideCloseButton") &&
      staticBoolean(attributes.get("hideCloseButton")) !== false
    )
  ) {
    note(
      context,
      node.start,
      "notification",
      `Escape now closes ${name} while focus is inside it. Set closeOnEscape={false} to keep it open`,
    );
  }

  return edits;
}

/** `<input>` for `input`; a class selector as code. @param {string} control */
function describeControl(control) {
  return control.startsWith(".") ? `\`${control}\`` : `<${control}>`;
}

/**
 * Whether every Switch inside a ContentSwitcher sets `icon`.
 * @param {any} node
 * @param {Imports} imports
 */
function everySwitchHasIcon(node, imports) {
  let switches = 0;
  let withIcon = 0;
  walkMarkup(node, (child) => {
    if (child === node || resolveComponent(imports, child) !== "Switch") return;
    switches++;
    if (attributesOf(child).has("icon")) withIcon++;
  });
  return switches > 0 && switches === withIcon;
}

/**
 * Whether a component holds another, at any depth.
 * @param {any} node
 * @param {Imports} imports
 * @param {string} name
 */
function holds(node, imports, name) {
  let found = false;
  walkMarkup(node, (child) => {
    if (child !== node && resolveComponent(imports, child) === name) {
      found = true;
    }
  });
  return found;
}

/**
 * Whether a DataTable can filter its rows: a ToolbarSearch inside it, or
 * rows it is told to show.
 * @param {any} node
 * @param {Imports} imports
 */
function filters(node, imports) {
  const attributes = attributesOf(node);
  if (attributes.has("filteredRowIds")) return true;
  if (attributesOf(node, "Binding").has("filteredRowIds")) return true;
  return holds(node, imports, "ToolbarSearch");
}

/**
 * @param {any} node
 * @param {string} name
 */
function hasSlot(node, name) {
  let found = false;
  walkMarkup(node, (child) => {
    if (child === node || !child.attributes) return;
    const slot = attributesOf(child).get("slot");
    if (slot && staticString(slot) === name) found = true;
  });
  return found;
}

/**
 * @param {ReturnType<typeof planTheme>} plan
 * @returns {plan is { report: string; at: number }}
 */
function isReport(plan) {
  return typeof plan === "object" && "report" in plan;
}

/**
 * What to do with a Theme's `render`, `toggle`, `select` and `dropdown`:
 * nothing (`undefined`), drop them (`"strip"`, as they do nothing without
 * a static `render`), report them, or replace them with a control.
 * @param {string} text
 * @param {any} node
 * @returns {ThemePlan | "strip" | { report: string; at: number } | undefined}
 */
function planTheme(text, node) {
  const attributes = attributesOf(node);
  const render = attributes.get("render");
  const objects = ["toggle", "select", "dropdown"]
    .map((key) => attributes.get(key))
    .filter(Boolean);
  if (!render && objects.length === 0) return undefined;

  const value = render ? staticString(render) : undefined;
  const expression = render ? unwrap(attributeExpression(render)) : undefined;
  if (
    render &&
    value === undefined &&
    !(expression?.type === "Identifier" && expression.name === "undefined")
  ) {
    return {
      report:
        "Theme `render` is dynamic. Replace it with ThemeToggle, ThemeSelect or ThemeDropdown, bound to the same theme with `bind:theme`",
      at: render.start,
    };
  }
  const mode =
    value !== undefined && Object.hasOwn(THEME_CONTROLS, value)
      ? value
      : undefined;
  const remove = render ? [render, ...objects] : objects;
  if (!mode) return "strip";

  const binding = attributesOf(node, "Binding").get("theme");
  const themeAttribute = attributes.get("theme");
  /** @type {string | undefined} */
  let variable;
  let initial = "white";
  if (binding) {
    const bound = binding.expression;
    variable =
      bound?.type === "Identifier"
        ? bound.name
        : text.slice(bound.start, bound.end);
  } else if (themeAttribute) {
    const themeValue = staticString(themeAttribute);
    const themeExpression = unwrap(attributeExpression(themeAttribute));
    if (themeValue !== undefined) {
      initial = themeValue;
    } else if (themeExpression?.type === "Identifier") {
      variable = themeExpression.name;
    } else {
      return {
        report:
          "Theme `theme` is an expression, so a control can't bind to it. Bind Theme to a variable, then replace `render` with ThemeToggle, ThemeSelect or ThemeDropdown bound to it",
        at: themeAttribute.start,
      };
    }
  }
  return {
    mode,
    remove,
    object: attributes.get(mode),
    themeAttribute: binding ? undefined : themeAttribute,
    binding,
    variable,
    initial,
  };
}

/**
 * Notes the labels a control object left out, which took the inner
 * component's defaults before and take the theme control's now.
 * @param {Context} context
 * @param {ThemePlan} plan
 */
function noteThemeLabels(context, plan) {
  const object = plan.object && unwrap(attributeExpression(plan.object));
  if (object?.type !== "ObjectExpression") return;
  const keys = new Set(object.properties.map(propertyKey));
  if (object.properties.some((/** @type {any} */ p) => !propertyKey(p))) {
    return;
  }
  const { component, before, after } = THEME_CONTROLS[plan.mode];
  const missing = Object.keys(before).filter((key) => !keys.has(key));
  if (missing.length === 0) return;
  const list = (/** @type {Record<string, string>} */ values) =>
    missing.map((key) => `${key}="${values[key]}"`).join(", ");
  note(
    context,
    plan.object.start,
    "theme",
    `Theme's \`${plan.mode}\` object replaced its defaults, so the control had ${list(before)}. ${component} has ${list(after)}. Set them to keep the old labels`,
  );
}

/**
 * Replaces a Theme's `render` with a control bound to the same theme.
 * @param {Context} context
 * @param {any} node
 * @param {ThemePlan | "strip"} plan
 * @param {Imports} imports
 * @param {any} ast
 */
function convertTheme(context, node, plan, imports, ast) {
  const { text } = context;
  if (plan === "strip") {
    const attributes = attributesOf(node);
    const remove = ["render", "toggle", "select", "dropdown"]
      .map((key) => attributes.get(key))
      .filter(Boolean);
    applyEdits(
      context,
      remove.map((attribute) => removeAttribute(text, node, attribute)),
    );
    return;
  }

  const variable = plan.variable ?? freeName(context, node, ast);
  const bind = variable === "theme" ? "bind:theme" : `bind:theme={${variable}}`;

  /** @type {Edit[]} */
  const edits = plan.remove.map((attribute) =>
    removeAttribute(text, node, attribute),
  );
  if (plan.themeAttribute) {
    const { start, end } = plan.themeAttribute;
    edits.push({ start, end, text: bind });
  } else if (!plan.binding) {
    // First, in the gap the first attribute has, so a removal that starts
    // at the same offset doesn't drop it.
    const at = node.start + 1 + node.name.length;
    const first = node.attributes[0];
    const gap = first ? text.slice(at, first.start) : "";
    const separator = gap && WHITESPACE.test(gap) ? gap : " ";
    edits.unshift({ start: at, end: at, text: separator + bind });
  }

  const { component } = THEME_CONTROLS[plan.mode];
  const dot = node.name.lastIndexOf(".");
  let local =
    dot > 0
      ? `${node.name.slice(0, dot)}.${component}`
      : [...imports.components].find(([, name]) => name === component)?.[0];
  const needsImport = !local;
  if (!local) {
    local = new RegExp(`\\b${component}\\b`).test(imports.scripts)
      ? `Carbon${component}`
      : component;
  }

  const indent = lineIndent(text, node.start);
  const control = controlText(
    text,
    local,
    [bind, ...controlProps(text, plan.object)],
    indent ?? "",
  );
  if (isSelfClosing(text, node)) {
    const separator = indent === undefined ? " " : `\n${indent}`;
    edits.push({ start: node.end, end: node.end, text: separator + control });
  } else {
    // Before the Theme, which renders the control ahead of its slot.
    const separator = indent === undefined ? " " : `\n${indent}`;
    edits.push({
      start: node.start,
      end: node.start,
      text: control + separator,
    });
  }
  applyEdits(context, edits);

  if (!plan.variable) declareTheme(context, variable, plan.initial);
  if (needsImport) {
    addComponentImport(context, { name: component, local, folder: "Theme" });
  }
}

/**
 * A control's props from Theme's `toggle`, `select` or `dropdown` value.
 * @param {string} text
 * @param {any} attribute
 */
function controlProps(text, attribute) {
  if (!attribute) return [];
  const raw = attributeExpression(attribute);
  const object = unwrap(raw);
  if (!object) return [];
  if (object.type !== "ObjectExpression") {
    return [`{...${text.slice(raw.start, raw.end)}}`];
  }
  return object.properties.map((/** @type {any} */ property) => {
    const key = propertyKey(property);
    if (key) return propText(text, key, property);
    if (property.type === "SpreadElement") {
      const { argument } = property;
      return `{...${text.slice(argument.start, argument.end)}}`;
    }
    return `{...{ ${text.slice(property.start, property.end)} }}`;
  });
}

/**
 * `<Control a b />` on one line, or one prop per line past 80 columns.
 * @param {string} text
 * @param {string} name
 * @param {string[]} props
 * @param {string} indent
 */
function controlText(text, name, props, indent) {
  const line = `<${name} ${props.join(" ")} />`;
  if (indent.length + line.length <= MAX_LINE && !line.includes("\n")) {
    return line;
  }
  const unit = INDENT.exec(text)?.[1] || "  ";
  const step = unit.startsWith("\t") ? "\t" : "  ";
  return `<${name}\n${props.map((prop) => `${indent}${step}${prop}`).join("\n")}\n${indent}/>`;
}

/**
 * `theme`, or `currentTheme` when the file already uses `theme`.
 * @param {Context} context
 * @param {any} node the Theme, whose own attributes don't count
 * @param {any} ast
 */
function freeName(context, node, ast) {
  const { text } = context;
  const svx = isSvx(context.options.filename);
  /** @type {{ start: number; end: number }[]} */
  const ranges = findBlocks(text, svx).filter(
    (block) => block.tag !== "script",
  );
  walkMarkup(ast.html, (child) => {
    if (child.type === "Text" || child.type === "Comment") ranges.push(child);
  });
  ranges.push({ start: node.start, end: node.end });
  const searched = `${blank(text, ranges)}\n${scriptText(text, svx)}`;
  for (let i = 1; ; i++) {
    const name =
      i === 1 ? "theme" : i === 2 ? "currentTheme" : `currentTheme${i - 1}`;
    if (!new RegExp(`(?<![\\w$.-])${name}(?![\\w$-])`).test(searched)) {
      return name;
    }
  }
}

/**
 * Declares the theme variable in the instance script, after its imports,
 * creating the script when there is none.
 * @param {Context} context
 * @param {string} variable
 * @param {string} initial
 */
function declareTheme(context, variable, initial) {
  const { text } = context;
  const svx = isSvx(context.options.filename);
  const blocks = findBlocks(text, svx);
  const script = instanceScript(blocks);
  const runes = RUNES.test(scriptText(text, svx));
  const value = runes
    ? `$state(${JSON.stringify(initial)})`
    : JSON.stringify(initial);

  if (!script) {
    context.text = `<script>\n  /** @type {${THEME_TYPE}} */\n  let ${variable} = ${value};\n</script>\n\n${text}`;
    return;
  }
  const body = text.slice(script.start, script.end);
  const indent = INDENT.exec(body)?.[1] ?? "  ";
  const declaration = isTypeScript(script)
    ? `let ${variable}: ${THEME_TYPE} = ${value};`
    : `/** @type {${THEME_TYPE}} */\n${indent}let ${variable} = ${value};`;
  const last = [...body.matchAll(IMPORT_STATEMENT)].at(-1);
  const at = last
    ? script.start + /** @type {number} */ (last.index) + last[0].length
    : script.start;
  const separator = last ? "\n\n" : "\n";
  context.text = `${text.slice(0, at)}${separator}${indent}${declaration}${text.slice(at)}`;
}
