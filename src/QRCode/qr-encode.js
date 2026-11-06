// QR Code Model 2 encoder: ISO/IEC 18004, versions 1-40, error correction
// L/M/Q/H, numeric, alphanumeric and byte (UTF-8) modes. Pure functions with
// no DOM access, so it runs the same on the server and in the browser.

/**
 * @typedef {"L" | "M" | "Q" | "H"} QRCodeEcc
 *
 * @typedef {object} QRCodeMatrix
 * @property {number} version - Symbol version, 1 to 40.
 * @property {number} size - Modules per side: `version * 4 + 17`.
 * @property {QRCodeEcc} ecc - Error correction level.
 * @property {number} mask - Mask pattern, 0 to 7.
 * @property {Uint8Array} modules - Row-major, `1` for a dark module.
 */

// Index = version (the first entry pads it). One row per level: L, M, Q, H.
const ECC_PER_BLOCK = [
  [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30,
    28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30,
  ],
  [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26,
    26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28,
  ],
  [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28,
    26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30,
  ],
  [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28,
    26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30,
  ],
];
const BLOCKS = [
  [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10,
    12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17,
    17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23,
    23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25,
    25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77,
    81,
  ],
];
// The two format bits of each level, in the order of `ECC_PER_BLOCK`.
const ECC_BITS = [1, 0, 3, 2];
const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const NUMERIC = /^\d*$/;
const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]*$/;

// GF(256) with the primitive polynomial x^8 + x^4 + x^3 + x^2 + 1.
const EXP = new Uint8Array(510);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = EXP[i + 255] = x;
  LOG[x] = i;
  x <<= 1;
  if (x > 255) x ^= 0x11d;
}

/** @param {number} a @param {number} b */
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

/**
 * Remainder of `data` divided by the degree-`degree` generator polynomial,
 * which is the Reed-Solomon error correction block.
 * @param {ArrayLike<number>} data
 * @param {number} degree
 */
function reedSolomon(data, degree) {
  const gen = new Uint8Array(degree);
  gen[degree - 1] = 1;
  for (let i = 0, root = 1; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      gen[j] = mul(gen[j], root) ^ (gen[j + 1] || 0);
    }
    root = mul(root, 2);
  }
  const rem = new Uint8Array(degree);
  for (let i = 0; i < data.length; i++) {
    const f = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[degree - 1] = 0;
    for (let j = 0; j < degree; j++) rem[j] ^= mul(gen[j], f);
  }
  return rem;
}

/** @param {number} v */
const rawModules = (v) => {
  let n = (16 * v + 128) * v + 64;
  if (v > 1) {
    const a = ((v / 7) | 0) + 2;
    n -= (25 * a - 10) * a - 55;
    if (v > 6) n -= 36;
  }
  return n;
};

/**
 * Data codewords a version holds at a level (`level` indexes `L`, `M`, `Q`, `H`).
 * @param {number} v @param {number} level
 */
const dataWords = (v, level) =>
  (rawModules(v) >> 3) - ECC_PER_BLOCK[level][v] * BLOCKS[level][v];

/** @param {number} v */
const alignmentCenters = (v) => {
  if (v < 2) return [];
  const n = ((v / 7) | 0) + 2;
  const step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
  const out = [6];
  for (let p = v * 4 + 10; out.length < n; p -= step) out.splice(1, 0, p);
  return out;
};

/**
 * Pick the smallest mode that holds the text: numeric, alphanumeric, or
 * byte (UTF-8). 0 is numeric, 1 alphanumeric, 2 byte.
 * @param {string} text
 */
const modeOf = (text) =>
  NUMERIC.test(text) ? 0 : ALPHANUMERIC.test(text) ? 1 : 2;

/**
 * Width of the character count field, which grows at versions 10 and 27.
 * @param {number} mode @param {number} v
 */
const countBits = (mode, v) =>
  [
    [10, 12, 14],
    [9, 11, 13],
    [8, 16, 16],
  ][mode][v > 26 ? 2 : v > 9 ? 1 : 0];

/**
 * Append the `length` low bits of `value` to `bits`, most significant first.
 * @param {number[]} bits @param {number} value @param {number} length
 */
const push = (bits, value, length) => {
  for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
};

/**
 * Encode text as a QR Code symbol.
 *
 * Picks numeric, alphanumeric or byte mode for the whole text, the smallest
 * version that fits, and the mask with the lowest penalty. Text outside
 * ISO-8859-1 is encoded as UTF-8 with no ECI header, as most generators do.
 * @param {string} text
 * @param {QRCodeEcc} [ecc="M"]
 * @param {{ minVersion?: number; mask?: number }} [options] - `minVersion`
 *   raises the smallest version tried; `mask` forces a mask pattern (0-7)
 *   instead of choosing by penalty score.
 * @returns {QRCodeMatrix}
 * @throws {RangeError} If the text does not fit version 40 at the level.
 */
