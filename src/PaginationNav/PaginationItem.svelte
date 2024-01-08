<script>
  /** Specify the current page index */
  export let page = 1;

  /** Set to `true` to use the active state */
  export let active = false;
</script>

<li class:cds--pagination-nav__list-item="{true}">
  <button
    type="button"
    data-page="{page}"
    aria-current="{active ? 'page' : undefined}"
    class:cds--pagination-nav__page="{true}"
    class:cds--pagination-nav__page--active="{active}"
    on:click
  >
    <span class:cds--pagination-nav__accessibility-label="{true}">
      <slot />
    </span>
    {page}
  </button>
</li>
