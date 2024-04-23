<script>
  // @ts-check

  /** Set to `true` to prevent wrapping */
  export let noWrap = false;

  import { getContext } from "svelte";

  /** @type {undefined | import("svelte/store").Writable<{}>} */
  const head = getContext("StructuredListHead");
</script>

<div
  class:bx--structured-list-th="{head}"
  class:bx--structured-list-td="{!head}"
  class:bx--structured-list-content--nowrap="{noWrap}"
  {...$$restProps}
  role="{head ? 'columnheader' : 'cell'}"
>
  <slot />
</div>
