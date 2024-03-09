<script>
  import { getContext, setContext } from "svelte";

  /**
   * Specify the layer level and override any existing levels based on hierarchy.
   * @type {0 | 1 | 2 }
   */
  export let level = undefined;

  /**
   * Specify the HTML element to render. If none is specified, a `div` is rendered.
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let as = "div";

  /**
   * Specify the Layer HTML element props
   * @type {import('svelte/elements').HTMLElementAttributes}
   */
  export let layerProps = {};

  /** Set an id for the Layer component */
  export let id = "ccs-" + Math.random().toString(36);

  let ref = null;

  // If there is no level override, determine the Level based on the hierarchy
  const parentLevel = getContext("LAYER_CONTEXT");
  if (level === undefined) {
    level = typeof parentLevel === "number" ? parentLevel + 1 : 0;
  }
  setContext("LAYER_CONTEXT", level);
</script>

<svelte:element
  this="{as}"
  class:bx--layer-one="{level === 0}"
  class:bx--layer-two="{level === 1}"
  class:bx--layer-three="{level === 2}"
  id="{id}"
  bind:this="{ref}"
  {...layerProps}
>
  <slot />
</svelte:element>
