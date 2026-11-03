// @ts-check
// The emoji of `carbon-components-svelte/emoji-data` as items for a picker:
// names, shortcodes, skin tones. Pure, so a server and a test run it too.

/**
 * @typedef {object} EmojiPickerItem
 * @property {string} id - The shortcode, such as `"thumbs_up"`. It names the emoji in `value`, `values`, `recent` and `usage`, whatever the skin tone.
 * @property {string} label - The CLDR name, such as "thumbs up". Search matches it, and assistive technology reads it.
 * @property {string} category - The `id` of the emoji group.
 * @property {ReadonlyArray<string>} keywords - The shortcode and CLDR's keywords.
 * @property {string} emoji - The glyph, in the default skin tone.
 * @property {string} shortcode - The name as a shortcode: `"thumbs_up"`.
 * @property {number} version - The Unicode emoji version that added it, such as `0.6` or `15.1`.
 * @property {ReadonlyArray<number>} tones - The positions in `emoji`, counted in code points, that take a skin tone modifier. Empty when the emoji has no skin tone variants.
 * @property {boolean} [disabled] - Set to `true` to keep the emoji from being chosen.
 */

/**
 * @typedef {object} EmojiDataGroup
 * @property {string} id
 * @property {string} label
 * @property {ReadonlyArray<string>} emoji - `glyph;name;version;tones;keyword|keyword` for each emoji, where `tones` is `0`, or `0.4` for two positions.
 */

/** The skin tone modifiers, light to dark: tone 1 to 5. */
export const SKIN_TONE_MODIFIERS = [
  "\u{1F3FB}",
  "\u{1F3FC}",
  "\u{1F3FD}",
  "\u{1F3FE}",
  "\u{1F3FF}",
];

const VARIATION_SELECTOR = "\uFE0F";
const MARKS = /\p{M}/gu;
const ASTERISK = /\*/gu;
const NUMBER_SIGN = /#/gu;
const NON_ALNUM = /[^a-z0-9]+/gu;
const EDGE_UNDERSCORES = /^_+|_+$/gu;

/**
 * Write `glyph` in a skin tone: the modifier follows the code point at each
 * of `positions`, in place of a variation selector there.
 * @param {string} glyph
 * @param {number} tone - `1` (light) to `5` (dark). `0` is the default tone.
 * @param {ReadonlyArray<number>} [positions] - Code point positions in `glyph` that take the modifier. Empty leaves `glyph` as it is.
 * @returns {string}
 */
export function applySkinTone(glyph, tone, positions = [0]) {
  const modifier = SKIN_TONE_MODIFIERS[tone - 1];
  if (!modifier || positions.length === 0) return glyph;
  const points = Array.from(glyph);
  // From the end, so the positions before it stay where they are.
  for (const position of [...positions].sort((a, b) => b - a)) {
    const selector = points[position + 1] === VARIATION_SELECTOR ? 1 : 0;
    points.splice(position + 1, selector, modifier);
  }
  return points.join("");
}

/**
 * "thumbs up" to "thumbs_up", "Côte d’Ivoire" to "cote_d_ivoire".
 * @param {string} name
 * @returns {string}
 */
export function emojiShortcode(name) {
  return name
    .normalize("NFD")
    .replace(MARKS, "")
    .toLowerCase()
    .replace(ASTERISK, " asterisk ")
    .replace(NUMBER_SIGN, " number sign ")
    .replace(NON_ALNUM, "_")
    .replace(EDGE_UNDERSCORES, "");
}

/** @type {WeakMap<ReadonlyArray<EmojiDataGroup>, { items: EmojiPickerItem[]; categories: { id: string; label: string }[] }>} */
const expanded = new WeakMap();

/**
 * Turn the groups of `carbon-components-svelte/emoji-data` into items and
 * categories for `EmojiPicker`. The work is done once for each dataset.
 * @param {ReadonlyArray<EmojiDataGroup>} groups
 * @returns {{ items: EmojiPickerItem[]; categories: { id: string; label: string }[] }}
 */
export function toEmojiItems(groups) {
  const cached = expanded.get(groups);
  if (cached) return cached;
  /** @type {EmojiPickerItem[]} */
  const items = [];
  for (const group of groups) {
    for (const entry of group.emoji) {
      const [emoji, label, version, tones, keywords] = entry.split(";");
      const shortcode = emojiShortcode(label);
      items.push({
        id: shortcode,
        label,
        category: group.id,
        keywords: keywords ? [shortcode, ...keywords.split("|")] : [shortcode],
        emoji,
        shortcode,
        version: Number(version),
        tones: tones ? tones.split(".").map(Number) : [],
      });
    }
  }
  const result = {
    items,
    categories: groups.map(({ id, label }) => ({ id, label })),
  };
  expanded.set(groups, result);
  return result;
}

/**
 * @typedef {ReadonlyArray<EmojiPickerItem> | ReadonlyArray<EmojiDataGroup>} EmojiSource
 */

/**
 * Items and categories from either what `toEmojiItems` takes or items that
 * are ready to show.
 * @param {EmojiSource} source
 * @returns {{ items: ReadonlyArray<EmojiPickerItem>; categories: { id: string; label: string }[] }}
 */
export function resolveEmojiSource(source) {
  const first = source[0];
  if (first && Array.isArray(/** @type {EmojiDataGroup} */ (first).emoji)) {
    return toEmojiItems(/** @type {ReadonlyArray<EmojiDataGroup>} */ (source));
  }
  return {
    items: /** @type {ReadonlyArray<EmojiPickerItem>} */ (source),
    categories: [],
  };
}

/**
 * The ids to show as frequently used: the most used first, and among equals
 * the most recent.
 * @param {Object} options
 * @param {ReadonlyArray<string>} options.recent - Ids, newest first.
 * @param {Readonly<Record<string, number>>} options.usage - How many times each id was chosen.
 * @param {number} options.limit
 * @returns {string[]}
 */
export function frequentIds({ recent, usage, limit }) {
  if (limit <= 0) return [];
  const age = new Map(recent.map((id, at) => [id, at]));
  const ids = new Set([...recent, ...Object.keys(usage)]);
  return [...ids]
    .sort(
      (a, b) =>
        (usage[b] ?? 0) - (usage[a] ?? 0) ||
        (age.get(a) ?? Number.POSITIVE_INFINITY) -
          (age.get(b) ?? Number.POSITIVE_INFINITY),
    )
    .slice(0, limit);
}

/**
 * Count a choice. `recent` keeps `limit` ids, and `usage` the ids with the
 * most uses, so neither grows without bound in storage.
 * @param {Object} options
 * @param {string} options.id
 * @param {ReadonlyArray<string>} options.recent
 * @param {Readonly<Record<string, number>>} options.usage
 * @param {number} options.limit
 * @returns {{ recent: string[]; usage: Record<string, number> }}
 */
export function recordEmojiUse({ id, recent, usage, limit }) {
  const nextRecent = [id, ...recent.filter((other) => other !== id)].slice(
    0,
    Math.max(limit, 1),
  );
  const counted = { ...usage, [id]: (usage[id] ?? 0) + 1 };
  const keep = Math.max(limit, 1) * 4;
  const entries = Object.entries(counted);
  if (entries.length <= keep) return { recent: nextRecent, usage: counted };
  // The choice just made stays, however few uses it has.
  entries.sort(
    (a, b) => Number(b[0] === id) - Number(a[0] === id) || b[1] - a[1],
  );
  return {
    recent: nextRecent,
    usage: Object.fromEntries(entries.slice(0, keep)),
  };
}
