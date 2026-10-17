/// <reference types="vite/client" />
import { cases, exempt } from "./cases";
import type { Exemptions, FieldCase } from "./contract";

const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const name = (path: string) => path.replace(/^.*\/|\.svelte$/g, "");

/** Components whose source matches `pattern`, by file name. */
const matching = (pattern: RegExp) =>
  Object.keys(sources)
    .filter((path) => pattern.test(sources[path]))
    .map(name)
    .sort();

const skeletonOwners = Object.keys(sources)
  .map(name)
  .filter((file) => /^Fluid\w+Skeleton$/.test(file))
  .map((file) => file.replace(/^Fluid|Skeleton$/g, ""))
  .sort();

const contracts: [keyof Exemptions, keyof FieldCase, string[]][] = [
  ["fluid", "fluid", matching(/export let fluid\b/)],
  ["state", "state", matching(/export let warnText\b/)],
  [
    "selectOnFocus",
    "selectOnFocus",
    matching(/export let selectTextOnFocus\b/),
  ],
  ["fluidSkeleton", "fluidSkeleton", skeletonOwners],
];

describe.each(contracts)("%s coverage", (contract, key, candidates) => {
  const covered = new Set(cases.filter((c) => c[key]).map((c) => c.name));

  it.each(candidates)("%s has a case or an exemption", (component) => {
    expect(covered.has(component) || component in exempt[contract]).toBe(true);
  });

  it("only exempts components that need it", () => {
    const stale = Object.keys(exempt[contract]).filter(
      (component) => !candidates.includes(component) || covered.has(component),
    );
    expect(stale).toEqual([]);
  });
});
