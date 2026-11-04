<script>
  /** Specify the `href` attribute */
  export let href = "#main-content";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  import { tabindexAttribute } from "../utils/tabindex.js";
</script>

<a
  {href}
  tabindex={tabindexAttribute(tabindex)}
  class:bx--skip-to-content={true}
  {...$$restProps}
  on:click
>
  <slot>Skip to main content</slot>
</a>
