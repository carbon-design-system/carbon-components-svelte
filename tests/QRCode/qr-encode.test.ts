import { encodeQR, isDark, qrPath } from "../../src/QRCode/qr-encode.js";
import { decodeGrid } from "./decoder";
import { REFERENCE_MATRICES } from "./reference-matrices";

type Ecc = "L" | "M" | "Q" | "H";
const LEVELS: Ecc[] = ["L", "M", "Q", "H"];

const rowsOf = (qr: ReturnType<typeof encodeQR>) =>
  Array.from({ length: qr.size }, (_, y) =>
    Array.from(qr.modules.slice(y * qr.size, (y + 1) * qr.size)).join(""),
  );
const gridOf = (qr: ReturnType<typeof encodeQR>) =>
  Array.from({ length: qr.size }, (_, y) =>
    Array.from(qr.modules.slice(y * qr.size, (y + 1) * qr.size)),
  );

/** The largest byte-mode text each version holds, from the ISO 18004 tables. */
const BYTE_CAPACITY: Record<number, Record<Ecc, number>> = {
  1: { L: 17, M: 14, Q: 11, H: 7 },
  10: { L: 271, M: 213, Q: 151, H: 119 },
  40: { L: 2953, M: 2331, Q: 1663, H: 1273 },
};

/** Largest length of `"a"` that still fits `version` at `ecc`. */
function capacity(version: number, ecc: Ecc, from = 1) {
  let lo = from;
  let hi = BYTE_CAPACITY[40][ecc];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (encodeQR("a".repeat(mid), ecc).version <= version) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

describe("encodeQR", () => {
  it.each(REFERENCE_MATRICES)(
    "matches Core Image for $note",
    ({ text, ecc, rows }) => {
      const qr = encodeQR(text, ecc);

      expect(rowsOf(qr)).toEqual(rows);
    },
  );

  it("is deterministic", () => {
    const a = encodeQR("https://example.com", "Q");
    const b = encodeQR("https://example.com", "Q");

    expect(a.modules).toEqual(b.modules);
  });

  describe("mode selection", () => {
    // Version 1-L holds 41 digits, 25 alphanumeric characters or 17 bytes.
    it.each([
      ["digits", "7", 41],
      ["alphanumeric", "A", 25],
      ["bytes", "a", 17],
    ])("packs %s as the smallest mode", (_, char, fits) => {
      expect(encodeQR(char.repeat(fits), "L").version).toBe(1);
      expect(encodeQR(char.repeat(fits + 1), "L").version).toBe(2);
    });

    it.each(["0123456789012", "HELLO WORLD $%*+-./:", "a1B2", ""])(
      "round-trips %j",
      (text) => {
        expect(decodeGrid(gridOf(encodeQR(text, "M"))).text).toBe(text);
      },
    );
  });

  describe("versions and capacity", () => {
    it.each(
      Object.entries(BYTE_CAPACITY).flatMap(([v, by]) =>
        LEVELS.map((l) => [Number(v), l, by[l]] as const),
      ),
    )("version %i fits %i bytes at %s", (version, ecc, bytes) => {
      // The next byte moves up a version, or throws past version 40.
      expect(encodeQR("a".repeat(bytes), ecc).version).toBe(version);
      if (version === 40) {
        expect(() => encodeQR("a".repeat(bytes + 1), ecc)).toThrow(RangeError);
      } else {
        expect(encodeQR("a".repeat(bytes + 1), ecc).version).toBe(version + 1);
      }
    });

    // Every version at every level, decoded by an independent decoder that
    // finds the block layout itself from the Reed-Solomon syndromes.
    it.each(LEVELS)(
      "decodes the largest text of versions 1 to 40 at %s",
      (ecc) => {
        let from = 1;
        for (let version = 1; version <= 40; version++) {
          const n = capacity(version, ecc, from);
          from = n + 1;
          const text = Array.from({ length: n }, (_, i) =>
            String.fromCharCode(97 + ((i * 7 + version) % 26)),
          ).join("");
          const qr = encodeQR(text, ecc);
          const decoded = decodeGrid(gridOf(qr));

          expect(qr.version).toBe(version);
          expect(qr.size).toBe(version * 4 + 17);
          expect(decoded.text).toBe(text);
          expect(decoded.version).toBe(version);
          expect(decoded.ecc).toBe(ecc);
          expect(decoded.corrected).toBe(0);
        }
      },
      60_000,
    );

    it("honors minVersion", () => {
      expect(encodeQR("a", "L", { minVersion: 12 }).version).toBe(12);
      expect(
        decodeGrid(gridOf(encodeQR("a", "L", { minVersion: 12 }))).text,
      ).toBe("a");
    });
  });

  describe("UTF-8", () => {
    it.each([
      ["emoji", "😀🎉 launch"],
      ["CJK", "你好，世界。こんにちは。안녕하세요"],
      ["accents", "Zażółć gęślą jaźń, café, naïve"],
      ["mixed scripts", "Ünïcödé ✓ — 日本語 — 🇺🇸 — \u0000 — \n"],
    ])("round-trips %s", (_, text) => {
      for (const ecc of LEVELS) {
        expect(decodeGrid(gridOf(encodeQR(text, ecc))).text).toBe(text);
      }
    });

    it("counts bytes, not characters", () => {
      // 6 four-byte emoji are 24 bytes: past 1-L's 17, so version 2.
      expect(encodeQR("😀".repeat(6), "L").version).toBe(2);
    });
  });

  describe("masks", () => {
    it.each([0, 1, 2, 3, 4, 5, 6, 7])("decodes mask %i", (mask) => {
      const qr = encodeQR("mask pattern test 12345", "Q", { mask });
      const decoded = decodeGrid(gridOf(qr));

      expect(qr.mask).toBe(mask);
      expect(decoded.mask).toBe(mask);
      expect(decoded.text).toBe("mask pattern test 12345");
    });
  });

  it("repairs damage up to the level's limit", () => {
    const text = "otpauth://totp/Acme:alice?secret=JBSWY3DPEHPK3PXP";
    const qr = encodeQR(text, "H");
    const clean = decodeGrid(gridOf(qr));
    // Invert a block at the center, as a logo would hide it.
    const grid = gridOf(qr);
    const from = Math.floor((qr.size - 7) / 2);
    for (let y = from; y < from + 7; y++) {
      for (let x = from; x < from + 7; x++) grid[y][x] ^= 1;
    }

    const decoded = decodeGrid(grid, { structure: clean.structure });

    expect(decoded.text).toBe(text);
    expect(decoded.corrected).toBeGreaterThan(0);
  });

  it("throws for an unknown level and for text that is too long", () => {
    // @ts-expect-error not a level
    expect(() => encodeQR("a", "X")).toThrow("unknown ecc");
    expect(() => encodeQR("a".repeat(1274), "H")).toThrow(RangeError);
    expect(() => encodeQR("7".repeat(7090), "L")).toThrow(RangeError);
    expect(encodeQR("7".repeat(7089), "L").version).toBe(40);
  });

  it("draws the fixed patterns", () => {
    const qr = encodeQR("a", "L");

    // Finder centers, the always-dark module, and a light separator.
    expect(isDark(qr, 3, 3)).toBe(true);
    expect(isDark(qr, qr.size - 4, 3)).toBe(true);
    expect(isDark(qr, 3, qr.size - 4)).toBe(true);
    expect(isDark(qr, 8, qr.size - 8)).toBe(true);
    expect(isDark(qr, 7, 0)).toBe(false);
    expect(isDark(qr, -1, 0)).toBe(false);
  });
});

describe("qrPath", () => {
  const area = (d: string) => {
    let sum = 0;
    for (const [, w] of d.matchAll(/h(\d+)v1h-\d+z/g)) sum += Number(w);
    return sum;
  };

  it("draws every dark module in one path, offset by the quiet zone", () => {
    const qr = encodeQR("hello", "M");
    const dark = qr.modules.reduce((a, b) => a + b, 0);
    const d = qrPath(qr, { border: 4 });

    expect(area(d)).toBe(dark);
    expect(d.startsWith("M4 4h7v1h-7z")).toBe(true);
    expect((d.match(/M/g) ?? []).length).toBe((d.match(/z/g) ?? []).length);
  });

  it("leaves out the modules behind a centered hole", () => {
    const qr = encodeQR("hello", "H");
    const hole = 5;
    const from = Math.floor((qr.size - hole) / 2);
    let inside = 0;
    for (let y = from; y < from + hole; y++) {
      for (let x = from; x < from + hole; x++)
        inside += isDark(qr, x, y) ? 1 : 0;
    }

    const full = area(qrPath(qr));
    const cut = area(qrPath(qr, { hole }));

    expect(inside).toBeGreaterThan(0);
    expect(full - cut).toBe(inside);
  });
});
