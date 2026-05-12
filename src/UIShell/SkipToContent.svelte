<script>
  /** Specify the `href` attribute */
  export let href = "#main-content";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";
</script>

<a {href} {tabindex} class:bx--skip-to-content={true} {...$$restProps} on:click>
  <slot>Skip to main content</slot>
</a>
