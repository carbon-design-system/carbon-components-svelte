// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// graphemeCount backs TextInput/TextArea character counters — called once
// per keystroke against the field's current value. The question is
// paste-a-large-document latency: does the Intl.Segmenter walk stay linear
// out to very large strings, and is a per-keystroke re-count on a big
// document (rather than the delta) already a real cost even before
// considering algorithmic complexity.
import { group, range, task } from "ostia";
import { graphemeCount } from "../src/utils/graphemeCount.js";

// Mixed ASCII + multi-code-point emoji (each emoji is 1 grapheme cluster
// but 2+ UTF-16 code units) so the count differs meaningfully from
// value.length, not just a sanity check on ASCII throughput.
function buildText(length: number): string {
  const words = [
    "The quick brown fox jumps over the lazy dog. ",
    "\u{1F600}\u{1F44D}\u{1F30D} ", // multi-code-point emoji
  ];
  let text = "";
  let i = 0;
  while (text.length < length) {
    text += words[i % words.length];
    i++;
  }
  return text.slice(0, length);
}

// `{ gc: true }` forces `Bun.gc(true)` between trials — mitata's per-bench
// `.gc("inner")` equivalent (see CONTRIBUTING.md). The Intl.Segmenter path
// allocates a SegmentData object per grapheme cluster it yields —
// non-trivial at 100k chars. Cross-checked against a plain performance.now()
// loop before trusting the numbers below.
group(
  "graphemeCount",
  () => {
    for (const size of range(100, 100_000)) {
      const text = buildText(size);
      task(`${size}-char string`, () => graphemeCount(text));
    }
  },
  { gc: true },
);
