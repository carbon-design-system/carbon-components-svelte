<script>
  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` to mark the link as the current selection */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   */
  export let ref = null;
</script>

<li class:bx--switcher__item={true}>
  <a
    bind:this={ref}
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    aria-current={isSelected ? "page" : undefined}
    class:bx--switcher__item-link={true}
    class:bx--switcher__item-link--selected={isSelected}
    {...$$restProps}
    on:click
  >
    <slot />
  </a>
</li>
