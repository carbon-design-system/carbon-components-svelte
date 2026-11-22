// @vitest-environment node
// @depends-on src/**

// A parent whose children draw ids with `useId` and read its context must
// start an id scope, or an `id` on the parent leaves the children's ids
// random. Nothing else enforces the opt-in: the family sweeps only cover the
// families listed in `families.ts`.
const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Parents that need no scope of their own, and why. */
const EXEMPT: Record<string, string> = {
  // Ambient context: the children are independent controls, not parts of
  // one component. A root scope covers them.
  "AILabel/Decorator": "ambient",
  "ComposedModal/ComposedModal": "ambient",
  "FluidForm/FluidForm": "ambient",
  "Form/Form": "ambient",
  "Heading/Section": "ambient",
  "InputGroup/InputGroup": "ambient",
  "Modal/Modal": "ambient",
  "SidePanel/SidePanel": "ambient",
  // Groups that only render inside a parent that starts the scope.
  "ContextMenu/ContextMenuGroup": "inside ContextMenu",
  "ContextMenu/ContextMenuRadioGroup": "inside ContextMenu",
  "Menu/MenuItemGroup": "inside Menu",
  "Menu/MenuItemRadioGroup": "inside Menu",
  "SearchMenu/SearchMenuGroup": "inside SearchMenu or HeaderSearch",
  // The OverflowMenu that reads this context starts its own scope.
  "Breadcrumb/BreadcrumbItem": "child scopes itself",
  // MultiSelect passes its own id to the field it renders.
  "MultiSelect/MultiSelect": "passes its id",
  // Toasts are pushed in the browser, never rendered on the server.
  "Notification/NotificationQueue": "browser only",
  // Re-provides the header's Tabs context; panels take the claimed tab's id.
  "PageHeader/PageHeaderBody": "ids come from Tabs",
};

const CONTEXT_KEY = String.raw`([A-Z][A-Z0-9_]*|"carbon:[^"]+")`;
const SET = new RegExp(String.raw`setContext\(\s*${CONTEXT_KEY}`, "g");
const GET = new RegExp(String.raw`getContext\(\s*${CONTEXT_KEY}`, "g");
const FILE = /\.\.\/\.\.\/src\/(.+)\.svelte$/;

const files = Object.entries(sources).map(([path, source]) => ({
  name: path.replace(FILE, "$1"),
  source,
  sets: new Set([...source.matchAll(SET)].map(([, key]) => key)),
  gets: new Set([...source.matchAll(GET)].map(([, key]) => key)),
}));

const parents = files.filter(({ sets }) => sets.size > 0);

describe("a parent whose children draw ids", () => {
  it.each(parents.map(({ name }) => ({ name })))(
    "$name starts an id scope or is exempt",
    ({ name }) => {
      const parent = files.find((file) => file.name === name);
      assert(parent);
      const children = files
        .filter(
          (file) =>
            file !== parent &&
            file.source.includes("useId(") &&
            [...parent.sets].some((key) => file.gets.has(key)),
        )
        .map((file) => file.name);
      if (children.length === 0 || name in EXEMPT) return;
      expect(
        parent.source.includes("createIdScope("),
        `${name} provides context to ${children.join(", ")}, which call useId`,
      ).toBe(true);
    },
  );

  it.each(Object.keys(EXEMPT))("%s is still a parent", (name) => {
    expect(parents.some((file) => file.name === name)).toBe(true);
  });
});
