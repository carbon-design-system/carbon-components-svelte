<script>
  /** Set to `true` to disable sorting on this specific cell */
  export let disableSorting = false;

  /** Specify the `scope` attribute */
  export let scope = "col";

  /**
   * Override the default id translations
   * @type {() => string}
   */
  export let translateWithId = () => "";

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  import { getContext } from "svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import ArrowsVertical from "../icons/ArrowsVertical.svelte";

  const { sortHeader, tableSortable } = getContext("DataTable");

  $: active = $sortHeader.id === id;
  // TODO: translate with id
  $: ariaLabel = translateWithId();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if $tableSortable && !disableSorting}
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
      class:bx--table-sort--ascending="{active &&
        $sortHeader.sortDirection === 'descending'}"
      on:click
    >
      <div class:bx--table-header-label="{true}">
        <slot />
      </div>
      <ArrowUp
        size="{20}"
        aria-label="{ariaLabel}"
        class="bx--table-sort__icon"
      />
      <ArrowsVertical
        size="{20}"
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
    <div class:bx--table-header-label="{true}">
      <slot />
    </div>
  </th>
{/if}
