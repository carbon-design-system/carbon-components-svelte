<script>
  // Internal: HeaderSearch's rich menu content, shared by its animated and
  // static menu elements. The parent forwards its slots.

  /** Set to `true` to render the loading skeleton. */
  export let loading = false;

  /** @type {string[]} */
  export let skeletonWidths = [];

  /** Set to `true` to render the `noResults` slot. */
  export let showNoResults = false;

  /**
   * Whether the parent received a `loading` slot; forwarding makes
   * `$$slots.loading` always true here.
   */
  export let hasLoadingSlot = false;

  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
</script>

{#if loading}
  {#if hasLoadingSlot}
    <slot name="loading" />
  {:else}
    {#each skeletonWidths as width, i (i)}
      <div
        class:bx--search-menu-item={true}
        class:bx--search-menu-item--skeleton={true}
      >
        <SkeletonText {width} />
      </div>
    {/each}
  {/if}
{:else}
  <slot name="menu" />
  {#if showNoResults}
    <div class:bx--search-menu__no-results={true}>
      <slot name="noResults" />
    </div>
  {/if}
{/if}
