<script>
  /** Specify the `href` attribute */
  export let href = "#main-content";

  /** Specify the tabindex */
  export let tabindex = "0";
</script>

<a
  href="{href}"
  tabindex="{tabindex}"
  class:bx--skip-to-content="{true}"
  {...$$restProps}
  on:click
>
  <slot>Skip to main content</slot>
</a>
