// @vitest-environment node
/// <reference types="vite/client" />
import type { ComponentType, SvelteComponent } from "svelte";
import barrel from "../../src/index.js?raw";
import { RANDOM_ID, renderRaw } from "../utils/ssr";
import Families from "./Families.test.svelte";
import Scoped from "./Scoped.test.svelte";

/** Attributes that carry an id or point at one. */
const ID_ATTRIBUTE = /\s(id|for|name|form|list|aria-[a-z]+)="([^"]*)"/g;

const idAttributes = (html: string) =>
  [...html.matchAll(ID_ATTRIBUTE)].map(([, name, value]) => `${name}=${value}`);

/** Every compound component the sweep renders with an `id` on the root. */
const FAMILIES = [
  "Tabs",
  "TabsVertical",
  "Accordion",
  "ContentSwitcher",
  "ProgressIndicator",
  "Stepper",
  "CheckboxGroup",
  "RadioButtonGroup",
  "TileGroup",
  "OverflowMenu",
  "DataTable",
  "DatePicker",
  "TimePicker",
  "TagSet",
  "TreeView",
  "FileUploader",
  "Dropdown",
  "ComboBox",
  "MultiSelect",
  "Select",
  "StructuredList",
  "Pagination",
  "Tooltip",
];

describe("an explicit id on the root", () => {
  it.each(FAMILIES)(
    "%s renders no random id and the same ids twice",
    (family) => {
      const html = renderRaw(Families, { family });

      expect(html.match(RANDOM_ID)).toBeNull();
      expect(idAttributes(html).length).toBeGreaterThan(0);
      expect(renderRaw(Families, { family })).toBe(html);
    },
  );
});

const modules = import.meta.glob<ComponentType<SvelteComponent>>(
  "../../src/**/*.svelte",
  { import: "default" },
);
const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const components = [
  ...barrel.matchAll(/default as (\w+) } from "\.\/(.+\.svelte)"/g),
].map(([, name, file]) => ({
  name,
  path: `../../src/${file}`,
  open: /export let open\b/.test(sources[`../../src/${file}`] ?? ""),
}));

describe("a root scope around a component with no id", () => {
  it.each(components)(
    "$name renders no random id and the same ids twice",
    async ({ path, open }) => {
      const loadModule = modules[path];
      assert(loadModule);
      const component = await loadModule();

      for (const props of open ? [{}, { open: true }] : [{}]) {
        let html: string;
        try {
          html = renderRaw(Scoped, { component, props });
        } catch {
          // A child that needs its parent throws without one, in a scope or not
          // (`NEEDS_PARENT` in ssr-smoke.ssr.test.ts).
          return;
        }

        expect(html.match(RANDOM_ID)).toBeNull();
        expect(idAttributes(renderRaw(Scoped, { component, props }))).toEqual(
          idAttributes(html),
        );
      }
    },
  );
});
