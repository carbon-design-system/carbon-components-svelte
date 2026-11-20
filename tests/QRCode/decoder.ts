/**
 * A QR Code decoder written only for the tests. It shares no code or tables
 * with `src/QRCode/qr-encode.js`: GF(256) uses carry-less multiplication,
 * the block layout is found by searching for the split whose Reed-Solomon
 * syndromes all vanish, and error correction is Berlekamp-Massey. A bug in
 * the encoder therefore cannot cancel against the same bug here.
 */

export type Grid = ArrayLike<ArrayLike<number>>;

export interface Structure {
  blocks: number;
  eccPerBlock: number;
}

export interface Decoded {
  text: string;
  version: number;
  ecc: "L" | "M" | "Q" | "H";
  mask: number;
  structure: Structure;
  /** Codewords the Reed-Solomon pass had to repair. */
  corrected: number;
}

// --- GF(256), primitive polynomial 0x11d, without lookup tables ---

function clmul(x: number, y: number): number {
  let p = 0;
  let a = x;
  let b = y;
  while (b) {
    if (b & 1) p ^= a;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
    b >>= 1;
  }
  return p;
}
// Every product, computed once by carry-less multiplication. No log tables.
const PRODUCTS = new Uint8Array(256 * 256);
for (let a = 0; a < 256; a++) {
  for (let b = 0; b < 256; b++) PRODUCTS[(a << 8) | b] = clmul(a, b);
}
const gmul = (a: number, b: number) => PRODUCTS[(a << 8) | b];
function gpow(a: number, n: number): number {
  let r = 1;
  for (let i = 0; i < n; i++) r = gmul(r, a);
  return r;
}
const ginv = (a: number) => gpow(a, 254);
const alpha = (n: number) => gpow(2, ((n % 255) + 255) % 255);

// --- format information ---

/** BCH(15,5) codeword for 5 data bits, XOR-masked with 101010000010010. */
function formatWord(data: number): number {
  let v = data << 10;
  for (let bit = 14; bit >= 10; bit--) {
    if (v & (1 << bit)) v ^= 0b10100110111 << (bit - 10);
  }
  return ((data << 10) | v) ^ 0b101010000010010;
}

const popcount = (n: number) => n.toString(2).replaceAll("0", "").length;

const ECC_FROM_BITS: Record<number, "L" | "M" | "Q" | "H"> = {
  1: "L",
  0: "M",
  3: "Q",
  2: "H",
};

function readFormat(g: Grid, n: number) {
  const bit = (x: number, y: number) => g[y][x] & 1;
  // Copy 1 around the top-left finder, most significant bit first.
  const a: number[] = [];
  for (let i = 0; i <= 5; i++) a.push(bit(8, i));
  a.push(bit(8, 7), bit(8, 8), bit(7, 8));
  for (let i = 5; i >= 0; i--) a.push(bit(i, 8));
  // `a` runs from bit 0 up to bit 14 of the format word.
  const first = a.reduce((acc, b, i) => acc | (b << i), 0);
  // Copy 2 split between the other two finders.
  const b2: number[] = [];
  for (let i = 0; i < 8; i++) b2.push(bit(n - 1 - i, 8));
  for (let i = 8; i < 15; i++) b2.push(bit(8, n - 15 + i));
  const second = b2.reduce((acc, b, i) => acc | (b << i), 0);
  let best = { dist: 99, data: 0 };
  for (let data = 0; data < 32; data++) {
    const w = formatWord(data);
    const dist = Math.min(popcount(w ^ first), popcount(w ^ second));
    if (dist < best.dist) best = { dist, data };
  }
  if (best.dist > 3) throw new Error("unreadable format information");
  return { ecc: ECC_FROM_BITS[best.data >> 3], mask: best.data & 7 };
}

// --- function pattern map ---

function alignmentCenters(version: number): number[] {
  if (version === 1) return [];
  const last = version * 4 + 10;
  const count = Math.floor(version / 7) + 2;
  if (count === 2) return [6, last];
  const step =
    version === 32 ? 26 : Math.ceil((last - 6) / (count - 1) / 2) * 2;
  const out = [last];
  while (out.length < count - 1) out.unshift(out[0] - step);
  return [6, ...out];
}

function functionMap(version: number): boolean[][] {
  const n = version * 4 + 17;
  const f = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const rect = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (x >= 0 && y >= 0 && x < n && y < n) f[y][x] = true;
      }
    }
  };
  rect(0, 0, 9, 9);
  rect(n - 8, 0, 8, 9);
  rect(0, n - 8, 9, 8);
  rect(6, 0, 1, n);
  rect(0, 6, n, 1);
  const centers = alignmentCenters(version);
  for (const cx of centers) {
    for (const cy of centers) {
      const overFinder =
        (cx === 6 && cy === 6) ||
        (cx === 6 && cy === n - 7) ||
        (cx === n - 7 && cy === 6);
      if (!overFinder) rect(cx - 2, cy - 2, 5, 5);
    }
  }
  if (version >= 7) {
    rect(n - 11, 0, 3, 6);
    rect(0, n - 11, 6, 3);
  }
  return f;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

