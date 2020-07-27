<script>
  /**
   * Specify the `href` attribute
   * @type {string} [href="#main-content"]
   */
  export let href = "#main-content";

  /**
   * Specify the tabindex
   * @type {string} [tabindex="0"]
   */
  export let tabindex = "0";
</script>

<a {href} {tabindex} class:bx--skip-to-content={true} {...$$restProps} on:click>
  <slot>Skip to main content</slot>
</a>
