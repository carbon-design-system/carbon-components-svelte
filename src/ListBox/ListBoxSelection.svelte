<script>
  /**
   * @typedef {"clearAll" | "clearSelection"} ListBoxSelectionTranslationId
   */

  /**
   * Specify the number of selected items
   * @type {number}
   */
  export let selectionCount = undefined;

  /** Set to `true` to disable the list box selection */
  export let disabled = false;

  /** Default translation ids */
  export const translationIds = {
    clearAll: "clearAll",
    clearSelection: "clearSelection",
  };

  /**
   * Override the default translation ids
   * @type {(id: ListBoxSelectionTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /** Obtain a reference to the top-level HTML element */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import Close16 from "../icons/Close16.svelte";

  const defaultTranslations = {
    [translationIds.clearAll]: "Clear all selected items",
    [translationIds.clearSelection]: "Clear selected item",
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

{#if selectionCount !== undefined}
  <div
    class:bx--tag="{true}"
    class:bx--tag--filter="{true}"
    class:bx--tag--high-contrast="{true}"
    class:bx--tag--disabled="{disabled}"
  >
    <span class:bx--tag__label="{true}" title="{selectionCount}">
      {selectionCount}
    </span>
    <div
      bind:this="{ref}"
      role="button"
      tabIndex="{disabled ? -1 : 0}"
      class:bx--tag__close-icon="{true}"
      on:click|preventDefault|stopPropagation="{(e) => {
        if (!disabled) {
          dispatch('clear', e);
        }
      }}"
      on:keydown|stopPropagation="{(e) => {
        if (!disabled && e.key === 'Enter') {
          dispatch('clear', e);
        }
      }}"
      disabled="{disabled}"
      aria-label="{translationIds.clearAll}"
      title="{description}"
    >
      <Close16 />
    </div>
  </div>
{:else}
  <div
    bind:this="{ref}"
    role="button"
    aria-label="{description}"
    title="{description}"
    tabindex="{disabled ? '-1' : '0'}"
    class:bx--list-box__selection="{true}"
    class:bx--tag--filter="{selectionCount}"
    class:bx--list-box__selection--multi="{selectionCount}"
    {...$$restProps}
    on:click|preventDefault|stopPropagation="{(e) => {
      if (!disabled) {
        dispatch('clear', e);
      }
    }}"
    on:keydown|stopPropagation="{(e) => {
      if (!disabled && e.key === 'Enter') {
        dispatch('clear', e);
      }
    }}"
  >
    {#if selectionCount !== undefined}{selectionCount}{/if}
    <Close16 />
  </div>
{/if}
