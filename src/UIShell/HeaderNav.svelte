<script>
  $: props = {
    "aria-label": $$props["aria-label"],
    "aria-labelledby": $$props["aria-labelledby"],
  };
</script>

<nav {...props} class:cds--header__nav="{true}" {...$$restProps}>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul {...props} role="menubar" class:cds--header__menu-bar="{true}">
    <slot />
  </ul>
</nav>
