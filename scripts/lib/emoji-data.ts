/**
 * Builds the `carbon-components-svelte/emoji-data` module from Unicode's
 * `emoji-test.txt` and CLDR's English annotations. Kept free of network and
 * file I/O so tests can feed it small fixtures.
 *
 * The module holds one string for each emoji, grouped by Unicode's groups:
 *
 *   glyph ; name ; version ; tones ; keyword | keyword | ...
 *
 * `tones` is empty, or the code point positions in the glyph that take a skin
 * tone modifier, such as `0` or `0.4`. The variants are not stored:
 * `applySkinTone` writes them, and this script checks that it writes exactly
 * the ones Unicode lists. The positions come from Unicode's list, not from an
 * engine's Unicode tables, which lag behind new emoji.
 */

import {
  applySkinTone,
  emojiShortcode,
  SKIN_TONE_MODIFIERS,
} from "../../src/EmojiPicker/emoji-items.js";

/** The versions of Unicode's emoji data and of CLDR the module is built from. */
export const EMOJI_TEST_URL =
  "https://unicode.org/Public/18.0.0/emoji/emoji-test.txt";
const CLDR_BASE = `https://raw.${"git"}hubusercontent.com/unicode-org/cldr/release-49/common`;
export const CLDR_URLS = [
  `${CLDR_BASE}/annotations/en.xml`,
  `${CLDR_BASE}/annotationsDerived/en.xml`,
];

export const FIELD_SEPARATOR = ";";
export const KEYWORD_SEPARATOR = "|";

const TEST_LINE =
  /^([0-9A-F ]+?)\s*;\s*([\w-]+)\s*#\s*\S+\s+E(\d+\.\d+)\s+(.+)$/u;
const GROUP_LINE = /^# group: (.+)$/u;
const ANNOTATION =
  /<annotation cp="([^"]+)"(?: type="(tts)")?>([^<]*)<\/annotation>/gu;
const VARIATION_SELECTOR = /\uFE0F/gu;
const MARKS = /\p{M}/gu;
const NON_WORD = /[^\p{L}\p{N}]+/u;
const UNDERSCORES = /_/gu;
const TRAILING_SEPARATORS = /;+$/u;
const ENTITY = /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/gu;

export type RawEmoji = {
  glyph: string;
  name: string;
  version: number;
  group: string;
};

/**
 * The fully qualified emoji of `emoji-test.txt`, in Unicode's order, with
 * their group. The `Component` group (skin tone swatches, hair) is not an
 * emoji a person picks, so it is left out; `skinTones` holds what the
 * variants are checked against.
 */
