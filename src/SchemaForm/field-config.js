// @ts-check

import { joinPath, templatePath } from "./form-path.js";

/**
 * @typedef {import("./create-form.js").FieldConfig} FieldConfig
 * @typedef {import("./create-form.js").FieldOption} FieldOption
 * @typedef {import("./create-form.js").FormMessages} FormMessages
 */

/**
 * A field config after `compileFields`.
 * @typedef {Object} FieldNode
 * @property {"field" | "group" | "array"} kind
 * @property {string} name The key inside the parent object ("" for the root, "*" for an array item).
 * @property {string} type
 * @property {string} label
 * @property {string} template The path with array indices replaced by `*`.
 * @property {FieldConfig} config
 * @property {FieldOption[] | undefined} options
 * @property {FieldNode[]} children The fields of a group.
 * @property {FieldNode | undefined} item The row of an array.
 * @property {Rule[]} rules
 */

/**
 * @callback Rule
 * @param {any} value
 * @param {RuleContext} context
 * @returns {string | undefined}
 *
 * @typedef {Object} RuleContext
 * @property {FieldNode} node
 * @property {(key: string, params?: Record<string, unknown>) => string} message
 * @property {boolean} required Whether `required` holds right now, for a dynamic `required`.
 */

const GROUP_TYPES = new Set(["object", "group"]);
const BOOLEAN_TYPES = new Set(["checkbox", "toggle"]);
const ARRAY_VALUE_TYPES = new Set([
  "multiselect",
  "checkboxes",
  "tags",
  "file",
  "togglebuttons",
]);

/**
 * The empty value of a type, which is also what a new row starts with.
 * @param {FieldNode} node
 * @returns {any}
 */
export function defaultFor(node) {
  const { config } = node;
  if (config.default !== undefined) return clone(config.default);
  if (node.kind === "group") {
    /** @type {Record<string, any>} */
    const out = {};
    for (const child of node.children) out[child.name] = defaultFor(child);
    return out;
  }
  if (node.kind === "array") {
    const min = config.minItems ?? 0;
    const item = /** @type {FieldNode} */ (node.item);
    return Array.from({ length: min }, () => defaultFor(item));
  }
  if (BOOLEAN_TYPES.has(node.type)) return false;
  if (ARRAY_VALUE_TYPES.has(node.type)) return [];
  switch (node.type) {
    case "number":
    case "integer":
      return null;
    case "rating":
      return 0;
    case "slider":
      return config.min ?? 0;
    case "rangeslider":
      return [config.min ?? 0, config.max ?? 100];
    case "daterange":
      return ["", ""];
    default:
      return "";
  }
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function clone(value) {
  return value && typeof value === "object"
    ? JSON.parse(JSON.stringify(value))
    : value;
}

/**
 * Whether a value counts as empty for the `required` rule and for rules
 * that only apply to a value the user entered.
 * @param {any} value
 * @param {string} type
 * @returns {boolean}
 */
export function isEmpty(value, type) {
  if (BOOLEAN_TYPES.has(type)) return value !== true;
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) {
    return type === "rangeslider" || type === "daterange"
      ? value.every((v) => v === "" || v == null)
      : value.length === 0;
  }
  if (type === "rating") return value === 0;
  if (typeof value === "number") return Number.isNaN(value);
  return false;
}

/**
 * @param {Array<FieldOption | string | number> | undefined} options
 * @returns {FieldOption[] | undefined}
 */