// --- Reed-Solomon ---

/** Whether the first `count` syndromes vanish, stopping at the first that does not. */
function clean(word: number[], count: number): boolean {
  for (let j = 0; j < count; j++) {
    const root = alpha(j);
    let s = 0;
    for (const c of word) s = gmul(s, root) ^ c;
    if (s) return false;
  }
  return true;
}

function syndromes(word: number[], count: number): number[] {
  const out: number[] = [];
  for (let j = 0; j < count; j++) {
    const root = alpha(j);
    let s = 0;
    for (const c of word) s = gmul(s, root) ^ c;
    out.push(s);
  }
  return out;
}

/** Berlekamp-Massey, Chien search and Forney. Returns the repaired word. */
function correct(
  word: number[],
  eccLen: number,
): { word: number[]; fixed: number } {
  const S = syndromes(word, eccLen);
  if (S.every((s) => s === 0)) return { word, fixed: 0 };
  const C = [1];
  let B = [1];
  let L = 0;
  let m = 1;
  let b = 1;
  for (let i = 0; i < eccLen; i++) {
    let d = S[i];
    for (let j = 1; j <= L; j++) d ^= gmul(C[j] ?? 0, S[i - j]);
    if (d === 0) {
      m++;
    } else {
      const T = C.slice();
      const coef = gmul(d, ginv(b));
      while (C.length < B.length + m) C.push(0);
      for (let j = 0; j < B.length; j++) C[j + m] ^= gmul(coef, B[j]);
      if (2 * L <= i) {
        L = i + 1 - L;
        B = T;
        b = d;
        m = 1;
      } else {
        m++;
      }
    }
  }
  const n = word.length;
  const positions: number[] = [];
  for (let k = 0; k < n; k++) {
    // Codeword index n-1-k carries locator alpha^k; test its inverse.
    const xinv = alpha(-k);
    let v = 0;
    for (let j = 0; j < C.length; j++) v ^= gmul(C[j], gpow(xinv, j));
    if (v === 0) positions.push(k);
  }
  if (positions.length !== L)
    throw new Error("uncorrectable: locator mismatch");
  // Omega = S(x) * C(x) mod x^eccLen
  const omega = new Array<number>(eccLen).fill(0);
  for (let i = 0; i < eccLen; i++) {
    for (let j = 0; j < C.length && j <= i; j++)
      omega[i] ^= gmul(C[j], S[i - j]);
  }
  const fixed = word.slice();
  for (const k of positions) {
    const x = alpha(k);
    const xinv = alpha(-k);
    let num = 0;
    for (let j = 0; j < omega.length; j++) num ^= gmul(omega[j], gpow(xinv, j));
    let den = 0;
    for (let j = 1; j < C.length; j += 2) den ^= gmul(C[j], gpow(xinv, j - 1));
    fixed[n - 1 - k] ^= gmul(x, gmul(num, ginv(den)));
  }
  if (syndromes(fixed, eccLen).some((s) => s !== 0)) {
    throw new Error("uncorrectable: syndromes remain");
  }
  return { word: fixed, fixed: positions.length };
}

// --- bit stream ---

/** Words of block `j` in the interleaved stream: data, then ecc. */
function blockOf(codewords: number[], s: Structure, j: number) {
  const { blocks, eccPerBlock } = s;
  const dataTotal = codewords.length - blocks * eccPerBlock;
  const short = Math.floor(dataTotal / blocks);
  const longCount = dataTotal % blocks;
  const isLong = j >= blocks - longCount;
  const data: number[] = [];
  for (let i = 0; i < short; i++) data.push(codewords[i * blocks + j]);
  if (isLong) data.push(codewords[short * blocks + (j - (blocks - longCount))]);
  const ecc: number[] = [];
  for (let i = 0; i < eccPerBlock; i++) {
    ecc.push(codewords[dataTotal + i * blocks + j]);
  }
  return { data, ecc };
}

function parse(data: number[], version: number): string {
  const bits: number[] = [];
  for (const byte of data)
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  let at = 0;
  const take = (n: number) => {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | (bits[at++] ?? 0);
    return v;
  };
  const tier = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  const bytes: number[] = [];
  let out = "";
  const flush = () => {
    if (bytes.length) {
      out += new TextDecoder("utf-8", { fatal: true }).decode(
        new Uint8Array(bytes),
      );
      bytes.length = 0;
    }
  };
  const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  while (at + 4 <= bits.length) {
    const mode = take(4);
    if (mode === 0) break;
    if (mode === 7) {
      take(8);
      continue;
    }
    if (mode === 1) {
      flush();
      let n = take([10, 12, 14][tier]);
      while (n >= 3) {
        out += String(take(10)).padStart(3, "0");
        n -= 3;
      }
      if (n === 2) out += String(take(7)).padStart(2, "0");
      if (n === 1) out += String(take(4));
    } else if (mode === 2) {
      flush();
      let n = take([9, 11, 13][tier]);
      while (n >= 2) {
        const v = take(11);
        out += ALNUM[Math.floor(v / 45)] + ALNUM[v % 45];
        n -= 2;
      }
      if (n === 1) out += ALNUM[take(6)];
    } else if (mode === 4) {
      const n = take([8, 16, 16][tier]);
      for (let i = 0; i < n; i++) bytes.push(take(8));
    } else {
      throw new Error(`unsupported mode ${mode}`);
    }
  }
  flush();
  return out;
}

