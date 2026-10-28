import type {
  QueryCondition,
  QueryField,
  QueryGroup,
} from "./QueryBuilder.svelte";

export type QueryNode = QueryCondition | QueryGroup;

export interface Found {
  node: QueryNode;
  parent: QueryGroup | null;
  index: number;
  depth: number;
}

/** Whether every node of the tree has an `id`. */
export function hasIds(group: QueryGroup): boolean;

/**
 * Give every node an id, keeping the ones it has. A branch that already
 * carries ids is returned as it is. New ids come from `makeId` and never
 * repeat an id already in the tree.
 */
export function assignIds(group: QueryGroup, makeId: () => string): QueryGroup;

export function findNode(root: QueryGroup, id: string): Found | null;

/** Merge `patch` into the node `id`. */
export function updateNode(
  root: QueryGroup,
  id: string,
  patch: Record<string, unknown>,
): QueryGroup;

/** Append `node` to the group `groupId`. */
export function appendNode(
  root: QueryGroup,
  groupId: string,
  node: QueryNode,
): QueryGroup;

/** Drop the node `id`. The root cannot be removed. */
export function removeNode(root: QueryGroup, id: string): QueryGroup;

/**
 * Move the node `id` by `delta` places within its group, stopping at the
 * ends.
 */
export function moveNode(
  root: QueryGroup,
  id: string,
  delta: number,
): QueryGroup;

export interface QueryBuilderSettings {
  translate: import("./query.js").QueryTranslate;
  fieldsById: Map<string, QueryField>;
  fields: ReadonlyArray<QueryField>;
  size: "sm" | "md";
  id: string;
  disabled: boolean;
  readonly: boolean;
  showErrors: boolean;
  maxDepth: number;
  ariaLabel: string | undefined;
  labelId: string | undefined;
  describedBy: string | undefined;
}

/** What `QueryBuilder` shares with its rows and groups. */
export interface QueryBuilderContext {
  settings: import("svelte/store").Readable<QueryBuilderSettings>;
  errors: import("svelte/store").Readable<
    Record<string, import("./query.js").QueryErrorCode>
  >;
  touched: import("svelte/store").Readable<Record<string, true>>;
  update(id: string, patch: Record<string, unknown>): void;
  touch(id: string): void;
  add(groupId: string, kind: "condition" | "group"): void;
  remove(id: string): void;
  move(id: string, delta: number): void;
}
