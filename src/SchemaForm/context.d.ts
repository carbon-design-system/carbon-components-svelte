import type { SchemaFormStore, WidgetComponent } from "./create-form.js";

/** Set by `SchemaForm`; read by `SchemaNode`. */
export const SCHEMA_FORM_CONTEXT_KEY: "carbon:SchemaForm";

/** The text of the form's own controls and announcements. */
export interface SchemaFormLabels {
  submit: string;
  reset: string;
  /** Appended to the label of an optional field when `optionalMark` is set. */
  optional: string;
  /** The text of the button that adds an array row. */
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  /** The label of an array row, from its 1-based position. */
  row: (position: number) => string;
  /** The heading of the error summary. */
  summaryTitle: (count: number) => string;
  added: (row: string, count: number) => string;
  removed: (row: string, count: number) => string;
  moved: (row: string, position: number, count: number) => string;
}

export interface SchemaFormContext {
  form: SchemaFormStore;
  widgets: Record<string, WidgetComponent>;
  labels: SchemaFormLabels;
  optionalMark: boolean;
  announce: (message: string) => void;
}

export const DEFAULT_LABELS: SchemaFormLabels;
