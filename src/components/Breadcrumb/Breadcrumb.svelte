<script>
  export let noTrailingSlash = false;
</script>

<nav
  aria-label="Breadcrumb"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <ol
    class:bx--breadcrumb={true}
    class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}>
    <slot />
  </ol>
</nav>
