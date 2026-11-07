// @ts-check

/**
 * @typedef {import("./create-form.js").FieldConfig} FieldConfig
 * @typedef {Record<string, any>} JsonSchema
 */

/** RJSF widget names, and the names this form uses for the same widget. */
const WIDGET_ALIASES = /** @type {Record<string, string>} */ ({
  updown: "number",
  range: "slider",
  select: "select",
  radio: "radio",
  checkboxes: "checkboxes",
  textarea: "textarea",
  password: "password",
  checkbox: "checkbox",
  date: "date",
  hidden: "hidden",
});

/**
 * @param {JsonSchema} root
 * @param {string} ref
 * @returns {JsonSchema}
 */
function followRef(root, ref) {
  if (!ref.startsWith("#")) {
    throw new Error(
      `SchemaForm: only a "$ref" inside the same schema is supported, got "${ref}"`,
    );
  }
  let node = root;
  for (const part of ref.slice(1).split("/").filter(Boolean)) {
    node =
      node?.[decodeURIComponent(part).replace(/~1/g, "/").replace(/~0/g, "~")];
  }
  if (!node) throw new Error(`SchemaForm: "$ref" ${ref} points at nothing`);
  return node;
}

/**
 * Follow `$ref` and fold `allOf` into one schema.
 * @param {JsonSchema} schema
 * @param {JsonSchema} root
 * @param {string[]} [trail]
 * @returns {JsonSchema}
 */
function flatten(schema, root, trail = []) {
  let out = schema;
  if (out.$ref) {
    if (trail.includes(out.$ref)) {
      throw new Error(`SchemaForm: "$ref" ${out.$ref} refers to itself`);
    }
    const { $ref, ...rest } = out;
    out = {
      ...flatten(followRef(root, $ref), root, [...trail, $ref]),
      ...rest,
    };
  }
  if (out.allOf) {
    const { allOf, ...rest } = out;
    /** @type {JsonSchema} */
    const merged = { ...rest };
    for (const part of allOf) {
      const piece = flatten(part, root, trail);
      Object.assign(merged, piece, {
        properties: Object.assign({}, merged.properties, piece.properties),
        required: (merged.required ?? []).concat(piece.required ?? []),
      });
    }
    out = merged;
  }
  return out;
}

/**
 * @param {JsonSchema} schema
 * @returns {string | undefined}
 */
function typeOf(schema) {
  const { type } = schema;
  if (Array.isArray(type)) return type.find((t) => t !== "null");
  if (type) return type;
  if (schema.properties) return "object";
  if (schema.items) return "array";
  return undefined;
}

/**
 * @param {JsonSchema[]} variants
 * @returns {import("./create-form.js").FieldOption[] | undefined}
 */
function constOptions(variants) {
  if (!variants?.length || !variants.every((v) => "const" in v)) return;
  return variants.map((v) => ({
    value: v.const,
    label: v.title ?? String(v.const),
  }));
}

/**
 * @param {JsonSchema} schema
 * @param {JsonSchema} root
 * @returns {import("./create-form.js").FieldOption[] | undefined}
 */
function optionsOf(schema, root) {
  if (schema.enum) {
    const names = schema["x-enumNames"];
    return schema.enum.map(
      (/** @type {any} */ value, /** @type {number} */ i) => ({
        value,
        label: names?.[i] ?? String(value),
      }),
    );
  }
  const variants = schema.oneOf ?? schema.anyOf;
  return constOptions(
    variants?.map((/** @type {JsonSchema} */ v) => flatten(v, root)),
  );
}

/**
 * The `ui:` keys of a node, as field config.
 * @param {Record<string, any>} ui
 * @returns {Partial<FieldConfig> & { widget?: string }}
 */
