// @ts-check
// biome-ignore-all lint/performance/useTopLevelRegex: this function is sent to a worker as source, so it can't see the module scope
// biome-ignore-all lint/performance/noAwaitInLoops: a stream is read one chunk at a time

/**
 * The CSV engine, wrapped in one function so it has no free variables.
 * `Function.prototype.toString` can then ship it into an inline Blob worker
 * (see `parse-file.js`); a bundler may rename anything inside, but not what
 * the returned object exposes. Do not reference module-level values here.
 *
 * @typedef {object} CsvParser
 * @property {(chunk: string) => string[][]} write - Feed text; returns the records completed by it.
 * @property {() => string[][]} end - Flush the last record.
 * @property {() => CsvIssue[]} issues
 *
 * @typedef {object} CsvIssue
 * @property {"unclosed-quote" | "stray-quote"} type
 * @property {number} row - Zero-based index of the record.
 *
 * @typedef {object} StreamHooks
 * @property {(rows: string[][]) => void} onRows
 * @property {(loaded: number, total: number) => void} [onProgress]
 * @property {() => void} [onReset] - The encoding guess was wrong; discard rows so far.
 * @property {() => boolean} [canceled]
 *
 * @typedef {object} StreamOptions
 * @property {string} [delimiter] - Defaults to a sniffed one.
 * @property {string} [encoding] - A `TextDecoder` label; defaults to UTF-8 with a Windows-1252 fallback.
 * @property {number} [maxRows] - Stop after this many records.
 * @property {number} [batchSize]
 *
 * @typedef {object} StreamResult
 * @property {string} delimiter
 * @property {string} encoding
 * @property {CsvIssue[]} issues
 * @property {number} rowCount
 * @property {boolean} truncated
 */
