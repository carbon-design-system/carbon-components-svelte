<script>
  /**
   * Id of the element naming the group. When unset, the slot renders without
   * a wrapper, so ungrouped options stay direct children of the menu.
   * @type {string | undefined}
   */
  export let labelledBy = undefined;
</script>

{#if labelledBy}
  <div role="group" aria-labelledby={labelledBy}><slot /></div>
{:else}
  <slot />
{/if}
