<script>
  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;
</script>

<li class:bx--switcher__item="{true}">
  <a
    bind:this="{ref}"
    href="{href}"
    rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
    class:bx--switcher__item-link="{true}"
    {...$$restProps}
    on:click
  >
    <slot />
  </a>
</li>
