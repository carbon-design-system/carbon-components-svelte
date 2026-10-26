/// <reference types="vite/client" />

import devtoolsBarrel from "../../src/devtools/index.js?raw";
import barrel from "../../src/index.js?raw";
import { entries } from "./cases";

const BARREL_EXPORT = /default as (\w+) } from "\.\/(.+\.svelte)"/g;
const SVELTE_IMPORT = /import \w+ from "(\.{1,2}\/[^"]+\.svelte)"/g;
const FORWARDS_REST_PROPS = /\$\$restProps|splitAriaNaming/;
// Elements that take focus or carry a role, written out or implicit.
const FOCUSABLE_OR_ROLE =
  /<(button|input|select|textarea|fieldset|dialog|details|summary)\b|<a\s|tabindex|contenteditable|role="(?!presentation|none)/;

const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Resolve a relative `.svelte` import from one source path to another. */
const resolve = (from: string, spec: string) => {
  const parts = from.split("/").slice(0, -1);
  for (const segment of spec.split("/")) {
    if (segment === "..") parts.pop();
    else if (segment !== ".") parts.push(segment);
  }
  return parts.join("/");
};

/**
 * Sources that render something focusable or with a role, either in their
 * own markup or through a component they import, like a `Button` or `Link`.
 */
const interactive = new Set(
  Object.keys(sources).filter((path) => FOCUSABLE_OR_ROLE.test(sources[path])),
);
for (let grew = true; grew;) {
  grew = false;
  for (const [path, source] of Object.entries(sources)) {
    if (interactive.has(path) || path.includes("Skeleton")) continue;
    for (const [, spec] of source.matchAll(SVELTE_IMPORT)) {
      if (interactive.has(resolve(path, spec))) {
        interactive.add(path);
        grew = true;
        break;
      }
    }
  }
}

// The main entry and the `devtools` subpath entry, each relative to its
// own folder.
const exported = new Map([
  ...[...barrel.matchAll(BARREL_EXPORT)].map(
    ([, name, path]) => [name, `../../src/${path}`] as const,
  ),
  ...[...devtoolsBarrel.matchAll(BARREL_EXPORT)].map(
    ([, name, path]) => [name, `../../src/devtools/${path}`] as const,
  ),
]);

/**
 * Components that forward rest props and render something focusable or
 * with a role. Each one must either pass the contract or say why not, so a
 * new component can't skip the check by accident.
 */
const candidates = [...exported]
  .filter(([name, path]) => {
    if (!sources[path] || name.endsWith("Skeleton")) return false;
    return FORWARDS_REST_PROPS.test(sources[path]) && interactive.has(path);
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
