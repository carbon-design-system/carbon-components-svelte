<script>
  export let page = 0;
  export let active = false;
</script>

<li class:bx--pagination-nav__list-item={true}>
  <button
    data-page={page}
    aria-current={active ? 'page' : undefined}
    class:bx--pagination-nav__page={true}
    class:bx--pagination-nav__page--active={active}
    on:click>
    <span class:bx--pagination-nav__accessibility-label={true}>
      <slot />
    </span>
    {page}
  </button>
</li>
