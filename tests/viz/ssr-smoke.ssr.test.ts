// @vitest-environment node
/// <reference types="vite/client" />
import { JSDOM } from "jsdom";
import type { ComponentType, SvelteComponent } from "svelte";
import { render } from "svelte/server";
import barrel from "../../src/viz/index.js?raw";
import { stripHydrationMarkers } from "../utils/ssr";

// Every chart renders on the server with default props, and twice the same.
// Charts built on `Chart` take an `id`, under which every id they write is
// fixed; the rest count ids from a module counter, which this normalizes.

const BARREL_EXPORT = /default as (\w+) } from "\.\/(.+\.svelte)"/g;
const BAD_VALUE = /\bundefined\b|\[object Object\]|\bNaN\b/;
const COUNTED_ID = /bx-viz(?:-[a-z]+)*-\d+/g;
const WHITESPACE_BETWEEN_TAGS = />\s+</g;

const modules = import.meta.glob<ComponentType<SvelteComponent>>(
  "../../src/viz/**/*.svelte",
  { import: "default" },
);
const sources = import.meta.glob<string>("../../src/viz/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const components = [...barrel.matchAll(BARREL_EXPORT)].map(([, name, file]) => {
  const path = `../../src/viz/${file}`;
  const source = sources[path] ?? "";
  // A preset forwards `id` to `Chart`; a mark needs a `Chart` around it.
  return {
    name,
    path,
    onChart: /<Chart\b/.test(source) || name === "Chart",
    isMark: /getContext\(CHART_CONTEXT\)/.test(source) && name !== "Chart",
  };
});

function findBadValues(document: Document) {
  const found: string[] = [];
  for (const element of document.body.querySelectorAll("*")) {
    for (const { name, value } of element.attributes) {
      if (BAD_VALUE.test(value)) {
        found.push(`<${element.localName} ${name}="${value}">`);
      }
    }
  }
  const text = document.body.textContent ?? "";
  if (BAD_VALUE.test(text)) found.push(`text "${text.trim()}"`);
  return found;
}

function normalize(html: string) {
  const ids = new Map<string, string>();
  return stripHydrationMarkers(html)
    .replace(COUNTED_ID, (id) => {
      let stable = ids.get(id);
      if (stable === undefined) {
        stable = `id-${ids.size + 1}`;
        ids.set(id, stable);
      }
      return stable;
    })
    .replace(WHITESPACE_BETWEEN_TAGS, "><")
    .trim();
}

it("reads every chart from the viz barrel", () => {
  expect(components.length).toBeGreaterThan(100);
  for (const { path } of components) expect(modules).toHaveProperty([path]);
});

describe.each(components.filter((c) => !c.isMark))(
  "$name",
  ({ name, path, onChart }) => {
    const load = () => {
      const loadModule = modules[path];
      assert(loadModule);
      return loadModule();
    };

    it("renders with default props, twice the same", async () => {
      const component = await load();
      const first = render(component, { props: {} }).body;
      const second = render(component, { props: {} }).body;
      const { document } = new JSDOM(first).window;

      expect(findBadValues(document)).toEqual([]);
      expect(normalize(second)).toBe(normalize(first));
    });

    if (onChart) {
      it("writes no counted ids under an explicit id", async () => {
        const component = await load();
        const props = { id: `fixed-${name}` };
        const html = stripHydrationMarkers(render(component, { props }).body);

        expect(html.match(COUNTED_ID)).toBeNull();
        expect(stripHydrationMarkers(render(component, { props }).body)).toBe(
          html,
        );
      });
    }
  },
);
