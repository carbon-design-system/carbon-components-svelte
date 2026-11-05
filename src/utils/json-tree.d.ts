/**
 * The data model behind `JsonViewer`: any JavaScript value as a lazily
 * materialized tree stored as parallel columns. A node is an integer id.
 */

export type NodeId = number;

export const NULL: 0;
export const UNDEFINED: 1;
export const BOOLEAN: 2;
export const NUMBER: 3;
export const BIGINT: 4;
export const STRING: 5;
export const SYMBOL: 6;
export const FUNCTION: 7;
export const DATE: 8;
export const REGEXP: 9;
export const OPAQUE: 10;
export const CIRCULAR: 11;
export const CHUNK: 12;
export const THROWS: 13;
export const LONG_STRING: 14;
export const OBJECT: 15;
export const ARRAY: 16;
export const MAP: 17;
export const SET: 18;
export const ERROR: 19;

export const KIND_NAMES: ReadonlyArray<string>;

export const FLAG_EXPANDED: 1;
export const FLAG_AUTO: 2;
export const FLAG_MATCH_KEY: 4;
export const FLAG_MATCH_VALUE: 8;

export const DEFAULT_MAX_STRING_LENGTH: 100;

export class JsonTree {
  constructor(root: unknown, options?: { maxStringLength?: number });
  maxStringLength: number;
  kinds: number[];
  keys: unknown[];
  values: unknown[];
  parents: number[];
  depths: number[];
  /** First child, or for a circular node the ancestor it points to. */
  firsts: number[];
  sizes: number[];
  flags: Uint8Array;
  /** How many nodes exist so far. */
  length: number;
  add(
    parent: NodeId,
    key: unknown,
    value: unknown,
    depth: number,
    kind: number,
  ): NodeId;
  canExpand(id: NodeId): boolean;
  childCount(id: NodeId): number;
  materialize(id: NodeId): NodeId;
  ancestorWithValue(from: NodeId, value: unknown): NodeId;
  isExpanded(id: NodeId): boolean;
  setExpanded(id: NodeId, expanded: boolean, auto?: boolean): void;
  childAt(id: NodeId, index: number): NodeId;
  indexOf(id: NodeId): number;
  siblingCount(id: NodeId): number;
  chunkText(id: NodeId): string;
  ancestors(id: NodeId): NodeId[];
}
