// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// graphemeCount backs TextInput/TextArea character counters — called once
// per keystroke against the field's current value. The question is
// paste-a-large-document latency: does the Intl.Segmenter walk stay linear
// out to very large strings, and is a per-keystroke re-count on a big
// document (rather than the delta) already a real cost even before
// considering algorithmic complexity.
import { bench } from "mitata";
import { graphemeCount } from "../src/utils/graphemeCount.js";
import { runWithFilter } from "./run-with-filter.js";

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

// .gc("inner"): the Intl.Segmenter path allocates a SegmentData object per
// grapheme cluster it yields — non-trivial at 100k chars. Cross-checked
// against a plain performance.now() loop before trusting the numbers below.
bench("graphemeCount, $size-char string", function* (state) {
  const size = state.get("size");
  const text = buildText(size);
  yield () => graphemeCount(text);
})
  .range("size", 100, 100_000)
  .gc("inner");

await runWithFilter();
