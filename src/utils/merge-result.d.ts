import type { MergeChunk, MergeModel } from "./merge3.js";

export type AcceptChoice =
  "ours" | "theirs" | "both" | "both-reversed" | "base";

/**
 * `"unchanged"` and `"merged"` (one side changed it, or both the same way)
 * are not decisions. A conflict is `"unresolved"` while it holds markers,
 * then the choice that made its text, or `"edited"` when the text matches
 * none.
 */
export type ChunkStatus =
  "unchanged" | "merged" | "unresolved" | AcceptChoice | "edited";

export type ResultChunk = MergeChunk & {
  /** What the result holds for this chunk. */
  text: string;
  /** Line endings in `text`. */
  newlines: number;
};

export type MergeResult = {
  chunks: ResultChunk[];
  labels: MergeModel["labels"];
  eol: "\n" | "\r\n";
  finalNewline: boolean;
  hasBase: boolean;
  /** Bumped on every change to a chunk's text. */
  revision: number;
};

/** What a change did: undone by swapping the two sides. */
export type HistoryEntry =
  | { kind: "edit"; chunk: number; at: number; remove: string; insert: string }
  | { kind: "span"; chunk: number; before: string[]; after: string[] };

/** Replace `[start, end)` of the result text with `text`. */
export type TextPatch = { start: number; end: number; text: string };

export function createMergeResult(model: MergeModel): MergeResult;
export function resultText(result: MergeResult): string;
export function chunkOffsets(result: MergeResult): number[];
export function chunkLineStarts(result: MergeResult): number[];
export function chunkAt(offsets: number[], position: number): number;
export function choiceText(
  result: MergeResult,
  index: number,
  choice: AcceptChoice,
): string | null;
export function chunkStatus(result: MergeResult, index: number): ChunkStatus;
export function conflictIndexes(result: MergeResult): number[];
export function unresolvedCount(result: MergeResult): number;
export function applyEntry(result: MergeResult, entry: HistoryEntry): TextPatch;
export function invertEntry(entry: HistoryEntry): HistoryEntry;
export function editText(
  result: MergeResult,
  start: number,
  end: number,
  insert: string,
): HistoryEntry;
export function acceptChunk(
  result: MergeResult,
  index: number,
  choice: AcceptChoice,
): null | HistoryEntry;
export function diffRange(
  before: string,
  after: string,
  limit?: number,
): { start: number; end: number; insert: string };
export function coalesceEntries(
  previous: HistoryEntry,
  next: HistoryEntry,
): null | HistoryEntry;
export function neighborConflict(
  result: MergeResult,
  from: number,
  direction: 1 | -1,
  unresolvedOnly?: boolean,
): number;
