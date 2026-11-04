// @ts-check
// biome-ignore-all lint/performance/useTopLevelRegex: this function is sent to a worker as source, so it can't see the module scope
// biome-ignore-all lint/performance/noAwaitInLoops: a stream is read one chunk at a time

/**
 * A minimal .xlsx reader: the zip directory, `DecompressionStream` for
 * deflate, and a scanner for the sheet XML. It reads the first visible sheet
 * as strings and turns date-formatted numbers into ISO dates. It does not
 * read formulas (the cached value is used), merged cells, or Zip64 files.
 *
 * Like `csvCore`, this is one function with no free variables, so it can be
 * shipped into a Blob worker through `Function.prototype.toString`.
 *
 * @typedef {object} XlsxOptions
 * @property {string | number} [sheet] - A sheet name or index. Defaults to the first visible sheet.
 * @property {"iso" | "serial"} [dates] - How a date-formatted number is returned. Defaults to `"iso"`.
 * @property {number} [maxRows]
 * @property {number} [maxBytes] - Largest sheet XML to inflate. Defaults to 256 MB.
 *
 * @typedef {object} XlsxResult
 * @property {string[][]} rows
 * @property {string} sheetName
 * @property {string[]} sheets
 */
export function xlsxCore() {
  const utf8 = new TextDecoder("utf-8");

  /** @param {string} s */
  function decode(s) {
    return s.replace(
      /&(#x[\da-f]+|#\d+|lt|gt|amp|quot|apos);|_x([\da-f]{4})_/gi,
      (_, e, h) => {
        if (h) return String.fromCharCode(Number.parseInt(h, 16));
        if (e[0] === "#") {
          const cp =
            e[1] === "x" || e[1] === "X"
              ? Number.parseInt(e.slice(2), 16)
              : Number.parseInt(e.slice(1), 10);
          return String.fromCodePoint(cp);
        }
        return { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" }[
          /** @type {"lt"} */ (e.toLowerCase())
        ];
      },
    );
  }

  /** @param {string} tag @param {string} name */
  function attr(tag, name) {
    const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
    return m ? decode(m[1]) : "";
  }

  /** @param {string} xml */
  function text(xml) {
    let out = "";
    const re = /<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g;
    for (let m = re.exec(xml); m; m = re.exec(xml)) out += m[1] || "";
    return decode(out);
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {Map<string, { method: number, size: number, offset: number }>}
   */
  function readDirectory(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
    let eocd = bytes.length - 22;
    while (eocd >= 0 && view.getUint32(eocd, true) !== 0x06054b50) eocd--;
    if (eocd < 0) throw new Error("Not a zip file");
    const count = view.getUint16(eocd + 10, true);
    let p = view.getUint32(eocd + 16, true);
    if (count === 0xffff || p === 0xffffffff) {
      throw new Error("Zip64 files are not supported");
    }
    const entries = new Map();
    for (let k = 0; k < count && view.getUint32(p, true) === 0x02014b50; k++) {
      const nameLength = view.getUint16(p + 28, true);
      if (view.getUint16(p + 8, true) & 1) {
        throw new Error("The file is password protected");
      }
      entries.set(utf8.decode(bytes.subarray(p + 46, p + 46 + nameLength)), {
        method: view.getUint16(p + 10, true),
        size: view.getUint32(p + 20, true),
        offset: view.getUint32(p + 42, true),
      });
      p +=
        46 +
        nameLength +
        view.getUint16(p + 30, true) +
        view.getUint16(p + 32, true);
    }
    return entries;
  }

  /**
   * @param {Uint8Array} bytes
   * @param {{ method: number, size: number, offset: number }} entry
   * @param {number} limit
   */
  async function read(bytes, entry, limit) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
    const start =
      entry.offset +
      30 +
      view.getUint16(entry.offset + 26, true) +
      view.getUint16(entry.offset + 28, true);
    const data = bytes.subarray(start, start + entry.size);
    if (entry.method === 0) return utf8.decode(data);
    if (entry.method !== 8) throw new Error("Unsupported zip compression");
    const reader = new Blob([/** @type {BlobPart} */ (data)])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"))
      .getReader();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out += utf8.decode(value, { stream: true });
      // Text length stands in for the byte count; both only need to bound a bomb.
      if (out.length > limit) {
        await reader.cancel();
        throw new Error("The sheet is too large");
      }
    }
    return out + utf8.decode();
  }

  /** @param {number} id @param {string} code */
  function isDateFormat(id, code) {
    if (!code) {
      return (
        (id >= 14 && id <= 22) ||
        (id >= 27 && id <= 36) ||
        (id >= 45 && id <= 47) ||
        (id >= 50 && id <= 58)
      );
    }
    return /[ymdhs]/i.test(code.replace(/"[^"]*"|\\.|\[[^\]]*\]|_.|\*./g, ""));
  }

  /** @param {number} serial @param {boolean} date1904 */
  function toIso(serial, date1904) {
    let days = Math.floor(serial);
    let seconds = Math.round((serial - days) * 86400);
    if (seconds === 86400) {
      days++;
      seconds = 0;
    }
    const time = new Date(seconds * 1000).toISOString().slice(11, 19);
    if (serial >= 0 && serial < 1) return time;
    // The 1899-12-30 epoch absorbs Excel's phantom 1900-02-29; only dates
    // before 1900-03-01 come out a day late.
    const epoch = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
    const date = new Date(epoch + days * 86400000).toISOString().slice(0, 10);
    return seconds ? `${date}T${time}` : date;
  }

  /** @param {string} letters */
  function column(letters) {
    let n = 0;
    for (let k = 0; k < letters.length; k++) {
      n = n * 26 + letters.charCodeAt(k) - 64;
    }
    return n - 1;
  }

  /**
   * @param {ArrayBuffer | Uint8Array} input
   * @param {XlsxOptions} [options]
   * @returns {Promise<XlsxResult>}
   */
  async function parseXlsx(input, options = {}) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const entries = readDirectory(bytes);
    const limit = options.maxBytes || 256 * 1024 * 1024;
    /** @param {string} name */
    const load = (name) => {
      const entry = entries.get(name);
      return entry ? read(bytes, entry, limit) : Promise.resolve("");
    };

    const workbook = await load("xl/workbook.xml");
    if (!workbook) throw new Error("Not an .xlsx workbook");
    const rels = await load("xl/_rels/workbook.xml.rels");
    /** @type {Array<{ name: string, target: string }>} */
    const sheets = [];
    const sheetRe = /<sheet\b[^>]*>/g;
    for (let m = sheetRe.exec(workbook); m; m = sheetRe.exec(workbook)) {
      if (/^(hidden|veryHidden)$/.test(attr(m[0], "state"))) continue;
      const rid = attr(m[0], "r:id");
      const rel = new RegExp(`<Relationship\\b[^>]*\\bId="${rid}"[^>]*>`).exec(
        rels,
      );
      const target = rel ? attr(rel[0], "Target") : "";
      sheets.push({
        name: attr(m[0], "name"),
        target: target
          ? target.startsWith("/")
            ? target.slice(1)
            : `xl/${target}`
          : `xl/worksheets/sheet${sheets.length + 1}.xml`,
      });
    }
    if (!sheets.length) throw new Error("The workbook has no sheets");
    const wanted = options.sheet;
    const sheet =
      (typeof wanted === "number" && sheets[wanted]) ||
      sheets.find((s) => s.name === wanted) ||
      sheets[0];

    const date1904 = /<workbookPr\b[^>]*date1904="(1|true)"/.test(workbook);
    const asIso = options.dates !== "serial";
    /** @type {string[]} */
    const strings = [];
    const shared = await load("xl/sharedStrings.xml");
    const siRe = /<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g;
    for (let m = siRe.exec(shared); m; m = siRe.exec(shared)) {
      strings.push(text((m[1] || "").replace(/<rPh\b[\s\S]*?<\/rPh>/g, "")));
    }

    /** @type {boolean[]} */
    const dateStyles = [];
    if (asIso) {
      const styles = await load("xl/styles.xml");
      /** @type {Record<string, string>} */
      const codes = {};
      const fmtRe = /<numFmt\b[^>]*>/g;
      for (let m = fmtRe.exec(styles); m; m = fmtRe.exec(styles)) {
        codes[attr(m[0], "numFmtId")] = attr(m[0], "formatCode");
      }
      const xfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles);
      const xfRe = /<xf\b[^>]*>/g;
      const body = xfs ? xfs[1] : "";
      for (let m = xfRe.exec(body); m; m = xfRe.exec(body)) {
        const id = attr(m[0], "numFmtId");
        dateStyles.push(isDateFormat(Number(id), codes[id] || ""));
      }
    }

    const xml = await load(sheet.target);
    if (!xml) throw new Error("The sheet could not be read");
    const maxRows = options.maxRows || Number.POSITIVE_INFINITY;
    /** @type {string[][]} */
    const rows = [];
    const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
    for (
      let m = rowRe.exec(xml);
      m && rows.length < maxRows;
      m = rowRe.exec(xml)
    ) {
      const at = Number(attr(m[1], "r")) - 1;
      while (at > rows.length && rows.length < maxRows) rows.push([]);
      /** @type {string[]} */
      const cells = [];
      const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      const body = m[2] || "";
      for (let c = cellRe.exec(body); c; c = cellRe.exec(body)) {
        const ref = /\br="([A-Z]+)/.exec(c[1]);
        const index = ref ? column(ref[1]) : cells.length;
        const type = attr(c[1], "t");
        const inner = c[2] || "";
        const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner);
        let value = "";
        if (type === "inlineStr") value = text(inner);
        else if (v) {
          const raw = decode(v[1]);
          if (type === "s") value = strings[Number(raw)] || "";
          else if (type === "b") value = raw === "1" ? "TRUE" : "FALSE";
          else if (type === "n" || type === "") {
            value =
              dateStyles[Number(attr(c[1], "s"))] && raw !== ""
                ? toIso(Number(raw), date1904)
                : raw;
          } else value = raw;
        }
        while (cells.length < index) cells.push("");
        cells[index] = value;
      }
      rows.push(cells);
    }
    while (rows.length && rows[rows.length - 1].every((v) => v === "")) {
      rows.pop();
    }
    return { rows, sheetName: sheet.name, sheets: sheets.map((s) => s.name) };
  }

  return { parseXlsx };
}
