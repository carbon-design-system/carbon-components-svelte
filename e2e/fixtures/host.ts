import type { Component } from "svelte";
import { flushSync, mount, unmount } from "svelte";
import "carbon-components-svelte/css/all.css";
// A stylesheet belongs to the first fixture that loads it, and is off while
// any other fixture is mounted. Two fixtures import prose.css, so the second
// one lost it. Load it here, for every fixture; it only styles `.bx--prose`.
import "carbon-components-svelte/css/prose.css";

/**
 * One page per Playwright worker that swaps fixtures in place, so a test
 * skips the navigation, stylesheet parse and Svelte boot a fresh page costs.
 * e2e/helpers/host.ts routes a test's navigation to `/<fixture>.html` here.
 */

// A lookup table, not a dependency of every test: each test's own
// navigation names the fixture it renders.
// @glob-registry
const fixtures = import.meta.glob<{ default: Component }>("./*Fixture.svelte");

const bodyChildren = new Set(document.body.children);
const headChildren = new Set(document.head.children);
const htmlAttributes = snapshotAttributes(document.documentElement);
const bodyAttributes = snapshotAttributes(document.body);

/** Stylesheets each fixture brought in, so only the mounted one applies. */
const fixtureStyles = new Map<string, Element[]>();

let current: Record<string, unknown> | undefined;

function snapshotAttributes(el: Element) {
  return [...el.attributes].map(({ name, value }) => [name, value] as const);
}

function restoreAttributes(
  el: Element,
  attributes: (readonly [string, string])[],
) {
  for (const { name } of [...el.attributes]) el.removeAttribute(name);
  for (const [name, value] of attributes) el.setAttribute(name, value);
}

function styleNodes() {
  return new Set(document.head.querySelectorAll("style, link[rel=stylesheet]"));
}

/** Unmounts the fixture and drops what it left on the page. */
function clear() {
  if (current) unmount(current);
  current = undefined;

  // Portals and floating menus render outside #app; drop what a fixture left.
  for (const el of [...document.body.children])
    if (!bodyChildren.has(el)) el.remove();
  // Tags a test added with `page.addStyleTag` and the like. Fixture styles
  // stay, since a module loads them only once.
  const owned = new Set([...fixtureStyles.values()].flat());
  for (const el of [...document.head.children])
    if (!headChildren.has(el) && !owned.has(el)) el.remove();
  restoreAttributes(document.documentElement, htmlAttributes);
  restoreAttributes(document.body, bodyAttributes);
  (document.activeElement as HTMLElement | null)?.blur();
  window.scrollTo(0, 0);
}

async function mountFixture(name: string, search: string, keepStorage = false) {
  clear();
  // A reload keeps storage, which the storage and theme tests rely on.
  if (!keepStorage) {
    localStorage.clear();
    sessionStorage.clear();
  }
  // Fixtures read flags such as `?optimizeFastScroll` from the URL.
  history.replaceState(null, "", `/host.html${search}`);

  const load = fixtures[`./${name}.svelte`];
  if (!load) throw new Error(`No fixture ${name}`);
  const before = styleNodes();
  const { default: Fixture } = await load();
  if (!fixtureStyles.has(name))
    fixtureStyles.set(
      name,
      [...styleNodes()].filter((node) => !before.has(node)),
    );
  for (const [owner, nodes] of fixtureStyles)
    for (const node of nodes)
      (node as HTMLStyleElement | HTMLLinkElement).media =
        owner === name ? "" : "not all";

  const app = document.getElementById("app");
  if (!app) throw new Error("No #app");
  app.replaceChildren();
  current = mount(Fixture, { target: app });
  flushSync();
}

declare global {
  interface Window {
    __host: { mount: typeof mountFixture; clear: typeof clear };
  }
}

window.__host = { mount: mountFixture, clear };
