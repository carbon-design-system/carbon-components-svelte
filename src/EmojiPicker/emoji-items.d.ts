export type EmojiPickerItem = {
  /** The shortcode, such as `"thumbs_up"`. It names the emoji in `value`, `values`, `recent` and `usage`, whatever the skin tone. */
  id: string;
  /** The CLDR name, such as "thumbs up". Search matches it, and assistive technology reads it. */
  label: string;
  /** The `id` of the emoji group. */
  category: string;
  /** The shortcode and CLDR's keywords. */
  keywords: ReadonlyArray<string>;
  /** The glyph, in the default skin tone. */
  emoji: string;
  /** The name as a shortcode: `"thumbs_up"`. */
  shortcode: string;
  /** The Unicode emoji version that added it, such as `0.6` or `15.1`. */
  version: number;
  /** The positions in `emoji`, counted in code points, that take a skin tone modifier. Empty when the emoji has no skin tone variants. */
  tones: ReadonlyArray<number>;
  /** Set to `true` to keep the emoji from being chosen. */
  disabled?: boolean;
};

export type EmojiDataGroup = {
  id: string;
  label: string;
  /** `glyph;name;version;tones;keyword|keyword` for each emoji. */
  emoji: ReadonlyArray<string>;
};

export type EmojiSource =
  ReadonlyArray<EmojiPickerItem> | ReadonlyArray<EmojiDataGroup>;

/** The skin tone modifiers, light to dark: tone 1 to 5. */
export const SKIN_TONE_MODIFIERS: string[];

/**
 * Write `glyph` in a skin tone: the modifier follows the code point at each
 * of `positions`, in place of a variation selector there. `tone` is `1`
 * (light) to `5` (dark), and `0` leaves the glyph as it is.
 */
export function applySkinTone(
  glyph: string,
  tone: number,
  positions?: ReadonlyArray<number>,
): string;

/** "thumbs up" to "thumbs_up", "Côte d’Ivoire" to "cote_d_ivoire". */
export function emojiShortcode(name: string): string;

/**
 * Turn the groups of `carbon-components-svelte/emoji-data` into items and
 * categories for `EmojiPicker`. The work is done once for each dataset.
 */
export function toEmojiItems(groups: ReadonlyArray<EmojiDataGroup>): {
  items: EmojiPickerItem[];
  categories: { id: string; label: string }[];
};

/** Items and categories from the groups of the data, or from items that are ready to show. */
export function resolveEmojiSource(source: EmojiSource): {
  items: ReadonlyArray<EmojiPickerItem>;
  categories: { id: string; label: string }[];
};

/** The ids to show as frequently used: the most used first, and among equals the most recent. */
export function frequentIds(options: {
  recent: ReadonlyArray<string>;
  usage: Readonly<Record<string, number>>;
  limit: number;
}): string[];

/** Count a choice. `recent` keeps `limit` ids, and `usage` the ids with the most uses. */
export function recordEmojiUse(options: {
  id: string;
  recent: ReadonlyArray<string>;
  usage: Readonly<Record<string, number>>;
  limit: number;
}): { recent: string[]; usage: Record<string, number> };
