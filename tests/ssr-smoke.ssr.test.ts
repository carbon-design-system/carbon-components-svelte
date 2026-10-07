// @vitest-environment node
/// <reference types="vite/client" />
import { JSDOM } from "jsdom";
import type { ComponentType, SvelteComponent } from "svelte";
import { render } from "svelte/server";
import barrel from "../src/index.js?raw";
import { RANDOM_ID, renderSSR } from "./utils/ssr";

const BARREL_EXPORT = /default as (\w+) } from "\.\/(.+\.svelte)"/g;
const OPEN_PROP = /export let open\b/;
const BAD_VALUE = /\bundefined\b|\[object Object\]|\bNaN\b/;

const modules = import.meta.glob<ComponentType<SvelteComponent>>(
  "../src/**/*.svelte",
  { import: "default" },
);
const sources = import.meta.glob<string>("../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * Children that read their parent's context during init and throw without
 * it, on the client as much as on the server. Render them through a parent
 * fixture instead, as `tests/Menu/Menu.ssr.test.ts` does.
 */
const NEEDS_PARENT = new Set([
  "AccordionItem", // Accordion
  "BreadcrumbItem", // Breadcrumb
  "ContextMenuOption", // ContextMenu
  "DatePickerInput", // DatePicker
  "InterstitialScreenBody", // InterstitialScreen
  "InterstitialScreenFooter", // InterstitialScreen
  "InterstitialScreenHeader", // InterstitialScreen
  "MenuItem", // Menu
  "ModalFooter", // ComposedModal
  "ModalHeader", // ComposedModal
  "OverflowMenuItem", // OverflowMenu
  "SearchMenuGroup", // SearchMenu
  "SearchMenuItem", // SearchMenu
  "SelectItem", // Select or TimePickerSelect
  "Switch", // ContentSwitcher
  "SwitchPanel", // ContentSwitcher
  "Tab", // Tabs or TabsVertical
  "TabContent", // Tabs or TabsVertical
  "ToolbarMenuItem", // ToolbarMenu
]);

/**
 * Props that pin a component's generated ids, beyond the `id` every
 * component gets. Each id a component renders must come from a prop.
 */
const ID_PROPS: Record<string, Record<string, string>> = {
  Tooltip: { tooltipId: "fixed-tooltip", triggerId: "fixed-trigger" },
};

const components = [...barrel.matchAll(BARREL_EXPORT)].map(([, name, file]) => {
  const path = `../src/${file}`;
  return { name, path, open: OPEN_PROP.test(sources[path] ?? "") };
});

/** Attribute values and text that a missing or wrong prop renders. */
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

it("reads every component from the barrel", () => {
  expect(components.length).toBeGreaterThan(200);
  for (const { path } of components) expect(modules).toHaveProperty([path]);
});

it("flags undefined, [object Object], and NaN", () => {
  const { document } = new JSDOM(
    '<p title="undefined">NaN</p><span class="[object Object]"></span>',
  ).window;

  expect(findBadValues(document)).toEqual([
    '<p title="undefined">',
    '<span class="[object Object]">',
    'text "NaN"',
  ]);
});

describe.each(components)("$name", ({ name, path, open }) => {
  const load = () => {
    const loadModule = modules[path];
    assert(loadModule);
    return loadModule();
  };

  if (NEEDS_PARENT.has(name)) {
    it("still needs a parent to render", async () => {
      const component = await load();

      expect(() => renderSSR(component)).toThrow();
    });
    return;
  }

  it("renders with default props", async () => {
    const { document } = renderSSR(await load());

    expect(findBadValues(document)).toEqual([]);
  });

  if (open) {
    it("renders open", async () => {
      const { document } = renderSSR(await load(), { open: true });

      expect(findBadValues(document)).toEqual([]);
    });
  }

  // Raw output, so a random id is not normalized away.
  it.each(open ? [false, true] : [false])(
    "renders no random ids for an explicit id (open: %s)",
    async (isOpen) => {
      const component = await load();
      const props = {
        id: "fixed",
        ...ID_PROPS[name],
        open: isOpen || undefined,
      };
      const html = render(component, { props }).body;

      expect(html.match(RANDOM_ID)).toBeNull();
      expect(render(component, { props }).body).toBe(html);
    },
  );
});