/**
 * Decode a module grid (`1` or truthy for dark, no quiet zone).
 * Pass `structure` to skip the block-layout search, such as for a symbol
 * with modules knocked out, where the search could not verify a split.
 */
export function decodeGrid(
  grid: Grid,
  options: { structure?: Structure } = {},
): Decoded {
  const n = grid.length;
  if ((n - 17) % 4 !== 0 || n < 21) throw new Error(`bad size ${n}`);
  const version = (n - 17) / 4;
  const { ecc, mask } = readFormat(grid, n);
  const fn = functionMap(version);
  const bits: number[] = [];
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    // Strips alternate up and down, starting upward at the right edge.
    const strip = right > 6 ? (n - 1 - right) / 2 : (n - 2 - right) / 2;
    const up = strip % 2 === 0;
    for (let v = 0; v < n; v++) {
      const y = up ? n - 1 - v : v;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (fn[y][x]) continue;
        bits.push((grid[y][x] & 1) ^ (MASKS[mask](x, y) ? 1 : 0));
      }
    }
  }
  const codewords: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let v = 0;
    for (let k = 0; k < 8; k++) v = (v << 1) | bits[i + k];
    codewords.push(v);
  }

  let structure = options.structure;
  if (!structure) {
    // Find the split whose blocks all have zero syndromes. Try the most
    // blocks and the longest ecc first: interleaving b blocks of ecc e
    // leaves floor(e / 2) leading syndromes zero on a 2-block stream read as
    // one, so a smaller split can pass falsely, and a larger one never does.
    outer: for (let blocks = 81; blocks >= 1; blocks--) {
      for (let eccPerBlock = 30; eccPerBlock >= 7; eccPerBlock--) {
        const dataPerBlock = (codewords.length - blocks * eccPerBlock) / blocks;
        if (dataPerBlock < 9 || dataPerBlock > 124) continue;
        const s = { blocks, eccPerBlock };
        let ok = true;
        for (let j = 0; j < blocks && ok; j++) {
          const b = blockOf(codewords, s, j);
          ok = clean([...b.data, ...b.ecc], eccPerBlock);
        }
        if (ok) {
          structure = s;
          break outer;
        }
      }
    }
    if (!structure) throw new Error("no block layout satisfies the syndromes");
  }

  const out: number[] = [];
  let corrected = 0;
  for (let j = 0; j < structure.blocks; j++) {
    const b = blockOf(codewords, structure, j);
    const r = correct([...b.data, ...b.ecc], structure.eccPerBlock);
    corrected += r.fixed;
    out.push(...r.word.slice(0, b.data.length));
  }
  return {
    text: parse(out, version),
    version,
    ecc,
    mask,
    structure,
    corrected,
  };
}

/**
 * Sample a luma image (0-255, row-major) into a module grid and decode it.
 * Finds the symbol from its dark bounding box, reads the module size from
 * the 7-module finder pattern, and samples each module's center.
 */
export function decodeLuma(
  luma: ArrayLike<number>,
  width: number,
  height: number,
  options: { structure?: Structure } = {},
) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (luma[y * width + x] < 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error("no dark pixels");
  const side = x1 - x0 + 1;
  // Render scaling rounds module edges, so the size read off one finder row
  // can be a module or two out. Try every legal size and keep the one whose
  // samples draw the three finders and the timing lines.
  const sample = (n: number) => {
    const cell = side / n;
    const grid: number[][] = [];
    for (let r = 0; r < n; r++) {
      const row: number[] = [];
      for (let c = 0; c < n; c++) {
        const px = Math.floor(x0 + (c + 0.5) * cell);
        const py = Math.floor(y0 + (r + 0.5) * cell);
        row.push(luma[py * width + px] < 128 ? 1 : 0);
      }
      grid.push(row);
    }
    return grid;
  };
  const fit = (grid: number[][]) => {
    const n = grid.length;
    let score = 0;
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
          const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          if (grid[oy + dy][ox + dx] === (d === 2 ? 0 : 1)) score++;
        }
      }
    }
    for (let i = 8; i < n - 8; i++) {
      if (grid[6][i] === (i + 1) % 2) score++;
      if (grid[i][6] === (i + 1) % 2) score++;
    }
    // As a share of the modules checked, so a larger guess gets no edge.
    return score / (147 + 2 * (n - 16));
  };
  let best: number[][] | undefined;
  let bestScore = -1;
  for (let n = 21; n <= 177; n += 4) {
    const grid = sample(n);
    const score = fit(grid);
    if (score > bestScore) {
      best = grid;
      bestScore = score;
    }
  }
  const grid = best as number[][];
  return { grid, decoded: decodeGrid(grid, options) };
}
