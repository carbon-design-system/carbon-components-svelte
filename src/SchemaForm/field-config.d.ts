import type { FieldConfig, FieldOption } from "./create-form.js";

export interface RuleContext {
  node: FieldNode;
  message: (key: string, params?: Record<string, unknown>) => string;
  /** Whether `required` holds right now, for a dynamic `required`. */
  required: boolean;
}

export type Rule = (value: unknown, context: RuleContext) => string | undefined;

/** A field config after it is compiled into the tree the form runs on. */
export interface FieldNode {
  kind: "field" | "group" | "array";
  /** The key inside the parent object: `""` for the root, `"*"` for an array row. */
  name: string;
  type: string;
  label: string;
  /** The path with array indices replaced by `*`. */
  template: string;
  config: FieldConfig;
  options: Array<FieldOption & { label: string }> | undefined;
  children: FieldNode[];
  item: FieldNode | undefined;
  rules: Rule[];
}

export function compileFields(fields: FieldConfig[]): FieldNode;
export function indexNodes(root: FieldNode): Map<string, FieldNode>;
export function defaultFor(node: FieldNode): unknown;
export function isEmpty(value: unknown, type: string): boolean;
export function messageFor(
  messages: Record<string, unknown> | undefined,
  node: FieldNode,
): RuleContext["message"];
export const DEFAULT_MESSAGES: Record<string, string>;
