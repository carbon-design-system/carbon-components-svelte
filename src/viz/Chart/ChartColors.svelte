<script>
  /**
   * @slot {{}}
   */

  /**
   * Specify the color of each series key, for every chart inside, so a
   * series keeps its color across a page however many series each chart
   * has. A chart's own `colors` win over these.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { CHART_COLORS_CONTEXT } from "./context.js";

  const store = writable(colors);
  $: store.set(colors);
  setContext(CHART_COLORS_CONTEXT, store);
</script>

<slot />