function readUi(ui) {
  /** @type {Partial<FieldConfig> & { widget?: string }} */
  const out = {};
  const widget = ui["ui:widget"];
  if (widget) out.widget = WIDGET_ALIASES[widget] ?? widget;
  if (ui["ui:title"] != null) out.label = ui["ui:title"];
  if (ui["ui:description"] != null) out.helperText = ui["ui:description"];
  if (ui["ui:help"] != null) out.helperText = ui["ui:help"];
  if (ui["ui:placeholder"] != null) out.placeholder = ui["ui:placeholder"];
  if (ui["ui:disabled"] != null) out.disabled = !!ui["ui:disabled"];
  if (ui["ui:readonly"] != null) out.readonly = !!ui["ui:readonly"];
  if (ui["ui:columns"] != null) out.columns = ui["ui:columns"];
  if (ui["ui:span"] != null) out.span = ui["ui:span"];
  if (ui["ui:options"] != null) out.props = ui["ui:options"];
  if (ui["ui:addLabel"] != null) out.addLabel = ui["ui:addLabel"];
  if (ui["ui:itemLabel"] != null) out.itemLabel = ui["ui:itemLabel"];
  return out;
}

/**
 * @param {JsonSchema} schema
 * @param {JsonSchema} root
 * @param {string} name
 * @param {boolean} required
 * @param {Record<string, any>} ui
 * @returns {FieldConfig | undefined}
 */
function convert(schema, root, name, required, ui) {
  const s = flatten(schema, root);
  const hints = readUi(ui);
  if (hints.widget === "hidden") return undefined;

  const type = typeOf(s);
  /** @type {FieldConfig} */
  const config = { name };
  if (s.title != null) config.label = s.title;
  if (s.description != null) config.helperText = s.description;
  if (s.default !== undefined) config.default = s.default;
  if (s.readOnly || "const" in s) config.readonly = true;
  if ("const" in s) {
    config.const = s.const;
    config.default = s.const;
  }
  if (required && type !== "boolean") config.required = true;
  if (required && type === "boolean" && s.const === true)
    config.required = true;

  if (
    type === "object" ||
    s.oneOf?.every?.(
      (/** @type {JsonSchema} */ v) => flatten(v, root).properties,
    )
  ) {
    config.type = "object";
    config.fields = objectFields(s, root, ui);
  } else if (type === "array") {
    const items = flatten(s.items ?? {}, root);
    const itemUi = ui.items ?? {};
    const options = optionsOf(items, root);
    if (options && s.uniqueItems !== false) {
      config.type =
        hints.widget ?? (options.length <= 6 ? "checkboxes" : "multiselect");
      config.options = options;
    } else if (typeOf(items) === "object") {
      config.type = "array";
      config.items = rowConfig(items, root, itemUi);
    } else if (items.format === "binary" || items.contentMediaType) {
      config.type = "file";
    } else if (typeOf(items) === "string" && hints.widget !== "array") {
      config.type = "tags";
    } else {
      config.type = "array";
      config.items = rowConfig(items, root, itemUi);
    }
    if (s.minItems != null) config.minItems = s.minItems;
    if (s.maxItems != null) config.maxItems = s.maxItems;
    if (s.uniqueItems) config.uniqueItems = true;
    if (config.type === "tags" && s.maxItems != null) {
      config.props = { max: s.maxItems };
    }
  } else {
    const options = optionsOf(s, root);
    if (options) {
      config.type = "select";
      config.options = options;
    } else if (type === "boolean") {
      config.type = "checkbox";
    } else if (type === "number" || type === "integer") {
      config.type = type;
    } else if (s.format === "binary") {
      config.type = "file";
    } else {
      config.type = "text";
      if (s.format === "email") config.type = "email";
      else if (s.format === "uri") config.type = "url";
      else if (s.format === "date") config.type = "date";
      else if (s.format === "time") config.type = "time";
      else if (s.format === "password" || s.writeOnly) config.type = "password";
      else if (
        s.contentMediaType === "text/plain" ||
        (s.maxLength ?? 0) > 200
      ) {
        config.type = "textarea";
      }
    }
    if (s.minLength != null) config.minLength = s.minLength;
    if (s.maxLength != null) config.maxLength = s.maxLength;
    if (s.pattern != null) config.pattern = s.pattern;
    if (s.format && ["email", "uri", "date", "time"].includes(s.format)) {
      config.format = s.format;
    }
    if (s.minimum != null) config.min = s.minimum;
    if (s.maximum != null) config.max = s.maximum;
    if (s.exclusiveMinimum != null) config.exclusiveMin = s.exclusiveMinimum;
    if (s.exclusiveMaximum != null) config.exclusiveMax = s.exclusiveMaximum;
    if (s.multipleOf != null) {
      config.multipleOf = s.multipleOf;
      config.step = s.multipleOf;
    }
  }

  const { widget, ...rest } = hints;
  if (widget && widget !== "hidden") config.type = widget;
  if (config.type === "slider" && config.min != null && config.max != null) {
    config.step ??= type === "integer" ? 1 : undefined;
  }
  return { ...config, ...rest };
}