export function encodeQR(text, ecc = "M", options = {}) {
  const level = "LMQH".indexOf(ecc);
  if (level < 0) throw new RangeError(`QRCode: unknown ecc "${ecc}"`);
  const mode = modeOf(text);
  const bytes = mode === 2 ? new TextEncoder().encode(text) : [];
  const count = mode === 2 ? bytes.length : text.length;
  const dataBits =
    mode === 0
      ? ((count / 3) | 0) * 10 + [0, 4, 7][count % 3]
      : mode === 1
        ? ((count / 2) | 0) * 11 + (count % 2) * 6
        : count * 8;

  let version = Math.max(1, options.minVersion || 1);
  while (
    version <= 40 &&
    !(
      count < 1 << countBits(mode, version) &&
      4 + countBits(mode, version) + dataBits <= dataWords(version, level) * 8
    )
  ) {
    version++;
  }
  if (version > 40) {
    throw new RangeError(`QRCode: the text is too long for ecc "${ecc}"`);
  }

  /** @type {number[]} */
  const bits = [];
  push(bits, [1, 2, 4][mode], 4);
  push(bits, count, countBits(mode, version));
  if (mode === 0) {
    for (let i = 0; i < count; i += 3) {
      const chunk = text.substr(i, 3);
      push(bits, +chunk, chunk.length * 3 + 1);
    }
  } else if (mode === 1) {
    for (let i = 0; i < count; i += 2) {
      const a = ALNUM.indexOf(text[i]);
      if (i + 1 < count) push(bits, a * 45 + ALNUM.indexOf(text[i + 1]), 11);
      else push(bits, a, 6);
    }
  } else {
    for (let i = 0; i < count; i++) push(bits, bytes[i], 8);
  }

  const capacity = dataWords(version, level) * 8;
  push(bits, 0, Math.min(4, capacity - bits.length));
  push(bits, 0, (8 - (bits.length % 8)) % 8);
  /** @type {number[]} */
  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    words.push(Number.parseInt(bits.slice(i, i + 8).join(""), 2));
  }
  for (let pad = 0xec; words.length < capacity >> 3; pad ^= 0xec ^ 0x11) {
    words.push(pad);
  }

  // Split into blocks, add each block's error correction, interleave.
  const nBlocks = BLOCKS[level][version];
  const eccLen = ECC_PER_BLOCK[level][version];
  const total = rawModules(version) >> 3;
  const nShort = nBlocks - (total % nBlocks);
  const shortLen = ((total / nBlocks) | 0) - eccLen;
  const dataBlocks = [];
  const eccBlocks = [];
  for (let i = 0, at = 0; i < nBlocks; i++) {
    const block = words.slice(at, (at += shortLen + (i < nShort ? 0 : 1)));
    dataBlocks.push(block);
    eccBlocks.push(reedSolomon(block, eccLen));
  }
  const codewords = [];
  for (let i = 0; i <= shortLen; i++) {
    for (const block of dataBlocks)
      if (i < block.length) codewords.push(block[i]);
  }
  for (let i = 0; i < eccLen; i++) {
    for (const block of eccBlocks) codewords.push(block[i]);
  }

  return layout(version, level, codewords, options.mask ?? -1);
}

/**
 * Draw the function patterns, place the codewords, and apply the best mask.
 * @param {number} version @param {number} level
 * @param {number[]} codewords @param {number} forcedMask
 * @returns {QRCodeMatrix}
 */
