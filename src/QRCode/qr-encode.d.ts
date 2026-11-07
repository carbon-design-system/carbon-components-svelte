export type QRCodeEcc = "L" | "M" | "Q" | "H";

export interface QRCodeMatrix {
  /** Symbol version, 1 to 40. */
  version: number;
  /** Modules per side: `version * 4 + 17`. */
  size: number;
  /** Error correction level. */
  ecc: QRCodeEcc;
  /** Mask pattern, 0 to 7. */
  mask: number;
  /** Row-major, `1` for a dark module. */
  modules: Uint8Array;
}

/**
 * Encode text as a QR Code symbol.
 *
 * Picks numeric, alphanumeric or byte mode for the whole text, the smallest
 * version that fits, and the mask with the lowest penalty. Text outside
 * ISO-8859-1 is encoded as UTF-8 with no ECI header, as most generators do.
 *
 * `minVersion` raises the smallest version tried; `mask` forces a mask
 * pattern (0-7) instead of choosing by penalty score.
 *
 * @throws {RangeError} If the text does not fit version 40 at the level.
 */
export function encodeQR(
  text: string,
  ecc?: QRCodeEcc,
  options?: { minVersion?: number; mask?: number },
): QRCodeMatrix;

/** Whether a module is dark, `false` outside the symbol. */
export function isDark(qr: QRCodeMatrix, x: number, y: number): boolean;

/**
 * Build one SVG path for every dark module, as horizontal runs. Skips the
 * modules inside the optional centered square `hole` (in modules), where a
 * logo covers the symbol. `border` is the quiet zone in modules.
 */
export function qrPath(
  qr: QRCodeMatrix,
  options?: { border?: number; hole?: number },
): string;
