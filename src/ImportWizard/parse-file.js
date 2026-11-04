// @ts-check
import { csvCore } from "./csv-core.js";
import { xlsxCore } from "./xlsx-core.js";

/**
 * The message loop of the parse worker. Self-contained for the same reason as
 * `csvCore`: `parse-file.js` ships its source into an inline Blob worker, and
 * `csv.worker.js` runs the same function as a module worker.
 *
 * @param {any} scope - The worker global.
 * @param {ReturnType<typeof csvCore>} csv
 * @param {ReturnType<typeof xlsxCore>} xlsx
 */
export function runParseWorker(scope, csv, xlsx) {
  /** @param {unknown} error */
  const fail = (error) =>
    scope.postMessage({
      t: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  scope.onmessage = async (
    /** @type {{ data: { file: Blob, kind: "csv" | "xlsx", options: any } }} */ event,
  ) => {
    const { file, kind, options } = event.data;
    try {
      if (kind === "xlsx") {
        const result = await xlsx.parseXlsx(await file.arrayBuffer(), options);
        scope.postMessage({ t: "xlsx", ...result });
        return;
      }
      const meta = await csv.streamCsv(file, options, {
        onRows: (rows) => scope.postMessage({ t: "rows", rows }),
        onProgress: (loaded, total) =>
          scope.postMessage({ t: "progress", loaded, total }),
        onReset: () => scope.postMessage({ t: "reset" }),
      });
      scope.postMessage({ t: "done", meta });
    } catch (error) {
      fail(error);
    }
  };
}

/**
 * @typedef {object} ParseFileOptions
 * @property {"csv" | "xlsx"} [format] - Defaults to the file's signature, then its name.
 * @property {string} [delimiter] - CSV only. Defaults to a sniffed one.
 * @property {string} [encoding] - CSV only. A `TextDecoder` label. Defaults to UTF-8, then Windows-1252.
 * @property {string | number} [sheet] - XLSX only. A sheet name or index.
 * @property {number} [maxRows] - Stop after this many records, including the header.
 * @property {false | "auto" | (() => Worker)} [worker] - `"auto"` (default) parses in an inline Blob worker and falls back to the main thread; `false` stays on the main thread; a function returns your own worker (for a strict CSP).
 * @property {(progress: { loaded: number, total: number }) => void} [onProgress]
 * @property {AbortSignal} [signal]
 *
 * @typedef {object} ParseFileResult
 * @property {string[][]} rows
 * @property {"csv" | "xlsx"} format
 * @property {string} [delimiter]
 * @property {string} [encoding]
 * @property {string} [sheetName]
 * @property {string[]} [sheets]
 * @property {Array<{ type: "unclosed-quote" | "stray-quote", row: number }>} issues
 * @property {boolean} truncated
 * @property {"worker" | "main"} thread
 */

/** @param {Blob} file @param {"csv" | "xlsx" | undefined} format */
async function detectFormat(file, format) {
  if (format) return format;
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 3 && head[3] === 4) {
    return "xlsx";
  }
  return "csv";
}

/** @returns {string} */
function workerSource() {
  return `(${runParseWorker})(self,(${csvCore})(),(${xlsxCore})())`;
}

/**
 * Parse a CSV or XLSX file into rows of strings. Parsing runs in a Web Worker
 * when there is one and moves to the main thread, in time-sliced chunks, when
 * there isn't (SSR, a strict CSP, no `Worker`).
 *
 * @param {Blob} file
 * @param {ParseFileOptions} [options]
 * @returns {Promise<ParseFileResult>}
 */
export async function parseFile(file, options = {}) {
  const { signal, onProgress } = options;
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const format = await detectFormat(file, options.format);
  const request = {
    maxRows: options.maxRows,
    delimiter: options.delimiter,
    encoding: options.encoding,
    sheet: options.sheet,
  };

  if (options.worker !== false && typeof Worker !== "undefined") {
    try {
      return await parseInWorker(file, format, request, options);
    } catch (error) {
      if (!(error instanceof WorkerUnavailable)) throw error;
    }
  }
  return parseInline(file, format, request, signal, onProgress);
}

class WorkerUnavailable extends Error {}

/**
 * @param {Blob} file
 * @param {"csv" | "xlsx"} format
 * @param {any} request
 * @param {ParseFileOptions} options
 * @returns {Promise<ParseFileResult>}
 */
function parseInWorker(file, format, request, options) {
  const { signal, onProgress } = options;
  return new Promise((resolve, reject) => {
    /** @type {Worker} */
    let worker;
    let url = "";
    try {
      if (typeof options.worker === "function") {
        worker = options.worker();
      } else {
        url = URL.createObjectURL(
          new Blob([workerSource()], { type: "text/javascript" }),
        );
        worker = new Worker(url);
      }
    } catch {
      // A CSP without `worker-src blob:` throws here.
      if (url) URL.revokeObjectURL(url);
      reject(new WorkerUnavailable());
      return;
    }

    /** @type {string[][]} */
    let rows = [];
    let settled = false;
    let started = false;
    /** @param {() => void} finish */
    const settle = (finish) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
      if (url) URL.revokeObjectURL(url);
      finish();
    };
    const onAbort = () =>
      settle(() => reject(new DOMException("Aborted", "AbortError")));
    signal?.addEventListener("abort", onAbort);

    worker.onerror = (event) => {
      event.preventDefault?.();
      // Before the first message the worker never ran (a blocked script).
      settle(() =>
        reject(started ? new Error(event.message) : new WorkerUnavailable()),
      );
    };
    worker.onmessage = (event) => {
      started = true;
      const data = event.data;
      if (data.t === "rows") {
        for (let i = 0; i < data.rows.length; i++) rows.push(data.rows[i]);
      } else if (data.t === "reset") {
        rows = [];
      } else if (data.t === "progress") {
        onProgress?.({ loaded: data.loaded, total: data.total });
      } else if (data.t === "done") {
        settle(() =>
          resolve({
            rows,
            format: "csv",
            delimiter: data.meta.delimiter,
            encoding: data.meta.encoding,
            issues: data.meta.issues,
            truncated: data.meta.truncated,
            thread: "worker",
          }),
        );
      } else if (data.t === "xlsx") {
        settle(() =>
          resolve({
            rows: data.rows,
            format: "xlsx",
            sheetName: data.sheetName,
            sheets: data.sheets,
            issues: [],
            truncated: false,
            thread: "worker",
          }),
        );
      } else if (data.t === "error") {
        settle(() => reject(new Error(data.message)));
      }
    };
    worker.postMessage({ file, kind: format, options: request });
  });
}

/**
 * @param {Blob} file
 * @param {"csv" | "xlsx"} format
 * @param {any} request
 * @param {AbortSignal | undefined} signal
 * @param {ParseFileOptions["onProgress"]} onProgress
 * @returns {Promise<ParseFileResult>}
 */
async function parseInline(file, format, request, signal, onProgress) {
  if (format === "xlsx") {
    const result = await xlsxCore().parseXlsx(
      await file.arrayBuffer(),
      request,
    );
    return {
      ...result,
      format,
      issues: [],
      truncated: false,
      thread: "main",
    };
  }
  /** @type {string[][]} */
  let rows = [];
  const meta = await csvCore().streamCsv(file, request, {
    onRows: (batch) => {
      for (let i = 0; i < batch.length; i++) rows.push(batch[i]);
    },
    onReset: () => {
      rows = [];
    },
    onProgress: (loaded, total) => onProgress?.({ loaded, total }),
    canceled: () => Boolean(signal?.aborted),
  });
  return { ...meta, rows, format, thread: "main" };
}
