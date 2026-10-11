// Source map v3 "mappings" decoding (base64 VLQ) and stack parsing, enough to
// map a preview stack frame back to the REPL file and line it came from.

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const DIGIT = new Int8Array(128).fill(-1);
for (let i = 0; i < BASE64.length; i++) DIGIT[BASE64.charCodeAt(i)] = i;

// Chrome: "at fn (url:12:5)" / "at url:12:5"; Firefox and Safari: "fn@url:12:5".
const FRAME = /^\s*(?:at\s+(?:(.*?)\s+\()?|(.*?)@)?(.+?):(\d+):(\d+)\)?\s*$/;

/**
 * @param {string} mappings
 * @returns {Int32Array[]} per generated line, flat [genCol, src, srcLine, srcCol, …], sorted by genCol
 */
export function decodeMappings(mappings) {
  const lines = [];
  let segments = [];
  let src = 0;
  let srcLine = 0;
  let srcCol = 0;
  let genCol = 0;
  const fields = [0, 0, 0, 0, 0];
  let field = 0;
  let value = 0;
  let shift = 0;

  const endSegment = () => {
    if (field === 0) return;
    genCol += fields[0];
    if (field >= 4) {
      src += fields[1];
      srcLine += fields[2];
      srcCol += fields[3];
      segments.push(genCol, src, srcLine, srcCol);
    }
    field = 0;
  };

  for (let i = 0; i <= mappings.length; i++) {
    const c = i < mappings.length ? mappings.charCodeAt(i) : 59; // ';' at end
    if (c === 44 /* , */ || c === 59 /* ; */) {
      endSegment();
      if (c === 59) {
        lines.push(Int32Array.from(segments));
        segments = [];
        genCol = 0;
      }
      continue;
    }
    const digit = DIGIT[c];
    if (digit < 0) throw new Error(`Invalid VLQ character "${mappings[i]}"`);
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      fields[field++] = value & 1 ? -(value >>> 1) : value >>> 1;
      value = 0;
      shift = 0;
    }
  }
  return lines;
}

/**
 * Original position for a 1-based line and 1-based column, or null.
 * @param {Int32Array[]} lines
 * @param {string[]} sources
 */
export function originalPosition(lines, sources, line, column) {
  const segs = lines[line - 1];
  if (!segs || segs.length === 0) return null;
  const col = column - 1;
  let best = -1;
  for (let i = 0; i < segs.length; i += 4) {
    if (segs[i] <= col) best = i;
    else break;
  }
  if (best === -1) best = 0;
  return {
    file: sources[segs[best + 1]],
    line: segs[best + 2] + 1,
    column: segs[best + 3] + 1,
  };
}

/** @returns {{ fn: string; url: string; line: number; column: number }[]} */
export function parseStack(stack) {
  const frames = [];
  for (const raw of String(stack ?? "").split("\n")) {
    const m = FRAME.exec(raw);
    if (!m) continue;
    const url = m[3];
    if (!url.includes(":") || url.startsWith("native")) continue;
    frames.push({
      fn: m[1] || m[2] || "",
      url,
      line: Number(m[4]),
      column: Number(m[5]),
    });
  }
  return frames;
}