/**
 * The config of an array's row: a field with no name of its own.
 * @param {JsonSchema} items
 * @param {JsonSchema} root
 * @param {Record<string, any>} ui
 * @returns {FieldConfig}
 */
function rowConfig(items, root, ui) {
  const { name: _name, ...row } = convert(items, root, "*", false, ui) ?? {};
  return row;
}

/**
 * The fields of an object schema, in `ui:order`, with a discriminated
 * `oneOf` folded in as a select and conditional fields.
 * @param {JsonSchema} s
 * @param {JsonSchema} root
 * @param {Record<string, any>} ui
 * @returns {FieldConfig[]}
 */
function objectFields(s, root, ui) {
  const required = new Set(s.required ?? []);
  /** @type {FieldConfig[]} */
  const fields = [];
  for (const [key, child] of Object.entries(s.properties ?? {})) {
    const field = convert(child, root, key, required.has(key), ui[key] ?? {});
    if (field) fields.push(field);
  }

  /** @type {JsonSchema[]} */
  const variants = (s.oneOf ?? []).map((/** @type {JsonSchema} */ v) =>
    flatten(v, root),
  );
  if (variants.length && variants.every((v) => v.properties)) {
    const discriminator = Object.keys(variants[0].properties).find((key) =>
      variants.every((v) => v.properties[key] && "const" in v.properties[key]),
    );
    if (!discriminator) {
      throw new Error(
        'SchemaForm: a "oneOf" of objects needs a property every variant gives a "const"',
      );
    }
    fields.push({
      name: discriminator,
      type: ui[discriminator]?.["ui:widget"] ?? "select",
      label: s.properties?.[discriminator]?.title ?? discriminator,
      required: true,
      options: variants.map((v) => ({
        value: v.properties[discriminator].const,
        label: v.title ?? String(v.properties[discriminator].const),
      })),
      ...readUi(ui[discriminator] ?? {}),
    });
    /** @type {Map<string, { field: FieldConfig, kinds: unknown[] }>} */
    const shared = new Map();
    for (const variant of variants) {
      const kind = variant.properties[discriminator].const;
      const needed = new Set(variant.required ?? []);
      for (const [key, child] of Object.entries(variant.properties)) {
        if (key === discriminator) continue;
        const known = shared.get(key);
        if (known) {
          known.kinds.push(kind);
          continue;
        }
        const field = convert(child, root, key, needed.has(key), ui[key] ?? {});
        if (field) shared.set(key, { field, kinds: [kind] });
      }
    }
    for (const { field, kinds } of shared.values()) {
      fields.push({
        ...field,
        visibleIf: { field: discriminator, in: kinds },
      });
    }
  }

  const order = ui["ui:order"];
  if (Array.isArray(order)) {
    const rank = (/** @type {string} */ name) => {
      const at = order.indexOf(name);
      return at < 0
        ? order.indexOf("*") < 0
          ? order.length
          : order.indexOf("*")
        : at;
    };
    fields.sort((a, b) => rank(a.name ?? "") - rank(b.name ?? ""));
  }
  return fields;
}

/**
 * Turn a JSON Schema (a subset of draft 2020-12) into field configs, with
 * a UI schema shaped like the schema and keyed by `ui:` options, as
 * react-jsonschema-form does.
 *
 * @param {JsonSchema} schema
 * @param {Record<string, any>} [uiSchema]
 * @returns {FieldConfig[]}
 */
export function schemaToFields(schema, uiSchema = {}) {
  const root = flatten(schema, schema);
  if (typeOf(root) !== "object") {
    throw new Error('SchemaForm: the root schema must have "type": "object"');
  }
  return objectFields(root, schema, uiSchema);
}
