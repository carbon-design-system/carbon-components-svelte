import type { ComponentType, SvelteComponent } from "svelte";
import type { FieldNode } from "./field-config.js";

// biome-ignore lint/suspicious/noExplicitAny: A form's values hold whatever its fields do, and a consumer reads them without narrowing each one.
export type FormValues = Record<string, any>;

/** A component that renders a field. See `defaultWidgets`. */
// biome-ignore lint/suspicious/noExplicitAny: A widget's props are its own, and the form passes the same set to each.
export type WidgetComponent = ComponentType<SvelteComponent<any>>;

/** An option of a select-like field. A number value round-trips as a number. */
export interface FieldOption {
  value: string | number;
  /** Defaults to the value as text. */
  label?: string;
  disabled?: boolean;
  helperText?: string;
}

/** What a validator is called with, as its third argument. */
export interface ValidateContext {
  /** Aborted when a newer check of the same field starts, or the form resets. */
  signal: AbortSignal;
  /** The field's path, like `addresses.0.city`. */
  path: string;
  /** The object the field sits in: its sibling values. */
  parent: unknown;
}

/** What `visibleIf`, `disabled`, `readonly` and `required` functions get. */
export interface ConditionContext {
  path: string;
  /** The object the field sits in: its sibling values. */
  parent: unknown;
}

/**
 * Show a field only while the condition holds. A function gets all the
 * values; the object form compares one field, named relative to the
 * field's parent (`"type"`) or from the root (`"/billing.country"`). A list
 * of objects must all hold.
 */
export type Condition<Values = FormValues> =
  | ((values: Values, context: ConditionContext) => boolean)
  | ConditionRule
  | ConditionRule[];

export interface ConditionRule {
  field: string;
  equals?: unknown;
  in?: unknown[];
  /** `true` when the field has a value, `false` when it is empty. */
  notEmpty?: boolean;
}

export type FieldType =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "password"
  | "textarea"
  | "search"
  | "number"
  | "integer"
  | "select"
  | "dropdown"
  | "combobox"
  | "multiselect"
  | "checkbox"
  | "checkboxes"
  | "radio"
  | "toggle"
  | "togglebuttons"
  | "date"
  | "daterange"
  | "time"
  | "slider"
  | "rangeslider"
  | "file"
  | "tags"
  | "pin"
  | "rating"
  | "object"
  | "array"
  | (string & {});

export interface FieldConfig {
  /** The key in the values. Not a path: it can't hold a dot. */
  name?: string;
  /** Picks the widget. Default `"text"`; `"object"` when `fields` is set, `"array"` when `items` is set. */
  type?: FieldType;
  /** The label, or the legend of a group. Defaults to `name`. */
  label?: string;
  helperText?: string;
  placeholder?: string;
  /** For a select-like field. */
  options?: Array<FieldOption | string | number>;
  /** The starting value when `initialValues` has none. */
  default?: unknown;
  /** Must have a value. On a checkbox or toggle, it must be on. A function decides per render. */
  required?:
    boolean | ((values: FormValues, context: ConditionContext) => boolean);
  disabled?:
    boolean | ((values: FormValues, context: ConditionContext) => boolean);
  readonly?:
    boolean | ((values: FormValues, context: ConditionContext) => boolean);
  visibleIf?: Condition;
  /**
   * Return an error message, or nothing. May return a promise; `signal`
   * aborts when a newer check starts. Runs after the built-in rules pass.
   * Gets all the values (hidden fields included), for cross-field rules.
   */
  validate?: (
    value: unknown,
    values: FormValues,
    context: ValidateContext,
  ) => string | undefined | Promise<string | undefined>;
  /** Return a warning message, or nothing. Shown when there is no error. */
  warn?: (value: unknown, values: FormValues) => string | undefined;
  /**
   * Fields whose change re-runs this field's rules, once it has been
   * touched or has an error. Named relative to the parent object, or from
   * the root with a leading `/`.
   */
  dependsOn?: string[];
  /** Overrides the form's `validateOn` for this field. */
  validateOn?: "change" | "blur" | "submit";
  /** Props for the widget, spread last. */
  props?: Record<string, unknown>;
  /** Columns a group lays its fields in: 1 to 4. */
  columns?: number;
  /** Columns this field spans in its group's grid. */
  span?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "uri" | "url" | "date" | "time" | (string & {});
  min?: number;
  max?: number;
  exclusiveMin?: number;
  exclusiveMax?: number;
  multipleOf?: number;
  step?: number;
  const?: unknown;
  /** The format of a `date` field. Default `"Y-m-d"`. */
  dateFormat?: string;
  /** The fields of a group. */
  fields?: FieldConfig[];
  /** The row of an array. */
  items?: FieldConfig;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  /** The text of the add button of an array. */
  addLabel?: string;
  /** The legend of an array row. Gets the 1-based position. */
  itemLabel?: string | ((position: number) => string);
}

