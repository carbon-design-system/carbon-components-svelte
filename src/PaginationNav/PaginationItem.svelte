<script>
  /** Specify the current page index */
  export let page = 1;

  /** Set to `true` to use the active state */
  export let active = false;
</script>

<li class:bx--pagination-nav__list-item="{true}">
  <button
    data-page="{page}"
    aria-current="{active ? 'page' : undefined}"
    class:bx--pagination-nav__page="{true}"
    class:bx--pagination-nav__page--active="{active}"
    on:click
  >
    <span class:bx--pagination-nav__accessibility-label="{true}">
      <slot />
    </span>
    {page}
  </button>
</li>
