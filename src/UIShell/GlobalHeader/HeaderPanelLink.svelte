<script>
  /**
   * Specify the `href` attribute
   * @type {string} [href]
   */
  export let href = undefined;
</script>

<li class:bx--switcher__item={true}>
  <a {href} class:bx--switcher__item-link={true} {...$$restProps}>
    <slot />
  </a>
</li>