export interface FieldState {
  /** The value of a field; `undefined` for a group or an array. */
  // biome-ignore lint/suspicious/noExplicitAny: A field's value has the type of its widget, and a consumer binds it to a control of that type.
  value: any;
  error: string | undefined;
  warn: string | undefined;
  touched: boolean;
  /** The value differs from its starting value. */
  dirty: boolean;
  /** An async validator is running. */
  validating: boolean;
  visible: boolean;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
}

export interface FormError {
  path: string;
  /** The id of the field's control, for `href="#id"`. */
  id: string;
  message: string;
  label: string;
}

/**
 * Message templates by rule. A string can hold `{label}`, `{min}`, `{max}`,
 * `{step}` and `{value}`; a function gets those as an object.
 */
export type FormMessages = Partial<
  Record<
    | "required"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "uri"
    | "date"
    | "time"
    | "integer"
    | "min"
    | "max"
    | "exclusiveMin"
    | "exclusiveMax"
    | "multipleOf"
    | "const"
    | "minItems"
    | "maxItems"
    | "uniqueItems",
    string | ((params: Record<string, unknown>) => string)
  >
>;

export interface CreateFormOptions<Values = FormValues> {
  fields?: FieldConfig[];
  /**
   * A JSON Schema (a subset of draft 2020-12) to take the fields from, in
   * place of `fields`. See `schemaToFields`.
   */
  schema?: Record<string, unknown>;
  /** The `ui:` options for `schema`, shaped like it. */
  uiSchema?: Record<string, unknown>;
  /** Starting values. Missing keys take the field's default. */
  initialValues?: Partial<Values>;
  /**
   * When a field is checked: `"blur"` (default), `"change"` or `"submit"`.
   * Once a field shows an error, or a submit has failed, it re-checks on every change.
   */
  validateOn?: "change" | "blur" | "submit";
  messages?: FormMessages;
  /** A rule across fields. Returns errors by path. Runs on submit. */
  validate?: (values: Values) => Record<string, string> | undefined;
  /**
   * What a hidden field does to the values: `"omit"` (default) leaves it
   * out, `"keep"` keeps it. Its value stays in the form either way, so it
   * comes back when the field shows again.
   */
  hidden?: "omit" | "keep";
  /** Prefix of the field ids. */
  id?: string;
}

export interface Readable<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface SchemaFormStore<Values = FormValues> {
  /** The prefix of the field ids. */
  id: string;
  /** The values the form would submit: hidden fields left out. */
  values: Readable<Values>;
  /** All the values, hidden fields included. */
  rawValues: Readable<Values>;
  /** Error messages by path. */
  errors: Readable<Record<string, string>>;
  /** The errors of the visible fields in document order, for a summary. */
  errorList: Readable<FormError[]>;
  touched: Readable<Record<string, true>>;
  /** Any value differs from its starting value. */
  dirty: Readable<boolean>;
  isSubmitting: Readable<boolean>;
  submitCount: Readable<number>;
  /** An async validator is running. */
  isValidating: Readable<boolean>;
  /** A store of one field. Only that field's changes notify it. */
  field(path: string): Readable<FieldState>;
  /** A store of the stable row ids of an array, for a keyed `{#each}`. */
  rows(path: string): Readable<string[]>;
  node(path: string): FieldNode | undefined;
  root: FieldNode;
  setValue(path: string, value: unknown): Promise<void> | undefined;
  /** Mark a field touched and check it when `validateOn` says so. */
  blur(path: string): void;
  /** Check every visible field. Resolves to `true` when none has an error. */
  validate(): Promise<boolean>;
  /**
   * Check the form, and call `handler` with the values when it is valid.
   * A handler that returns `{ errors }` (by path) puts those on the fields.
   * Resolves to whether the form was valid and accepted.
   */
  submit(
    handler?: (
      values: Values,
    ) => unknown | { errors: Record<string, string> } | Promise<unknown>,
  ): Promise<boolean>;
  /** Back to the starting values, or to new ones. Clears errors, touched and the submit count. */
  reset(values?: Partial<Values>): void;
  /** Add a row. Returns its index, or -1 at `maxItems`. */
  add(arrayPath: string, item?: unknown, index?: number): number;
  remove(arrayPath: string, index: number): void;
  move(arrayPath: string, from: number, to: number): void;
  /** Put errors on fields, like the ones a server returns. */
  setErrors(errors: Record<string, string>): void;
  getValues(): Values;
  getRawValues(): Values;
  getErrors(): Record<string, string>;
  destroy(): void;
}

/**
 * Create a headless form: values, touched, dirty, errors and submit state
 * for a field config, with a store for each field so typing in one does not
 * wake the others.
 */
export function createForm<Values = FormValues>(
  options?: CreateFormOptions<Values>,
): SchemaFormStore<Values>;
