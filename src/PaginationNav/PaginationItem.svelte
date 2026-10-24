<script>
  /** Specify the current page index */
  export let page = 1;

  /** Specify the accessible name, such as "Page 3" */
  export let label = "";

  /** Set to `true` to use the active state */
  export let active = false;
</script>

<li class:bx--pagination-nav__list-item={true}>
  <button
    type="button"
    data-page={page}
    aria-current={active ? "page" : undefined}
    class:bx--pagination-nav__page={true}
    class:bx--pagination-nav__page--active={active}
    on:click
  >
    <span class:bx--pagination-nav__accessibility-label={true}>{label}</span>
    <span aria-hidden="true">{page}</span>
  </button>
</li>
