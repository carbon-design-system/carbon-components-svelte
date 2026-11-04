import type { FieldConfig } from "./create-form.js";

/**
 * Turn a JSON Schema (a subset of draft 2020-12) into field configs.
 *
 * Supported: `type` (`string`, `number`, `integer`, `boolean`, `object`,
 * `array`, and a `["x", "null"]` pair), `title`, `description`, `default`,
 * `const`, `enum`, `oneOf` or `anyOf` of `const`s (labelled options),
 * `readOnly`, `writeOnly`, `required`, `properties`, `items`,
 * `minLength`, `maxLength`, `pattern`, `format` (`email`, `uri`, `date`,
 * `time`, `password`, `binary`), `minimum`, `maximum`, `exclusiveMinimum`,
 * `exclusiveMaximum`, `multipleOf`, `minItems`, `maxItems`, `uniqueItems`,
 * `allOf` (merged), a `$ref` inside the same schema, and a `oneOf` of
 * objects that share a `const` property (a discriminated union).
 *
 * Not supported: a `$ref` to another document, `if`/`then`/`else`,
 * `dependentRequired`, `dependentSchemas`, `not`, `patternProperties`,
 * `additionalProperties`, `prefixItems`, `contains`, `unevaluated*` and
 * `format: "date-time"`.
 *
 * The UI schema is shaped like the schema, with RJSF's `ui:` keys:
 * `ui:widget`, `ui:title`, `ui:description`, `ui:help`, `ui:placeholder`,
 * `ui:disabled`, `ui:readonly`, `ui:options` (props for the widget),
 * `ui:order`, plus `ui:columns`, `ui:span`, `ui:addLabel` and `ui:itemLabel`.
 * An array's row is configured under `items`.
 */
export function schemaToFields(
  schema: Record<string, unknown>,
  uiSchema?: Record<string, unknown>,
): FieldConfig[];
