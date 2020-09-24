<script>
  /**
   * Set to `true` to select the item
   * @type {boolean} [isSelected]
   */
  export let isSelected = undefined;

  /**
   * Specify the `href` attribute
   * @type {string} [href]
   */
  export let href = undefined;

  /**
   * Specify the item text
   * @type {string} [text]
   */
  export let text = undefined;
</script>

<li class:bx--side-nav__menu-item="{true}">
  <a
    aria-current="{isSelected ? 'page' : undefined}"
    href="{href}"
    class:bx--side-nav__link="{true}"
    {...$$restProps}
    on:click
  >
    <span class:bx--side-nav__link-text="{true}">{text}</span>
  </a>
</li>
