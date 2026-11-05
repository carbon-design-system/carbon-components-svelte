/**
 * Walks over a `JsonTree`: the flat list of rows a viewer shows, and the
 * resumable walks that expand a tree or search it.
 */

import type { JsonTree } from "./json-tree.js";

export const DEFAULT_NODE_LIMIT: number;
export const DEFAULT_MAX_MATCHES: number;

/** The expanded descendants of a node, in document order. */
export function descendantRows(
  tree: JsonTree,
  id: number,
  out?: number[],
): number[];

/** Every visible row: the root, then its expanded descendants. */
export function buildRows(tree: JsonTree): number[];

/** Show or hide the rows below the node at `index`. Returns the new rows. */
export function toggleRows(
  tree: JsonTree,
  rows: ReadonlyArray<number>,
  index: number,
  expanded: boolean,
): number[];

export interface WalkOptions {
  /** The node to start at. Defaults to the root. */
  start?: number;
  /** Expand every container the walk reaches. */
  expand?: boolean;
  /** With `expand`, stop expanding at this depth. */
  maxDepth?: number;
  /** Collect the nodes whose key or value contains it. */
  query?: string;
  /** Stop creating nodes at this many. */
  limit?: number;
  /** Stop searching at this many matches. */
  maxMatches?: number;
}

export interface Walk {
  done: boolean;
  limited: boolean;
  truncated: boolean;
  matches: number[];
  visited: number;
  /** Work for `budgetMs`. Returns whether the walk is done. */
  step(budgetMs: number): boolean;
}

export function createWalk(tree: JsonTree, options?: WalkOptions): Walk;

export function clearSearch(
  tree: JsonTree,
  matches: ReadonlyArray<number>,
  autoExpanded: ReadonlyArray<number>,
): void;

export function revealAncestors(
  tree: JsonTree,
  ids: Iterable<number>,
): number[];
