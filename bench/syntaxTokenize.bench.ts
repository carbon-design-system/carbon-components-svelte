// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// The `carbon-components-svelte/syntax` tokenizer is a single pass: each
// position tries only the rules whose pattern can start with its character,
// and CSS statements are scanned ahead once each. Time should grow linearly
// with input size; a superlinear step between sizes means a rule started
// rescanning (a lookbehind over all prior tokens, a lookahead to the end).
import { readFileSync } from "node:fs";
import { group, range, task } from "ostia";
import { highlight, tokenize } from "../src/syntax/tokenize.js";

const component = readFileSync("src/DataTable/DataTable.svelte", "utf8");
const script = readFileSync("src/syntax/tokenize.js", "utf8");
const styles = readFileSync("css/_popover.scss", "utf8");

group("tokenize a Svelte component, repeated", () => {
  for (const copies of range(1, 16)) {
    const code = Array(copies).fill(component).join("\n");
    task(`${copies}x DataTable.svelte`, () => tokenize(code, "svelte"));
  }
});

group("tokenize by language", () => {
  task("svelte (DataTable.svelte)", () => tokenize(component, "svelte"));
  task("js (tokenize.js)", () => tokenize(script, "js"));
  task("scss (_popover.scss)", () => tokenize(styles, "scss"));
});

group("highlight to HTML spans", () => {
  task("svelte (DataTable.svelte)", () => highlight(component, "svelte"));
});
