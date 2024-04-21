<script>
  // @ts-check

  /** Set to `true` to hide the breadcrumb trailing slash */
  export let noTrailingSlash = false;
</script>

<nav aria-label="Breadcrumb" {...$$restProps}>
  <ol
    class:bx--breadcrumb="{true}"
    class:bx--breadcrumb--no-trailing-slash="{noTrailingSlash}"
  >
    <slot />
  </ol>
</nav>
