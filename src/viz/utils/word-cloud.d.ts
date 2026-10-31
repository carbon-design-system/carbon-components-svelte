export type WordCloudOptions = {
  width: number;
  height: number;
  /** Font size of the smallest word. @default 12 */
  minSize?: number;
  /** Font size of the largest word. @default 56 */
  maxSize?: number;
  /** Room kept around every word. @default 2 */
  padding?: number;
  /** Only the largest words are placed. @default 100 */
  maxWords?: number;
};

export type PlacedWord = {
  /** Index into the input. */
  index: number;
  text: string;
  value: number;
  /** Font size. */
  size: number;
  /** Center of the word, for `text-anchor="middle"`. */
  x: number;
  y: number;
  /** The estimated box the word was given. */
  box: { x: number; y: number; width: number; height: number };
};

export type WordCloudLayout = {
  /** Largest first. */
  words: PlacedWord[];
  /** How many words found no room, or fell past `maxWords`. */
  dropped: number;
};

/**
 * Place words inside a box. Font size follows the square root of the value,
 * between `minSize` and `maxSize`, so a word's area is what grows with it.
 * Words go largest first onto a spiral from the center, each taking the first
 * spot where its box overlaps no other. A word that finds no room is left
 * out and counted in `dropped`. Width is estimated from the character count,
 * since the layout must also run without a DOM, and nothing is random, so
 * the result is the same on every run.
 */
export function layoutWords(
  words: ReadonlyArray<{ text: string; value: number }>,
  options: WordCloudOptions,
): WordCloudLayout;
