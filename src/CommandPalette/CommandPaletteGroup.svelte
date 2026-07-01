<script>
  /**
   * @slot {{}} action
   */

  /** Specify the group label shown as a category header */
  export let label = "";

  /**
   * Override whether items in this group are filtered by the search value.
   * @type {boolean | undefined}
   */
  export let filter = undefined;

  /** Set to `true` to render a top divider, for example a footer actions group */
  export let divider = false;

  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";

  const { hasPrimaryItems } = getContext("carbon:CommandPalette") ?? {};

  if (!hasPrimaryItems) {
    throw new Error(
      "CommandPaletteGroup must be used within a CommandPalette.",
    );
  }

  const filterStore = writable(filter);

  $: filterStore.set(filter);

  let childIds = new Set();

  $: hasChildren = childIds.size > 0;
  $: showHeader = hasChildren && (label || $$slots.action);
  $: showDivider = divider && hasChildren && $hasPrimaryItems;

  setContext("carbon:CommandPaletteGroup", {
    divider,
    filter: filterStore,
    registerItem(id) {
      childIds.add(id);
      childIds = childIds;
    },
    unregisterItem(id) {
      childIds.delete(id);
      childIds = childIds;
    },
  });
</script>

<li role="presentation">
  <ul
    role="group"
    aria-label={label || undefined}
    class:bx--cmd-palette__group={true}
    class:bx--cmd-palette__group--divider={showDivider}
    class:bx--cmd-palette__group--hidden={!hasChildren}
  >
    {#if showHeader}
      <li role="presentation" class:bx--cmd-palette__group-label={true}>
        <div class:bx--cmd-palette__group-header={true}>
          {#if label}
            <span>{label}</span>
          {/if}
          {#if $$slots.action}
            <span class:bx--cmd-palette__group-action={true}>
              <slot name="action" />
            </span>
          {/if}
        </div>
      </li>
    {/if}
    <slot />
  </ul>
</li>
