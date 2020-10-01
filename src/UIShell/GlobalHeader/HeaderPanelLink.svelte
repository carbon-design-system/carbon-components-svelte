<script>
  /**
   * Specify the `href` attribute
   * @type {string} [href]
   */
  export let href = undefined;

  /**
   * Obtain a reference to the HTML button element
   * @type {null | HTMLButtonElement} [ref=null]
   */
  export let ref = null;
</script>

<li class:bx--switcher__item="{true}">
  <a
    bind:this="{ref}"
    href="{href}"
    class:bx--switcher__item-link="{true}"
    {...$$restProps}
    on:click
  >
    <slot />
  </a>
</li>