export function parseEmojiTest(text: string): RawEmoji[] {
  const emoji: RawEmoji[] = [];
  let group = "";
  for (const line of text.split("\n")) {
    const groupMatch = GROUP_LINE.exec(line);
    if (groupMatch) {
      group = groupMatch[1];
      continue;
    }
    const match = TEST_LINE.exec(line);
    if (!match) continue;
    if (match[2] !== "fully-qualified" || group === "Component") continue;
    const glyph = match[1]
      .trim()
      .split(" ")
      .map((hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .join("");
    emoji.push({
      glyph,
      name: match[4].trim(),
      version: Number.parseFloat(match[3]),
      group,
    });
  }
  return emoji;
}

function decodeEntities(text: string): string {
  return text.replace(ENTITY, (_, entity: string) => {
    if (entity.startsWith("#x"))
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#"))
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity] ?? "";
  });
}

/** CLDR's keywords for each emoji, by glyph without its variation selectors. */
export function parseAnnotations(xml: string): Map<string, string[]> {
  const keywords = new Map<string, string[]>();
  for (const match of xml.matchAll(ANNOTATION)) {
    if (match[2] === "tts") continue;
    const glyph = decodeEntities(match[1]).replace(VARIATION_SELECTOR, "");
    keywords.set(
      glyph,
      decodeEntities(match[3])
        .split("|")
        .map((word) => word.trim())
        .filter(Boolean),
    );
  }
  return keywords;
}

/**
 * Where a skin tone modifier goes in `glyph`: the fewest positions for which
 * all five variants are listed, or none when Unicode lists no variants.
 */
function tonePositions(glyph: string, listed: ReadonlySet<string>): number[] {
  const count = Array.from(glyph).length;
  const candidates: number[][] = [];
  for (let at = 0; at < count; at++) candidates.push([at]);
  for (let at = 0; at < count; at++) {
    for (let other = at + 1; other < count; other++) {
      candidates.push([at, other]);
    }
  }
  return (
    candidates.find((positions) =>
      SKIN_TONE_MODIFIERS.every((_, tone) =>
        listed.has(applySkinTone(glyph, tone + 1, positions)),
      ),
    ) ?? []
  );
}

/** Whether every skin tone modifier in `glyph` is the same one. */
function isUniform(glyph: string): boolean {
  return (
    SKIN_TONE_MODIFIERS.filter((modifier) => glyph.includes(modifier))
      .length === 1
  );
}

function fold(text: string): string {
  return text.normalize("NFD").replace(MARKS, "").toLowerCase();
}

export type EmojiGroup = {
  id: string;
  label: string;
  emoji: string[];
};

export type EmojiDataset = {
  /** The newest emoji version the data holds. */
  version: number;
  groups: EmojiGroup[];
  stats: {
    emoji: number;
    withTones: number;
    withoutKeywords: number;
  };
};

/**
 * Join the emoji with their keywords and skin tone support. Throws when a
 * skin tone variant that Unicode lists is not the one `applySkinTone`
 * writes, or two emoji share a shortcode.
 */
export function buildEmojiDataset(
  all: ReadonlyArray<RawEmoji>,
  keywords: ReadonlyMap<string, string[]>,
): EmojiDataset {
  const listed = new Set(all.map((emoji) => emoji.glyph));
  const isTone = (glyph: string) =>
    SKIN_TONE_MODIFIERS.some((modifier) => glyph.includes(modifier));
  const base = all.filter((emoji) => !isTone(emoji.glyph));

  const written = new Set<string>();
  const groups = new Map<string, EmojiGroup>();
  const shortcodes = new Set<string>();
  let withTones = 0;
  let withoutKeywords = 0;
  let version = 0;

  for (const emoji of base) {
    const shortcode = emojiShortcode(emoji.name);
    if (shortcodes.has(shortcode)) {
      throw new Error(`Two emoji share the shortcode "${shortcode}"`);
    }
    shortcodes.add(shortcode);

    const positions = tonePositions(emoji.glyph, listed);
    if (positions.length > 0) {
      withTones++;
      for (let tone = 1; tone <= SKIN_TONE_MODIFIERS.length; tone++) {
        written.add(applySkinTone(emoji.glyph, tone, positions));
      }
    }

    // A keyword the name already holds adds nothing to a search.
    const nameWords = new Set(fold(emoji.name).split(NON_WORD));
    const extra = (
      keywords.get(emoji.glyph.replace(VARIATION_SELECTOR, "")) ?? []
    ).filter(
      (word) =>
        fold(word) !== fold(emoji.name) &&
        !fold(word)
          .split(NON_WORD)
          .every((part) => nameWords.has(part)),
    );
    if (extra.length === 0) withoutKeywords++;

    const fields = [
      emoji.glyph,
      emoji.name,
      String(emoji.version),
      positions.join("."),
      extra.join(KEYWORD_SEPARATOR),
    ];
    if (fields.some((field) => field.includes(FIELD_SEPARATOR))) {
      throw new Error(`${emoji.name}: a field holds the field separator`);
    }
    if (extra.some((word) => word.includes(KEYWORD_SEPARATOR))) {
      throw new Error(`${emoji.name}: a keyword holds the keyword separator`);
    }

    let group = groups.get(emoji.group);
    if (!group) {
      group = {
        id: emojiShortcode(emoji.group).replace(UNDERSCORES, "-"),
        label: emoji.group,
        emoji: [],
      };
      groups.set(emoji.group, group);
    }
    // Trailing empty fields add bytes and no information.
    group.emoji.push(
      fields.join(FIELD_SEPARATOR).replace(TRAILING_SEPARATORS, ""),
    );
    version = Math.max(version, emoji.version);
  }

  // Every variant Unicode lists in one tone must be one this writes.
  const missing = all.filter((emoji) => {
    const used = SKIN_TONE_MODIFIERS.filter((modifier) =>
      emoji.glyph.includes(modifier),
    );
    return (
      used.length > 0 && !written.has(emoji.glyph) && isUniform(emoji.glyph)
    );
  });
  if (missing.length > 0) {
    throw new Error(
      `applySkinTone does not write: ${missing.map((emoji) => emoji.name).join(", ")}`,
    );
  }

  return {
    version,
    groups: [...groups.values()],
    stats: { emoji: base.length, withTones, withoutKeywords },
  };
}

/** The `index.js` and `index.d.ts` of the module. */
export function renderEmojiModule(dataset: EmojiDataset): {
  js: string;
  dts: string;
} {
  const header =
    "// Generated by scripts/build-emoji-data.ts from Unicode's emoji-test.txt and CLDR's English annotations. Do not edit.";
  const js = `${header}

/** The newest Unicode emoji version the data holds. */
export const emojiVersion = ${dataset.version};

/**
 * The emoji in Unicode's groups and order. Each is one string:
 * \`glyph;name;version;tones;keyword|keyword\`. \`tones\` holds the code point
 * positions that take a skin tone modifier, such as \`0\`, and is empty for an
 * emoji with no skin tone variants. \`toEmojiItems\` expands them.
 */
export const emojiGroups = ${JSON.stringify(dataset.groups, null, 1)};

export default emojiGroups;
`;
  const dts = `${header}

export type EmojiDataGroup = {
  /** The id of the group, such as \`"smileys-emotion"\`. */
  id: string;
  /** The English name of the group. */
  label: string;
  /** One \`glyph;name;version;tones;keyword|keyword\` string for each emoji. */
  emoji: string[];
};

/** The newest Unicode emoji version the data holds. */
export const emojiVersion: number;

/** The emoji in Unicode's groups and order. */
export const emojiGroups: EmojiDataGroup[];

export default emojiGroups;
`;
  return { js, dts };
}
