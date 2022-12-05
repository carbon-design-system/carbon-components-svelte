<script>
  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /**
   * Specify the sort direction
   * @type {"none" | "ascending" | "descending"}
   */
  export let sortDirection = "none";

  /** Set to `true` if the column sorting */
  export let active = false;

  /** Specify the `scope` attribute */
  export let scope = "col";

  /**
   * Override the default id translations
   * @type {() => string}
   */
  export let translateWithId = () => "";

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  import ArrowUp from "../icons/ArrowUp.svelte";
  import ArrowsVertical from "../icons/ArrowsVertical.svelte";

  // TODO: translate with id
  $: ariaLabel = translateWithId();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if sortable}
  <th
    aria-sort="{active ? sortDirection : 'none'}"
    scope="{scope}"
    data-header="{id}"
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <button
      type="button"
      class:bx--table-sort="{true}"
      class:bx--table-sort--active="{active}"
      class:bx--table-sort--ascending="{active &&
        sortDirection === 'descending'}"
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
    data-header="{id}"
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
