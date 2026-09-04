// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// fuzzyMatch backs SearchMenu/HeaderSearch filtering — called once per item,
// once per keystroke. The realistic cost that matters is filtering a whole
// list on one keystroke, not a single fuzzyMatch() call in isolation.
import { group, range, task } from "ostia";
import { fuzzyMatch } from "../src/utils/fuzzyMatch.js";

// A mix of items that resolve via each of fuzzyMatch's two internal paths:
// a contiguous-substring hit (cheap, single indexOf pass) and a scattered
// subsequence hit (both passes run — substring scan fails first, then
// subsequence scan succeeds), plus non-matches (both passes run and fail).
function buildItems(count: number): string[] {
  const items: string[] = [];
  for (let i = 0; i < count; i++) {
    const mod = i % 3;
    if (mod === 0) items.push(`Settings > Notifications > Email Digest ${i}`);
    else if (mod === 1) items.push(`Sxettxinxgxs Exmxaxixl Dxixgxexsxt ${i}`);
    else items.push(`Unrelated menu entry number ${i}`);
  }
  return items;
}

group("fuzzyMatch, filter items, one keystroke", () => {
  for (const size of range(100, 10_000)) {
    const items = buildItems(size);
    task(`${size} items`, () =>
      items.filter((text) => fuzzyMatch(text, "settings email").matched),
    );
  }
});
