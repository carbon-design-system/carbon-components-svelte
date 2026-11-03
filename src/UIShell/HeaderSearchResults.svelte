<script>
  // Internal: HeaderSearch's result items, shared by its animated and static
  // menu elements. The parent forwards its default slot.

  /** @type {ReadonlyArray<{ id?: string | number; href: string; text: string; description?: string }>} */
  export let results = [];

  /** Id of the HeaderSearch, which prefixes each item id. */
  export let id = "";

  /** @type {string | undefined} */
  export let selectedId = undefined;

  export let selectedResultIndex = 0;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

{#each results as result, index (result.id ?? index)}
  <li role="none">
    <a
      tabindex="-1"
      id="{id}-menuitem-{result.id ?? index}"
      role="menuitem"
      href={result.href}
      class:bx--header-search-menu-item={true}
      class:bx--header-search-menu-item--selected={selectedId ===
        `${id}-menuitem-${result.id ?? index}`}
      on:click|preventDefault={() => dispatch("select", index)}
    >
      <slot {result} {index} selected={selectedResultIndex === index} />
    </a>
  </li>
{/each}