function normalizeOptions(options) {
  if (!options) return undefined;
  return options.map((option) =>
    typeof option === "object"
      ? { ...option, label: option.label ?? String(option.value) }
      : { value: option, label: String(option) },
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {string} value
 * @returns {boolean}
 */
function isUri(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isIsoDate(value) {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * @param {FieldNode} node
 * @returns {Rule[]}
 */
function buildRules(node) {
  const c = node.config;
  const type = node.type;
  /** @type {Rule[]} */
  const rules = [];

  if (c.required) {
    rules.push((value, { message, required }) =>
      required && isEmpty(value, type) ? message("required") : undefined,
    );
  }

  if (node.kind === "array") {
    if (c.minItems != null) {
      const min = c.minItems;
      rules.push((value, { message }) =>
        Array.isArray(value) && value.length < min
          ? message("minItems", { min })
          : undefined,
      );
    }
    if (c.maxItems != null) {
      const max = c.maxItems;
      rules.push((value, { message }) =>
        Array.isArray(value) && value.length > max
          ? message("maxItems", { max })
          : undefined,
      );
    }
    if (c.uniqueItems) {
      rules.push((value, { message }) =>
        Array.isArray(value) &&
        new Set(value.map((v) => JSON.stringify(v))).size !== value.length
          ? message("uniqueItems")
          : undefined,
      );
    }
    return rules;
  }

  if (node.kind === "group") return rules;

  if (c.minLength != null || c.maxLength != null) {
    const { minLength, maxLength } = c;
    rules.push((value, { message }) => {
      if (typeof value !== "string" || value === "") return undefined;
      const length = [...value].length;
      if (minLength != null && length < minLength) {
        return message("minLength", { min: minLength });
      }
      if (maxLength != null && length > maxLength) {
        return message("maxLength", { max: maxLength });
      }
    });
  }

  if (c.pattern) {
    const pattern = new RegExp(c.pattern, "u");
    rules.push((value, { message }) =>
      typeof value === "string" && value !== "" && !pattern.test(value)
        ? message("pattern")
        : undefined,
    );
  }

  const format = c.format ?? (type === "email" ? "email" : undefined);
  if (format) {
    /** @type {Record<string, (value: string) => boolean>} */
    const checks = {
      email: (v) => EMAIL.test(v),
      uri: isUri,
      url: isUri,
      date: isIsoDate,
      time: (v) => TIME.test(v),
    };
    const check = checks[format];
    if (check) {
      rules.push((value, { message }) =>
        typeof value === "string" && value !== "" && !check(value)
          ? message(format === "url" ? "uri" : format)
          : undefined,
      );
    }
  }

  const isNumeric = type === "number" || type === "integer";
  if (isNumeric) {
    if (type === "integer") {
      rules.push((value, { message }) =>
        typeof value === "number" && !Number.isInteger(value)
          ? message("integer")
          : undefined,
      );
    }
    rules.push((value, { message }) => {
      if (typeof value !== "number" || Number.isNaN(value)) return undefined;
      if (c.min != null && value < c.min) return message("min", { min: c.min });
      if (c.max != null && value > c.max) return message("max", { max: c.max });
      if (c.exclusiveMin != null && value <= c.exclusiveMin) {
        return message("exclusiveMin", { min: c.exclusiveMin });
      }
      if (c.exclusiveMax != null && value >= c.exclusiveMax) {
        return message("exclusiveMax", { max: c.exclusiveMax });
      }
      if (c.multipleOf != null) {
        const quotient = value / c.multipleOf;
        if (Math.abs(quotient - Math.round(quotient)) > 1e-9) {
          return message("multipleOf", { step: c.multipleOf });
        }
      }
    });
  }

  if (c.const !== undefined) {
    const expected = c.const;
    rules.push((value, { message }) =>
      isEmpty(value, type) || value === expected
        ? undefined
        : message("const", { value: expected }),
    );
  }

  return rules;
}

/**
 * @param {FieldConfig} config
 * @param {string} parentTemplate
 * @param {Set<string>} seen
 * @returns {FieldNode}
 */
function compileNode(config, parentTemplate, seen) {
  const name = config.name ?? "";
  const type =
    config.type ?? (config.fields ? "object" : config.items ? "array" : "text");
  const kind = GROUP_TYPES.has(type)
    ? "group"
    : type === "array"
      ? "array"
      : "field";
  const template = joinPath(parentTemplate, name);
  if (name !== "" && name !== "*") {
    if (name.includes(".")) {
      throw new Error(`SchemaForm: field name "${name}" cannot contain a dot`);
    }
    if (seen.has(template)) {
      throw new Error(`SchemaForm: duplicate field "${template}"`);
    }
    seen.add(template);
  }

  /** @type {FieldNode} */
  const node = {
    kind,
    name,
    type: kind === "group" ? "object" : type,
    label: config.label ?? name,
    template: templatePath(template),
    config,
    options: normalizeOptions(config.options),
    children: [],
    item: undefined,
    rules: [],
  };

  if (kind === "group") {
    node.children = (config.fields ?? []).map((child) =>
      compileNode(child, template, seen),
    );
  } else if (kind === "array") {
    node.item = compileNode({ ...config.items, name: "*" }, template, seen);
  }
  node.rules = buildRules(node);
  return node;
}

/**
 * Compile a field config list into the tree the form runs on.
 * @param {FieldConfig[]} fields
 * @returns {FieldNode}
 */
export function compileFields(fields) {
  return compileNode({ type: "object", name: "", fields }, "", new Set());
}

/**
 * Index the nodes of a compiled tree by template path.
 * @param {FieldNode} root
 * @returns {Map<string, FieldNode>}
 */
export function indexNodes(root) {
  /** @type {Map<string, FieldNode>} */
  const index = new Map();
  /** @param {FieldNode} node */
  const visit = (node) => {
    index.set(node.template, node);
    for (const child of node.children) visit(child);
    if (node.item) visit(node.item);
  };
  visit(root);
  return index;
}

/** @type {Record<string, string>} */
export const DEFAULT_MESSAGES = {
  required: "{label} is required",
  minLength: "{label} must be at least {min} characters",
  maxLength: "{label} must be at most {max} characters",
  pattern: "{label} isn't in the expected format",
  email: "{label} must be a valid email address",
  uri: "{label} must be a valid URL",
  date: "{label} must be a valid date",
  time: "{label} must be a valid time",
  integer: "{label} must be a whole number",
  min: "{label} must be at least {min}",
  max: "{label} must be at most {max}",
  exclusiveMin: "{label} must be greater than {min}",
  exclusiveMax: "{label} must be less than {max}",
  multipleOf: "{label} must be a multiple of {step}",
  const: "{label} must be {value}",
  minItems: "{label} needs at least {min} items",
  maxItems: "{label} allows at most {max} items",
  uniqueItems: "{label} can't repeat an item",
};

/**
 * @param {Record<string, any> | undefined} messages
 * @param {FieldNode} node
 * @returns {RuleContext["message"]}
 */
export function messageFor(messages, node) {
  return (key, params = {}) => {
    /** @type {any} */
    const entry = messages?.[key] ?? DEFAULT_MESSAGES[key] ?? key;
    /** @type {Record<string, any>} */
    const all = { label: node.label, ...params };
    if (typeof entry === "function") return entry(all);
    return entry.replace(
      /\{(\w+)\}/g,
      (/** @type {string} */ _, /** @type {string} */ name) =>
        String(all[name] ?? ""),
    );
  };
}
