// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Layouts behind the non-Cartesian charts. Each runs once per data or size
// change, never on hover, so the budget is a frame or two at the sizes a
// chart can legibly show, and graceful growth past them.
import { group, task } from "ostia";
import { geoPaths } from "../src/viz/utils/geo-path.js";
import { packCircles } from "../src/viz/utils/pack-circles.js";
import { sankey } from "../src/viz/utils/sankey.js";
import { treeLayout } from "../src/viz/utils/tree-layout.js";
import { squarify } from "../src/viz/utils/treemap.js";
import { layoutWords } from "../src/viz/utils/word-cloud.js";

/** Deterministic values with a long tail, as real category sizes have. */
function values(count: number) {
  return Array.from(
    { length: count },
    (_, i) => 1 + ((i * 7919) % 97) + (i % 11 === 0 ? 400 : 0),
  );
}

group(
  "squarify",
  () => {
    for (const size of [50, 500, 5_000]) {
      const input = values(size);
      task(`${size} cells`, () => squarify(input));
    }
  },
  { gc: true },
);

group(
  "packCircles (cubic by design)",
  () => {
    for (const size of [25, 100, 300]) {
      const input = values(size).map(Math.sqrt);
      task(`${size} circles`, () => packCircles(input, { padding: 2 }));
    }
  },
  { gc: true },
);

group(
  "sankey",
  () => {
    for (const [columns, perColumn] of [
      [4, 6],
      [6, 20],
      [8, 60],
    ]) {
      const links = [];
      for (let c = 0; c < columns - 1; c++) {
        for (let a = 0; a < perColumn; a++) {
          for (let k = 0; k < 3; k++) {
            links.push({
              source: `${c}:${a}`,
              target: `${c + 1}:${(a * 3 + k * 5) % perColumn}`,
              value: 1 + ((a + k * 7) % 13),
            });
          }
        }
      }
      task(`${columns * perColumn} nodes, ${links.length} links`, () =>
        sankey(links, { width: 960, height: 480 }),
      );
    }
  },
  { gc: true },
);

group(
  "treeLayout",
  () => {
    for (const size of [100, 1_000, 10_000]) {
      const rows = Array.from({ length: size }, (_, i) => ({
        id: i,
        parent: i === 0 ? null : Math.floor((i - 1) / 4),
      }));
      task(`${size} nodes`, () =>
        treeLayout(rows, {
          id: (row) => row.id,
          parent: (row) => row.parent,
          width: 960,
          height: 480,
        }),
      );
    }
  },
  { gc: true },
);

group(
  "layoutWords",
  () => {
    for (const size of [25, 100, 250]) {
      const words = values(size).map((value, i) => ({
        text: `term${i}`.padEnd(4 + (i % 7), "x"),
        value,
      }));
      task(`${size} words`, () =>
        layoutWords(words, { width: 960, height: 480, maxWords: size }),
      );
    }
  },
  { gc: true },
);

group(
  "geoPaths",
  () => {
    for (const [features, points] of [
      [50, 200],
      [250, 400],
    ]) {
      const input = Array.from({ length: features }, (_, f) => ({
        id: f,
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            Array.from({ length: points + 1 }, (_, p) => {
              const angle = ((p % points) / points) * Math.PI * 2;
              return [
                (f % 20) * 9 + Math.cos(angle) * 4,
                Math.floor(f / 20) * 5 - 30 + Math.sin(angle) * 2,
              ];
            }),
          ],
        },
      }));
      task(`${features} features x ${points} points`, () =>
        geoPaths(input, { width: 960, height: 480 }),
      );
    }
  },
  { gc: true },
);
