// biome-ignore-all lint/suspicious/noExplicitAny: a row's values are whatever the schema converts them to
// biome-ignore-all lint/suspicious/noConfusingVoidType: `void` lets a callback return nothing
export interface ParseFileOptions {
  /** Defaults to the file's signature. */
  format?: "csv" | "xlsx";
  /** CSV only. Defaults to a sniffed one. */
  delimiter?: string;
  /** CSV only. A `TextDecoder` label. Defaults to UTF-8, then Windows-1252. */
  encoding?: string;
  /** XLSX only. A sheet name or index. */
  sheet?: string | number;
  /** Stop after this many records, including the header. */
  maxRows?: number;
  /**
   * `"auto"` (default) parses in an inline Blob worker and falls back to the
   * main thread; `false` stays on the main thread; a function returns your
   * own worker (for a strict CSP).
   */
  worker?: false | "auto" | (() => Worker);
  onProgress?: (progress: { loaded: number; total: number }) => void;
  signal?: AbortSignal;
}

export interface ParseFileResult {
  rows: string[][];
  format: "csv" | "xlsx";
  delimiter?: string;
  encoding?: string;
  sheetName?: string;
  sheets?: string[];
  issues: Array<{ type: "unclosed-quote" | "stray-quote"; row: number }>;
  truncated: boolean;
  thread: "worker" | "main";
}

/** The message loop of the parse worker. */
export function runParseWorker(scope: any, csv: any, xlsx: any): void;

/**
 * Parse a CSV or XLSX file into rows of strings. Parsing runs in a Web Worker
 * when there is one and moves to the main thread, in time-sliced chunks, when
 * there isn't (SSR, a strict CSP, no `Worker`). Rejects with an `AbortError`
 * when `signal` aborts.
 */
export function parseFile(
  file: Blob,
  options?: ParseFileOptions,
): Promise<ParseFileResult>;
