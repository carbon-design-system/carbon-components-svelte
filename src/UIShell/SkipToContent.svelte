<script>
  /** Specify the `href` attribute */
  export let href = "#main-content";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Specify the link text. The default slot replaces it. */
  export let labelText = "Skip to main content";
</script>

<a {href} {tabindex} class:bx--skip-to-content={true} {...$$restProps} on:click>
  <slot>{labelText}</slot>
</a>
