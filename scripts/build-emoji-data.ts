/**
 * Regenerates src/emoji-data/ from Unicode's emoji-test.txt and CLDR's
 * English annotations. The source files are downloaded to a temporary
 * directory and deleted after; only the compact output is committed. Run it
 * after Unicode or CLDR publish a release, and update the URLs in
 * scripts/lib/emoji-data.ts.
 *
 *   bun scripts/build-emoji-data.ts
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { $ } from "bun";
import {
  buildEmojiDataset,
  CLDR_URLS,
  EMOJI_TEST_URL,
  parseAnnotations,
  parseEmojiTest,
  renderEmojiModule,
} from "./lib/emoji-data";

const download = await mkdtemp(join(tmpdir(), "emoji-data-"));

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
}

try {
  const [emojiTest, ...annotations] = await Promise.all([
    fetchText(EMOJI_TEST_URL),
    ...CLDR_URLS.map(fetchText),
  ]);
  await writeFile(join(download, "emoji-test.txt"), emojiTest);

  const keywords = new Map<string, string[]>();
  for (const xml of annotations) {
    // Later files fill in what the first leaves out.
    for (const [glyph, words] of parseAnnotations(xml)) {
      if (!keywords.has(glyph)) keywords.set(glyph, words);
    }
  }

  const all = parseEmojiTest(emojiTest);
  const dataset = buildEmojiDataset(all, keywords);
  const { js, dts } = renderEmojiModule(dataset);

  await mkdir("src/emoji-data", { recursive: true });
  await Bun.write("src/emoji-data/index.js", js);
  await Bun.write("src/emoji-data/index.d.ts", dts);
  await $`bun fmt src/emoji-data && bunx biome check --write src/emoji-data`
    .quiet()
    .nothrow();

  const written = await Bun.file("src/emoji-data/index.js").text();
  console.log(
    `[build-emoji-data] ${dataset.stats.emoji} emoji in ${dataset.groups.length} groups, ` +
      `${dataset.stats.withTones} with skin tones, ` +
      `${dataset.stats.withoutKeywords} with no keywords beyond the name`,
  );
  console.log(
    `[build-emoji-data] src/emoji-data/index.js: ${written.length} B, ${gzipSync(written).length} B gzip`,
  );
} finally {
  await rm(download, { recursive: true, force: true });
}
