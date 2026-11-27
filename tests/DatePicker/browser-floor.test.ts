// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "acorn";

// The calendar ships as unbundled source, so whatever it uses reaches users
// as written. Keep it inside the browser baseline (Chrome 105, Firefox 121,
// Safari 15.4). `test:src-svelte` checks the .js files against the ES2022
// library; this covers what it can't see: syntax, browser APIs, and the
// scripts of .svelte files. The syntax stays ES2021: ES2022's class static
// blocks need Safari 16.4.

// @depends-on src/DatePicker/*
const DIR = join(import.meta.dirname, "../../src/DatePicker");
const files = (extension: string) =>
  readdirSync(DIR)
    .filter((file) => file.endsWith(extension) && !file.endsWith(".d.ts"))
    .map((file) => [file, readFileSync(join(DIR, file), "utf8")] as const);

/** Browser APIs (outside the ES library) -> first Firefox / Safari with them. */
const NEWER_BROWSER_APIS: Array<[RegExp, string]> = [
  [
    /AbortSignal\.(any|timeout)\(/,
    "AbortSignal.any/timeout: Chrome 124, Firefox 124, Safari 17.4",
  ],
  [/startViewTransition\(/, "View Transitions: Firefox 144, Safari 18"],
];

/** ES2023+ APIs newer than the baseline, for the .svelte scripts. */
const NEWER_ES_APIS: Array<[RegExp, string]> = [
  [
    /\.to(Sorted|Reversed|Spliced)\(/,
    "change-array-by-copy: Chrome 110, Firefox 115, Safari 16",
  ],
  [/Promise\.withResolvers/, "Promise.withResolvers: Chrome 119, Safari 17.4"],
  [/(Object|Map)\.groupBy\(/, "Object.groupBy: Chrome 117, Safari 17.4"],
  [
    /\.(union|intersection|difference|symmetricDifference)\(/,
    "Set methods: Chrome 122, Firefox 127, Safari 17",
  ],
  [/Promise\.try\(/, "Promise.try: Firefox 134, Safari 18.2"],
  [/\.(toArray|drop|take)\(\)/, "Iterator helpers: Firefox 131, Safari 18.4"],
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
