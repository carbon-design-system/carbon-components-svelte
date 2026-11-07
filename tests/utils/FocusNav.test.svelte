<script>
  import {
    createFocusNav,
    focusNav,
  } from "carbon-components-svelte/utils/focus-nav.js";

  export let mode = "roving";
  export let rtl = false;
  export let items = ["Cut", "Copy", "Paste", "Delete", "Select"];
  export let disabled = [1, 2];

  function options() {
    return {
      selector: "[data-item]",
      skip: (/** @type {number} */ i) => disabled.includes(i),
      rtl: () => rtl,
      mode,
      orientation: mode === "roving" ? "horizontal" : "vertical",
      typeahead: { label: (/** @type {number} */ i) => items[i] },
    };
  }

  const nav = createFocusNav(options());

  $: nav.update(options());
</script>

{#if mode === "roving"}
  <div role="toolbar" aria-label="Edit" use:focusNav={nav}>
    {#each items as item, i (item)}
      <button
        type="button"
        data-item
        disabled={disabled.includes(i)}
        tabindex={i === $nav.tabStop ? 0 : -1}
      >
        {item}
      </button>
    {/each}
  </div>
{:else}
  <div
    role="listbox"
    tabindex="0"
    aria-label="Edit"
    aria-activedescendant={$nav.activeId}
    use:focusNav={nav}
  >
    {#each items as item, i (item)}
      <div
        role="option"
        id="opt-{i}"
        data-item
        aria-selected={i === $nav.index}
        aria-disabled={disabled.includes(i) ? "true" : undefined}
      >
        {item}
      </div>
    {/each}
  </div>
{/if}
