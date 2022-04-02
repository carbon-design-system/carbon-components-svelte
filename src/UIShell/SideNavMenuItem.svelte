<script>
  /** Set to `true` to select the item */
  export let isSelected = false;

  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the item text
   * @type {string}
   */
  export let text = undefined;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;
</script>

<li class:bx--side-nav__menu-item="{true}">
  <a
    bind:this="{ref}"
    aria-current="{isSelected ? 'page' : undefined}"
    href="{href}"
    class:bx--side-nav__link="{true}"
    {...$$restProps}
    on:click
  >
    <span class:bx--side-nav__link-text="{true}"><slot>{text}</slot></span>
  </a>
</li>
