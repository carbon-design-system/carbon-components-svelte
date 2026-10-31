// @ts-check
// Word cloud layout: larger words first, each on the first free spot of a
// spiral out from the center.

/**
 * Width of a word relative to its font size. Text cannot be measured without
 * a DOM, and the layout has to run on the server too, so it is estimated from
 * the character count. A little generous, so neighbors never touch.
 */
const GLYPH_RATIO = 0.62;

/**
 * Place words inside a box. Font size follows the square root of the value,
 * between `minSize` and `maxSize`, so a word's area is what grows with it.
 * Words go largest first onto an Archimedean spiral from the center, each
 * taking the first spot where its box overlaps no other. A word that finds no
 * room is left out and counted in `dropped`. The result is the same on every
 * run: nothing is random.
 *
 * @param {ReadonlyArray<{ text: string; value: number }>} words
 * @param {import("./word-cloud.d.ts").WordCloudOptions} options
 * @returns {import("./word-cloud.d.ts").WordCloudLayout}
 */
export function layoutWords(words, options) {
  const {
    width,
    height,
    minSize = 12,
    maxSize = 56,
    padding = 2,
    maxWords = 100,
  } = options;

  /** @type {Array<{ index: number; text: string; value: number }>} */
  const kept = [];
  for (let i = 0; i < words.length; i++) {
    const { text, value } = words[i];
    if (!text || !Number.isFinite(value) || value <= 0) continue;
    kept.push({ index: i, text, value });
  }
  kept.sort((a, b) => b.value - a.value || a.index - b.index);
  const candidates = kept.slice(0, Math.max(maxWords, 0));
  if (candidates.length === 0) return { words: [], dropped: kept.length };

  const high = Math.sqrt(candidates[0].value);
  const low = Math.sqrt(candidates[candidates.length - 1].value);
  const cx = width / 2;
  const cy = height / 2;
  // The spiral is wider than tall, like the box, so the cloud fills it.
  const stretch = height > 0 ? width / height : 1;

  /** @type {import("./word-cloud.d.ts").PlacedWord[]} */
  const placed = [];
  let dropped = kept.length - candidates.length;
  for (const word of candidates) {
    const t = high > low ? (Math.sqrt(word.value) - low) / (high - low) : 1;
    const size = Math.round(minSize + (maxSize - minSize) * t);
    const w = word.text.length * size * GLYPH_RATIO + padding * 2;
    const h = size * 1.1 + padding * 2;

    let spot = null;
    // Step along the spiral in arcs of roughly constant length.
    for (let angle = 0, turns = 0; turns < 4000; turns++) {
      const radius = 1.5 * angle;
      const x = cx + radius * Math.cos(angle) * stretch - w / 2;
      const y = cy + radius * Math.sin(angle) - h / 2;
      angle += radius > 8 ? 8 / radius : 0.5;
      if (x < 0 || y < 0 || x + w > width || y + h > height) {
        // Past every edge at once means the spiral has left the box.
        if (radius > Math.hypot(width, height)) break;
        continue;
      }
      let free = true;
      for (const other of placed) {
        if (
          x < other.box.x + other.box.width &&
          x + w > other.box.x &&
          y < other.box.y + other.box.height &&
          y + h > other.box.y
        ) {
          free = false;
          break;
        }
      }
      if (free) {
        spot = { x, y };
        break;
      }
    }
    if (!spot) {
      dropped++;
      continue;
    }
    placed.push({
      index: word.index,
      text: word.text,
      value: word.value,
      size,
      x: Math.round((spot.x + w / 2) * 10) / 10,
      y: Math.round((spot.y + h / 2) * 10) / 10,
      box: { x: spot.x, y: spot.y, width: w, height: h },
    });
  }
  return { words: placed, dropped };
}
