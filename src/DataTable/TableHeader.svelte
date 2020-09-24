<script>
  /**
   * Specify the `scope` attribute
   * @type {string} [scope="col"]
   */
  export let scope = "col";

  /**
   * Override the default id translations
   * @type {() => string} [translateWithId = () => ""]
   */
  export let translateWithId = () => "";

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  import { getContext } from "svelte";
  import ArrowUp20 from "carbon-icons-svelte/lib/ArrowUp20";
  import ArrowsVertical20 from "carbon-icons-svelte/lib/ArrowsVertical20";

  const { sortHeader, tableSortable, add } = getContext("DataTable");

  add(id);

  $: active = $sortHeader.id === id;
  // TODO: translate with id
  $: ariaLabel = translateWithId();
</script>

{#if $tableSortable}
  <th
    aria-sort="{active ? $sortHeader.sortDirection : 'none'}"
    scope="{scope}"
    id="{id}"
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <button
      class:bx--table-sort="{true}"
      class:bx--table-sort--active="{active}"
      class:bx--table-sort--ascending="{active && $sortHeader.sortDirection === 'descending'}"
      on:click
    >
      <span class:bx--table-header-label="{true}">
        <slot />
      </span>
      <ArrowUp20 aria-label="{ariaLabel}" class="bx--table-sort__icon" />
      <ArrowsVertical20
        aria-label="{ariaLabel}"
        class="bx--table-sort__icon-unsorted"
      />
    </button>
  </th>
{:else}
  <th
    scope="{scope}"
    id="{id}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <span class:bx--table-header-label="{true}">
      <slot />
    </span>
  </th>
{/if}
