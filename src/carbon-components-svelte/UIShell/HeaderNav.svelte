<script>
  $: props = {
    "aria-label": $$props["aria-label"],
    "aria-labelledby": $$props["aria-labelledby"],
  };
</script>

<nav {...props} class:bx--header__nav="{true}" {...$$restProps}>
  <ul {...props} role="menubar" class:bx--header__menu-bar="{true}">
    <slot />
  </ul>
</nav>
