export interface CsvIssue {
  type: "unclosed-quote" | "stray-quote";
  /** Zero-based index of the record. */
  row: number;
}

export interface CsvParser {
  /** Feed text; returns the records completed by it. */
  write(chunk: string): string[][];
  /** Flush the last record. */
  end(): string[][];
  issues(): CsvIssue[];
}

export interface StreamHooks {
  onRows: (rows: string[][]) => void;
  onProgress?: (loaded: number, total: number) => void;
  /** The encoding guess was wrong; discard rows so far. */
  onReset?: () => void;
  canceled?: () => boolean;
}

export interface StreamOptions {
  delimiter?: string;
  encoding?: string;
  maxRows?: number;
  batchSize?: number;
}

export interface StreamResult {
  delimiter: string;
  encoding: string;
  issues: CsvIssue[];
  rowCount: number;
  truncated: boolean;
}

/**
 * The CSV engine, wrapped in one function so it has no free variables and
 * can be shipped into a Blob worker through `Function.prototype.toString`.
 */
export function csvCore(): {
  createParser(
    delimiter: string,
    options?: { skipEmptyLines?: boolean },
  ): CsvParser;
  sniffDelimiter(sample: string, candidates?: string[]): string;
  detectEncoding(bytes: Uint8Array): { encoding: string; bom: number };
  streamCsv(
    source: Blob,
    options: StreamOptions,
    hooks: StreamHooks,
  ): Promise<StreamResult>;
};
