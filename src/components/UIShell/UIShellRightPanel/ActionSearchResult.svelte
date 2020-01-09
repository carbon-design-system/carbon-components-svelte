<script>
  export let searchItem = undefined;
  export let index = undefined;

  let onHover = false;
</script>

<style>
  .search-list-item {
    padding: 6px 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.125rem;
    letter-spacing: 0.16px;
    transition: all 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
    display: block;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #c6c6c6;
  }

  .search-list-item-menu {
    text-transform: capitalize;
  }

  .search-list-item-description {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1rem;
    letter-spacing: 0.32px;
    text-transform: lowercase;
    color: #c6c6c6;
  }

  .search-list-item-active {
    background-color: #353535;
    color: #f4f4f4;
    outline: 0;
  }
</style>

{#if index === 0}
  <li role="none">
    <a
      tabindex="-1"
      id={`menu-item-${index}`}
      role="menuitem"
      class="search-list-item search-list-item-active"
      href={searchItem.href}>
      {searchItem.title}&nbsp;
      <span class="search-list-item-menu">→ {searchItem.menu}</span>
      <span class="search-list-item-description">{searchItem.description}</span>
    </a>
  </li>
{:else}
  <li role="none" on:mouseover={() => (onHover = true)} on:mouseleave={() => (onHover = false)}>
    <a
      tabindex="-1"
      id={`menu-item-${index}`}
      role="menuitem"
      class="search-list-item"
      class:search-list-item-active={onHover}
      href={searchItem.href}>
      {searchItem.title}&nbsp;
      <span class="search-list-item-menu">→ {searchItem.menu}</span>
      <span class="search-list-item-description">{searchItem.description}</span>
    </a>
  </li>
{/if}
