// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "acorn";

// The calendar ships as unbundled source, so whatever it uses reaches users
// as written. Keep it inside the Svelte 5 browser baseline the CSS targets
// (Firefox 83, Safari 14). `test:src-js` checks the .js files against the
// ES2021 library; this covers what it can't see: syntax, browser APIs, and
// the scripts of .svelte files.

// @depends-on src/DatePicker/*
const DIR = join(import.meta.dirname, "../../src/DatePicker");
const files = (extension: string) =>
  readdirSync(DIR)
    .filter((file) => file.endsWith(extension) && !file.endsWith(".d.ts"))
    .map((file) => [file, readFileSync(join(DIR, file), "utf8")] as const);

/** Browser APIs (outside the ES library) -> first Firefox / Safari with them. */
const NEWER_BROWSER_APIS: Array<[RegExp, string]> = [
  [/structuredClone\(/, "structuredClone: Firefox 94, Safari 15.4"],
  [
    /AbortSignal\.(any|timeout)\(/,
    "AbortSignal.any/timeout: Firefox 124, Safari 17.4",
  ],
  [/\bsignal\s*[:,}]/, "addEventListener `signal`: Safari 15"],
];

/** ES2022+ APIs, for the .svelte scripts `test:src-js` doesn't check. */
const NEWER_ES_APIS: Array<[RegExp, string]> = [
  [/\.at\(/, "Array/String#at: Firefox 90, Safari 15.4"],
  [/Object\.hasOwn\(/, "Object.hasOwn: Firefox 92, Safari 15.4"],
  [/\.findLast(Index)?\(/, "Array#findLast: Firefox 104, Safari 15.4"],
  [
    /\.to(Sorted|Reversed|Spliced)\(/,
    "change-array-by-copy: Firefox 115, Safari 16",
  ],
  [/Promise\.withResolvers/, "Promise.withResolvers: Firefox 121, Safari 17.4"],
];

const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;

describe("DatePicker stays inside the browser baseline", () => {
  it.each(files(".js"))("%s parses as ES2021", (_, source) => {
    expect(() =>
      parse(source, { ecmaVersion: 2021, sourceType: "module" }),
    ).not.toThrow();
  });

  const newerApis = (source: string, apis: Array<[RegExp, string]>) => {
    const code = source.replace(COMMENTS, "");
    return apis.filter(([pattern]) => pattern.test(code)).map(([, api]) => api);
  };

  it.each(files(".js"))("%s uses no newer browser API", (_, source) => {
    expect(newerApis(source, NEWER_BROWSER_APIS)).toEqual([]);
  });

  it.each(files(".svelte"))("%s uses no newer API", (_, source) => {
    expect(
      newerApis(source, [...NEWER_BROWSER_APIS, ...NEWER_ES_APIS]),
    ).toEqual([]);
  });
});
