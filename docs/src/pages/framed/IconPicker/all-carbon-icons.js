import { toIconItems } from "carbon-components-svelte";

// One loader for each icon file, grouped by first letter.
export default toIconItems(
  import.meta.glob("../../../../node_modules/carbon-icons-svelte/lib/*.svelte"),
  { category: (id) => id[0] },
);
