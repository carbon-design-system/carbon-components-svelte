/**
 * Paths into a `JsonTree`: `$.a.b[3]` (JSONPath) and `data.a.b[3]` (JavaScript).
 */

import type { JsonTree } from "./json-tree.js";

export type PathSegment =
  | { type: "key"; key: string }
  | { type: "index"; index: number }
  | { type: "get"; key: unknown }
  | { type: "entry"; index: number }
  | { type: "item"; index: number };

export type PathFormat = "jsonpath" | "js";

/** The segments from the root to a node. */
export function pathSegments(tree: JsonTree, id: number): PathSegment[];

export function formatPath(
  segments: ReadonlyArray<PathSegment>,
  format?: PathFormat,
  rootName?: string,
): string;

/** The node at a path of property names and indexes, or -1. */
export function findByKeys(
  tree: JsonTree,
  keys: ReadonlyArray<string | number>,
): number;
