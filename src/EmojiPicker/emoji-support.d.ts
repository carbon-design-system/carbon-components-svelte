export type EmojiSupport = {
  /** The newest Unicode emoji version the browser draws. `Infinity` when nothing was tested. */
  version: number;
  /** Whether the flags of countries draw as flags. Windows draws them as two letters. */
  flags: boolean;
};

export type EmojiRenderer = (glyph: string) => boolean;

/** Everything shown: what a server, and a browser with no canvas, reports. */
export const FULL_EMOJI_SUPPORT: EmojiSupport;

/** Whether `glyph` is the flag of a country or region. */
export function isFlagGlyph(glyph: string): boolean;

/** One or two emoji to test for each Unicode version in `items`, oldest version first. */
export function emojiProbes(
  items: ReadonlyArray<{ emoji: string; version: number }>,
): { version: number; glyphs: string[] }[];

/** The newest version whose probes all draw and that follows only versions that do. */
export function newestDrawnVersion(
  probes: ReadonlyArray<{ version: number; glyphs: string[] }>,
  render: EmojiRenderer,
): number;

/** Draw a glyph on a canvas and say whether it came out as an emoji. `null` with no canvas. */
export function createCanvasRenderer(): EmojiRenderer | null;

/** Test what the browser draws, from the emoji in `items`. */
export function detectEmojiSupport(
  items: ReadonlyArray<{ emoji: string; version: number }>,
  render?: EmojiRenderer,
): EmojiSupport;

/** The items the browser can draw. Returns `items` itself when none is hidden. */
export function filterSupported<
  Item extends { emoji: string; version: number },
>(
  items: ReadonlyArray<Item>,
  support?: Partial<EmojiSupport>,
): ReadonlyArray<Item>;