function layout(version, level, codewords, forcedMask) {
  const size = version * 4 + 17;
  const m = new Uint8Array(size * size);
  // 1 for the modules the mask must not touch.
  const fn = new Uint8Array(size * size);
  /** @param {number} x @param {number} y @param {number} dark */
  const set = (x, y, dark) => {
    if (x >= 0 && y >= 0 && x < size && y < size) {
      m[y * size + x] = dark;
      fn[y * size + x] = 1;
    }
  };

  for (let i = 0; i < size; i++) {
    set(6, i, +(i % 2 === 0));
    set(i, 6, +(i % 2 === 0));
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, +(d !== 2 && d !== 4));
      }
    }
  }
  const centers = alignmentCenters(version);
  for (const cx of centers) {
    for (const cy of centers) {
      const onFinder =
        (cx === 6 && cy === 6) ||
        (cx === 6 && cy === size - 7) ||
        (cx === size - 7 && cy === 6);
      if (onFinder) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          set(cx + dx, cy + dy, +(Math.max(Math.abs(dx), Math.abs(dy)) !== 1));
        }
      }
    }
  }

  /** @param {number} mask */
  const drawFormat = (mask) => {
    let rem = (ECC_BITS[level] << 3) | mask;
    const data = rem;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((data << 10) | rem) ^ 0x5412;
    const bit = (/** @type {number} */ i) => (f >>> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, 1);
  };
  drawFormat(0);
  if (version > 6) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const v = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = (i / 3) | 0;
      set(a, b, (v >>> i) & 1);
      set(b, a, (v >>> i) & 1);
    }
  }

  // Codewords run up and down two-column strips from the bottom right.
  for (let i = 0, right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = (right + 1) & 2 ? vert : size - 1 - vert;
        if (!fn[y * size + x] && i < codewords.length * 8) {
          m[y * size + x] = (codewords[i >>> 3] >>> (7 - (i & 7))) & 1;
          i++;
        }
      }
    }
  }

  /** @param {number} mask */
  const applyMask = (mask) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const flip = [
          (x + y) % 2,
          y % 2,
          x % 3,
          (x + y) % 3,
          (((x / 3) | 0) + ((y / 2) | 0)) % 2,
          ((x * y) % 2) + ((x * y) % 3),
          (((x * y) % 2) + ((x * y) % 3)) % 2,
          (((x + y) % 2) + ((x * y) % 3)) % 2,
        ][mask];
        if (!flip && !fn[y * size + x]) m[y * size + x] ^= 1;
      }
    }
  };

  let mask = forcedMask;
  if (mask < 0) {
    let best = Infinity;
    for (let i = 0; i < 8; i++) {
      applyMask(i);
      drawFormat(i);
      const score = penalty(m, size);
      if (score < best) {
        best = score;
        mask = i;
      }
      applyMask(i);
    }
  }
  applyMask(mask);
  drawFormat(mask);

  return {
    version,
    size,
    ecc: /** @type {QRCodeEcc} */ ("LMQH"[level]),
    mask,
    modules: m,
  };
}

/**
 * Penalty score of a masked symbol (ISO 18004 section 7.8.3): runs of five
 * or more, 2x2 blocks, finder-like 1:1:3:1:1 patterns with four light
 * modules on one side, and dark/light imbalance. Patterns are matched
 * inside the symbol only, as ZXing and Core Image do.
 * @param {Uint8Array} m @param {number} size
 */
function penalty(m, size) {
  let score = 0;
  let dark = 0;
  for (let t = 0; t < 2; t++) {
    for (let a = 0; a < size; a++) {
      let run = 0;
      let prev = -1;
      // The last 11 modules of the line as bits.
      let window = 0;
      for (let b = 0; b < size; b++) {
        const c = m[t ? b * size + a : a * size + b];
        if (c === prev) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score++;
        } else {
          run = 1;
          prev = c;
        }
        window = ((window << 1) | c) & 0x7ff;
        if (b > 9 && (window === 0x5d0 || window === 0x05d)) score += 40;
        if (!t) dark += c;
      }
    }
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = m[y * size + x];
      if (
        c === m[y * size + x + 1] &&
        c === m[(y + 1) * size + x] &&
        c === m[(y + 1) * size + x + 1]
      ) {
        score += 3;
      }
    }
  }
  const total = size * size;
  return score + Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10;
}

/**
 * Whether a module is dark, `false` outside the symbol.
 * @param {QRCodeMatrix} qr @param {number} x @param {number} y
 */
export const isDark = (qr, x, y) =>
  x >= 0 &&
  y >= 0 &&
  x < qr.size &&
  y < qr.size &&
  qr.modules[y * qr.size + x] === 1;

/**
 * Build one SVG path for every dark module, as horizontal runs. Skips the
 * modules inside the optional centered square `hole` (in modules), where a
 * logo covers the symbol.
 * @param {QRCodeMatrix} qr
 * @param {{ border?: number; hole?: number }} [options] - `border` is the
 *   quiet zone in modules; `hole` is the side of the cleared square.
 * @returns {string}
 */
export function qrPath(qr, { border = 4, hole = 0 } = {}) {
  const { size } = qr;
  const from = Math.floor((size - hole) / 2);
  const to = from + hole;
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const skip = (/** @type {number} */ px) =>
        hole > 0 && y >= from && y < to && px >= from && px < to;
      if (!qr.modules[y * size + x] || skip(x)) continue;
      let w = 1;
      while (x + w < size && qr.modules[y * size + x + w] && !skip(x + w)) w++;
      d += `M${x + border} ${y + border}h${w}v1h-${w}z`;
      x += w;
    }
  }
  return d;
}
