export interface XlsxOptions {
  /** A sheet name or index. Defaults to the first visible sheet. */
  sheet?: string | number;
  /** How a date-formatted number is returned. Defaults to `"iso"`. */
  dates?: "iso" | "serial";
  maxRows?: number;
  /** Largest sheet XML to inflate. Defaults to 256 MB. */
  maxBytes?: number;
}

export interface XlsxResult {
  rows: string[][];
  sheetName: string;
  sheets: string[];
}

/**
 * A minimal .xlsx reader, wrapped in one function so it has no free
 * variables and can be shipped into a Blob worker.
 */
export function xlsxCore(): {
  parseXlsx(
    input: ArrayBuffer | Uint8Array,
    options?: XlsxOptions,
  ): Promise<XlsxResult>;
};
