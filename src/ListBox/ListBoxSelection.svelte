<script>
  export const translationIds = {
    clearAll: "clearAll",
    clearSelection: "clearSelection"
  };
  export let disabled = false;
  export let selectionCount = undefined;
  export let translateWithId = id => defaultTranslations[id];
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import Close16 from "carbon-icons-svelte/lib/Close16";

  const defaultTranslations = {
    [translationIds.clearAll]: "Clear all selected items",
    [translationIds.clearSelection]: "Clear selected item"
  };
  const dispatch = createEventDispatcher();
  const ctx = getContext("MultiSelect");

  $: if (ctx && ref) {
    ctx.declareRef({ key: "selection", ref });
  }

  $: description = selectionCount
    ? translateWithId("clearAll")
    : translateWithId("clearSelection");
</script>

<div
  bind:this={ref}
  role="button"
  aria-label="Clear Selection"
  tabindex={disabled ? '-1' : '0'}
  title={description}
  class:bx--list-box__selection={true}
  class:bx--tag--filter={selectionCount}
  class:bx--list-box__selection--multi={selectionCount}
  {...$$restProps}
  on:click|preventDefault|stopPropagation={e => {
    if (!disabled) {
      dispatch('clear', e);
    }
  }}
  on:keydown|stopPropagation={e => {
    if (!disabled && e.key === 'Enter') {
      dispatch('clear', e);
    }
  }}>
  {#if selectionCount}{selectionCount}{/if}
  <Close16 />
</div>
