/// <reference types="vite/client" />
import { cases, exempt, NO_REFERENCE_CHECK } from "./cases";
import { key } from "./contract";

const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const name = (path: string) => path.replace(/^.*\/|\.svelte$/g, "");

const sourceOf = (component: string) =>
  Object.entries(sources).find(([path]) => name(path) === component)?.[1] ?? "";

/** Every `Component.prop` whose prop defaults to an empty array. */
const candidates = Object.entries(sources)
  .flatMap(([path, source]) =>
    [...source.matchAll(/export let (\w+) = \[\];/g)].map(
      ([, prop]) => `${name(path)}.${prop}`,
    ),
  )
  .sort();

const covered = new Set(cases.map(key));

it.each(candidates)("%s has a case or an exemption", (candidate) => {
  expect(covered.has(candidate) || candidate in exempt).toBe(true);
});

it("only exempts props that need it", () => {
  const stale = Object.keys(exempt).filter(
    (candidate) => !candidates.includes(candidate) || covered.has(candidate),
  );
  expect(stale).toEqual([]);
});

/**
 * A `prev`, `stable`, or `cached` copy of the prop, or the prop compared by
 * reference to another variable. `!== undefined` and `!== null` don't count.
 */
const referenceCheck = (prop: string) => {
  const Prop = prop[0].toUpperCase() + prop.slice(1);
  const other = "(?!undefined\\b|null\\b)[A-Za-z_$]";
  return new RegExp(
    [
      `\\b(prev|stable|cached)${Prop}\\b`,
      `(?<![.\\w$])${prop}\\s*[!=]==\\s*${other}`,
      `[!=]==\\s*${prop}\\b`,
    ].join("|"),
  );
};

const unchecked = Object.keys(exempt).filter(
  (candidate) => exempt[candidate] === NO_REFERENCE_CHECK,
);

it.each(unchecked)("%s still has no reference check", (candidate) => {
  const [component, prop] = candidate.split(".");
  expect(sourceOf(component)).not.toMatch(referenceCheck(prop));
});
