// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "acorn";

// The calendar ships as unbundled source, so whatever it uses reaches users
// as written. Keep it inside the browser baseline (Chrome 124, Firefox 125,
// Safari 17.4). `test:src-svelte` checks the .js files against the ES2023
// library; this covers what it can't see: syntax, browser APIs, and the
// scripts of .svelte files.

// @depends-on src/DatePicker/*
const DIR = join(import.meta.dirname, "../../src/DatePicker");
const files = (extension: string) =>
  readdirSync(DIR)
    .filter((file) => file.endsWith(extension) && !file.endsWith(".d.ts"))
    .map((file) => [file, readFileSync(join(DIR, file), "utf8")] as const);

/** Browser APIs (outside the ES library) -> first Firefox / Safari with them. */
const NEWER_BROWSER_APIS: Array<[RegExp, string]> = [
  [/startViewTransition\(/, "View Transitions: Safari 18"],
];

/** ES2024+ APIs, for the .svelte scripts `test:src-svelte` doesn't check. */
const NEWER_ES_APIS: Array<[RegExp, string]> = [
  [
    /\.(union|intersection|difference|symmetricDifference)\(/,
    "Set methods: Firefox 127",
  ],
  [/Promise\.try\(/, "Promise.try: Firefox 134, Safari 18.2"],
  [/\.(toArray|drop|take)\(\)/, "Iterator helpers: Firefox 131, Safari 18.4"],
];

const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;

describe("DatePicker stays inside the browser baseline", () => {
  it.each(files(".js"))("%s parses as ES2023", (_, source) => {
    expect(() =>
      parse(source, { ecmaVersion: 2023, sourceType: "module" }),
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
