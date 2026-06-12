<script>
  /**
   * @event {KeyboardEvent | MouseEvent} clear
   */

  /**
   * @typedef {"clearAll" | "clearSelection"} ListBoxSelectionTranslationId
   */

  /**
   * Specify the number of selected items.
   * @type {number}
   */
  export let selectionCount = undefined;

  /** Set to `true` to disable the list box selection */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Default translation ids */
  export const translationIds = {
    clearAll: "clearAll",
    clearSelection: "clearSelection",
  };

  /**
   * Override the default translation ids.
   * @type {(id: ListBoxSelectionTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import Close from "../icons/Close.svelte";

  const defaultTranslations = {
    [translationIds.clearAll]: "Clear all selected items",
    [translationIds.clearSelection]: "Clear selected item",
  };
  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:MultiSelect");

  $: if (ctx && ref) {
    ctx.declareRef({ key: "selection", ref });
  }
  $: translationId =
    selectionCount === undefined
      ? translationIds.clearSelection
      : translationIds.clearAll;
  $: buttonLabel =
    translateWithId?.(translationId) ?? defaultTranslations[translationId];
  $: description =
    translateWithId?.(translationId) ?? defaultTranslations[translationId];
</script>

{#if selectionCount !== undefined}
  <div
    class:bx--tag={true}
    class:bx--tag--filter={true}
    class:bx--tag--high-contrast={true}
    class:bx--tag--disabled={disabled}
    aria-hidden={readonly || undefined}
  >
    <span
      class:bx--tag__label={true}
      title={selectionCount}
      aria-hidden={readonly || undefined}
    >
      {selectionCount}
    </span>
    <div
      bind:this={ref}
      role="button"
      tabindex="-1"
      class:bx--tag__close-icon={true}
      on:click|preventDefault|stopPropagation={(event) => {
        if (!disabled && !readonly) {
          dispatch("clear", event);
        }
      }}
      on:keydown|stopPropagation={(event) => {
        if (!disabled && !readonly && (event.key === "Enter" || event.key === " ")) {
          dispatch("clear", event);
        }
      }}
      {disabled}
      aria-disabled={readonly || undefined}
      aria-label={buttonLabel}
      aria-hidden={readonly || undefined}
      title={description}
    >
      <Close />
    </div>
  </div>
{:else}
  <div
    bind:this={ref}
    role="button"
    aria-label={description}
    title={description}
    tabindex="-1"
    class:bx--list-box__selection={true}
    class:bx--tag--filter={selectionCount}
    class:bx--list-box__selection--multi={selectionCount}
    aria-disabled={readonly || undefined}
    {...$$restProps}
    on:click|preventDefault|stopPropagation={(event) => {
      if (!disabled && !readonly) {
        dispatch("clear", event);
      }
    }}
    on:keydown|stopPropagation={(event) => {
      if (!disabled && !readonly && (event.key === "Enter" || event.key === " ")) {
        dispatch("clear", event);
      }
    }}
  >
    {#if selectionCount !== undefined}
      {selectionCount}
    {/if}
    <Close />
  </div>
{/if}
