import { toIconItems } from "carbon-components-svelte";

declare global {
  interface Window {
    /** How many icons the picker has asked to import, for the tests. */
    __iconImports?: number;
  }
}

// Every Carbon icon, each one imported only when a cell shows it, with a
// section for each first letter. This module is itself loaded on demand.
// A module the browser already holds is not requested again, so the loaders
// count the picker's asks instead.
export default toIconItems(
  import.meta.glob("../../node_modules/carbon-icons-svelte/lib/*.svelte"),
  { category: (id) => id[0] },
).map((item) => {
  const load = item.load;
  return {
    ...item,
    load: load
      ? () => {
          window.__iconImports = (window.__iconImports ?? 0) + 1;
          return load();
        }
      : undefined,
  };
});
