/**
 * How `JsonViewer` writes a node: its key, its value or summary, the text a
 * search reads, and the text a copy writes.
 */

import type { JsonTree } from "./json-tree.js";

/** Group digits by thousands, the same on the server and in the browser. */
export function formatCount(count: number): string;

export function stringWindow(
  text: string,
  max: number,
  query: string,
): { body: string; before: boolean; after: boolean };

export interface ValueText {
  text: string;
  hint?: string;
}

export function valueText(
  tree: JsonTree,
  id: number,
  query?: string,
): ValueText;

export interface KeyText {
  text: string;
  role: "root" | "key" | "index" | "none";
}

export function keyText(
  tree: JsonTree,
  id: number,
  rootLabel?: string,
): KeyText;

export function searchValueText(tree: JsonTree, id: number): string;

export function searchKeyText(tree: JsonTree, id: number): string;

export interface TextPart {
  text: string;
  match: boolean;
}

export function splitMatches(text: string, query: string): TextPart[];

/** The text "Copy value" writes. */
export function serializeValue(
  tree: JsonTree,
  id: number,
  space?: number,
): string;
