/// <reference types="vite/client" />
import barrel from "../../src/index.js?raw";
import { entries } from "./cases";

const BARREL_EXPORT = /default as (\w+) } from "\.\/(.+\.svelte)"/g;
const FORWARDS_REST_PROPS = /\$\$restProps|splitAriaNaming/;
const FOCUSABLE_OR_ROLE =
  /<button|<input|<select|<textarea|tabindex|role="(?!presentation|none)/;

const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const exported = new Map(
  [...barrel.matchAll(BARREL_EXPORT)].map(([, name, path]) => [
    name,
    sources[`../../src/${path}`],
  ]),
);

/**
 * Components that forward rest props and render something focusable or
 * with a role. Each one must either pass the contract or say why not, so a
 * new component can't skip the check by accident.
 */
const candidates = [...exported]
  .filter(([name, source]) => {
    if (!source || name.endsWith("Skeleton")) return false;
    return FORWARDS_REST_PROPS.test(source) && FOCUSABLE_OR_ROLE.test(source);
  })
  .map(([name]) => name)
  .sort();

describe("aria forwarding coverage", () => {
  const covered = new Set(entries.map((entry) => entry.name));

  it.each(candidates)("%s has a contract case or an exemption", (name) => {
    expect(covered.has(name)).toBe(true);
  });

  it("only lists exported components", () => {
    const unknown = [...covered].filter((name) => !exported.has(name));
    expect(unknown).toEqual([]);
  });
});
