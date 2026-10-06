// @depends-on src/**/*.svelte
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FORM_CONTEXT_KEY,
  MODAL_CONTEXT_KEY,
  PROFILE_MENU_CONTEXT_KEY,
} from "carbon-components-svelte/constants/context-keys.js";

const SRC_DIR = join(__dirname, "../../src");

const SOURCES = readdirSync(SRC_DIR, { recursive: true, encoding: "utf8" })
  .filter((name) => name.endsWith(".svelte"))
  .map((name) => ({
    file: name,
    source: readFileSync(join(SRC_DIR, name), "utf8"),
  }));

const CONTEXT_CALL = /\b(?:get|set)Context\(\s*([^\s,)]+)/g;

describe("context keys", () => {
  // `carbon-preprocess-svelte` only resolves a literal key, which lets it
  // treat a context no rendered component provides as `undefined`.
  test("components pass string literal keys", () => {
    const calls = SOURCES.flatMap(({ file, source }) =>
      [...source.matchAll(CONTEXT_CALL)].map((match) => ({
        file,
        key: match[1],
      })),
    );

    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter(({ key }) => !/^"carbon:\w+"$/.test(key))).toEqual([]);
  });

  test("exported keys match the literals components use", () => {
    const literals = new Set(
      SOURCES.flatMap(({ source }) =>
        [...source.matchAll(CONTEXT_CALL)].map((match) =>
          match[1].slice(1, -1),
        ),
      ),
    );

    for (const key of [
      FORM_CONTEXT_KEY,
      MODAL_CONTEXT_KEY,
      PROFILE_MENU_CONTEXT_KEY,
    ]) {
      expect(literals).toContain(key);
    }
  });
});