export function csvCore() {
  const CANDIDATES = [",", ";", "\t", "|"];
  const SNIFF_BYTES = 32768;

  /**
   * @param {string} delimiter
   * @param {{ skipEmptyLines?: boolean }} [options]
   * @returns {CsvParser}
   */
  function createParser(delimiter, options) {
    const skipEmpty = options?.skipEmptyLines !== false;
    const D = delimiter.charCodeAt(0);
    // 0: at the start of a field, 1: in an unquoted field,
    // 2: in a quoted field, 3: just after a quote inside a quoted field
    let state = 0;
    let field = "";
    /** @type {string[]} */
    let row = [];
    let recordIndex = 0;
    let skipLF = false;
    let quotedRow = false;
    /** @type {CsvIssue[]} */
    const issues = [];
    let quoteRow = 0;

    /** @param {string[][]} out */
    function endRow(out) {
      row.push(field);
      field = "";
      state = 0;
      if (skipEmpty && row.length === 1 && row[0] === "" && !quotedRow) {
        row = [];
        return;
      }
      quotedRow = false;
      out.push(row);
      row = [];
      recordIndex++;
    }

    /** @param {string} text */
    function write(text) {
      /** @type {string[][]} */
      const out = [];
      const n = text.length;
      let i = 0;
      if (skipLF && n > 0) {
        if (text.charCodeAt(0) === 10) i = 1;
        skipLF = false;
      }
      while (i < n) {
        if (state === 2) {
          const q = text.indexOf('"', i);
          if (q === -1) {
            field += text.slice(i);
            return out;
          }
          field += text.slice(i, q);
          i = q + 1;
          state = 3;
          continue;
        }
        if (state === 3) {
          const c = text.charCodeAt(i);
          if (c === 34) {
            field += '"';
            state = 2;
            i++;
          } else if (c === D) {
            row.push(field);
            field = "";
            state = 0;
            i++;
          } else if (c === 10 || c === 13) {
            i++;
            if (c === 13) {
              if (text.charCodeAt(i) === 10) i++;
              else if (i === n) skipLF = true;
            }
            endRow(out);
          } else {
            // Text after the closing quote: keep it, and say so.
            issues.push({ type: "stray-quote", row: recordIndex });
            state = 1;
          }
          continue;
        }
        if (state === 0) {
          const c = text.charCodeAt(i);
          if (c === 34) {
            state = 2;
            quotedRow = true;
            quoteRow = recordIndex;
            i++;
            continue;
          }
          state = 1;
        }
        // Unquoted field: scan to the next delimiter or line break.
        let j = i;
        let c = 0;
        while (j < n) {
          c = text.charCodeAt(j);
          if (c === D || c === 10 || c === 13) break;
          j++;
        }
        field += text.slice(i, j);
        if (j === n) return out;
        i = j + 1;
        if (c === D) {
          row.push(field);
          field = "";
          state = 0;
        } else {
          if (c === 13) {
            if (text.charCodeAt(i) === 10) i++;
            else if (i === n) skipLF = true;
          }
          endRow(out);
        }
      }
      return out;
    }

    function end() {
      /** @type {string[][]} */
      const out = [];
      if (state === 2) {
        issues.push({ type: "unclosed-quote", row: quoteRow });
      }
      if (state !== 0 || field !== "" || row.length > 0) endRow(out);
      return out;
    }

    return { write, end, issues: () => issues };
  }

  /**
   * Pick the delimiter whose records have the most consistent width.
   * @param {string} sample
   * @param {string[]} [candidates]
   */
  function sniffDelimiter(sample, candidates) {
    const list = candidates || CANDIDATES;
    let best = list[0];
    let bestScore = -1;
    for (const candidate of list) {
      const parser = createParser(candidate);
      const rows = parser.write(sample).slice(0, 30);
      // The last record may be cut off by the sample.
      if (rows.length > 2) rows.pop();
      if (rows.length === 0) continue;
      /** @type {Map<number, number>} */
      const widths = new Map();
      for (const r of rows)
        widths.set(r.length, (widths.get(r.length) || 0) + 1);
      let mode = 0;
      let modeCount = 0;
      for (const [width, count] of widths) {
        if (count > modeCount || (count === modeCount && width > mode)) {
          mode = width;
          modeCount = count;
        }
      }
      if (mode < 2) continue;
      const score = (modeCount / rows.length) * 1000 + Math.min(mode, 99);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {{ encoding: string, bom: number }}
   */
  function detectEncoding(bytes) {
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return { encoding: "utf-8", bom: 3 };
    }
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return { encoding: "utf-16le", bom: 2 };
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return { encoding: "utf-16be", bom: 2 };
    }
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: true });
      return { encoding: "utf-8", bom: 0 };
    } catch {
      return { encoding: "windows-1252", bom: 0 };
    }
  }

  /**
   * Parse a `Blob` as a stream, so nothing holds more than a chunk of text
   * beside the rows.
   * @param {Blob} source
   * @param {StreamOptions} options
   * @param {StreamHooks} hooks
   * @returns {Promise<StreamResult>}
   */
  async function streamCsv(source, options, hooks) {
    const total = source.size;
    const batchSize = options.batchSize || 5000;
    const maxRows = options.maxRows || Number.POSITIVE_INFINITY;
    const sample = new Uint8Array(
      await source.slice(0, SNIFF_BYTES).arrayBuffer(),
    );
    let { encoding, bom } = detectEncoding(sample);
    if (options.encoding) encoding = options.encoding.toLowerCase();

    for (let attempt = 0; ; attempt++) {
      const isGuess = !options.encoding && encoding === "utf-8";
      const decoder = new TextDecoder(encoding, { fatal: isGuess });
      let delimiter = options.delimiter || "";
      /** @type {{ parser: CsvParser | null }} */
      const state = { parser: null };
      let loaded = 0;
      let rowCount = 0;
      let truncated = false;
      let first = true;
      /** @type {string[][]} */
      let batch = [];

      /** @param {string[][]} rows */
      function push(rows) {
        for (let k = 0; k < rows.length; k++) {
          if (rowCount >= maxRows) {
            truncated = true;
            return;
          }
          batch.push(rows[k]);
          rowCount++;
          if (batch.length >= batchSize) {
            hooks.onRows(batch);
            batch = [];
          }
        }
      }

      /**
       * @param {string} chunk
       * @param {boolean} last
       */
      function feed(chunk, last) {
        let text = chunk;
        if (first) {
          if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
          // Excel writes `sep=;` first when the list separator isn't a comma.
          const sep = /^sep=(.)\r?\n/i.exec(text);
          if (sep) {
            delimiter = options.delimiter || sep[1];
            text = text.slice(sep[0].length);
          }
          if (!delimiter) delimiter = sniffDelimiter(text);
          state.parser = createParser(delimiter);
          first = false;
        }
        if (state.parser) {
          push(state.parser.write(text));
          if (last) push(state.parser.end());
        }
      }

      /** @type {ReadableStreamDefaultReader<Uint8Array> | null} */
      let reader = null;
      try {
        if (typeof source.stream === "function") {
          reader = source.stream().getReader();
        }
        if (reader) {
          for (;;) {
            if (hooks.canceled?.()) {
              await reader.cancel();
              throw new DOMException("Aborted", "AbortError");
            }
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.length;
            const skip = loaded === value.length ? bom : 0;
            feed(
              decoder.decode(skip ? value.subarray(skip) : value, {
                stream: true,
              }),
              false,
            );
            hooks.onProgress?.(loaded, total);
            if (truncated) {
              await reader.cancel();
              break;
            }
          }
        } else {
          const bytes = new Uint8Array(await source.arrayBuffer());
          const step = 1 << 20;
          for (let at = bom; at < bytes.length; at += step) {
            if (hooks.canceled?.()) {
              throw new DOMException("Aborted", "AbortError");
            }
            loaded = Math.min(at + step, bytes.length);
            feed(
              decoder.decode(bytes.subarray(at, loaded), { stream: true }),
              false,
            );
            hooks.onProgress?.(loaded, total);
            if (truncated) break;
          }
        }
        feed(decoder.decode(), true);
      } catch (error) {
        // Compared by name: a decoder from another realm throws its own TypeError.
        if (
          /** @type {Error} */ (error)?.name === "TypeError" &&
          isGuess &&
          attempt === 0
        ) {
          // A byte outside the first chunk was not UTF-8 after all.
          reader?.cancel().catch(() => {});
          hooks.onReset?.();
          encoding = "windows-1252";
          continue;
        }
        throw error;
      }
      if (batch.length) hooks.onRows(batch);
      hooks.onProgress?.(total, total);
      return {
        delimiter,
        encoding,
        issues: state.parser ? state.parser.issues() : [],
        rowCount,
        truncated,
      };
    }
  }

  return { createParser, sniffDelimiter, detectEncoding, streamCsv };
}
