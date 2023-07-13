<script>
  /**
   * @typedef {"close" | "open"} ListBoxMenuIconTranslationId
   */

  /** Set to `true` to open the list box menu icon */
  export let open = false;

  /** Default translation ids */
  export const translationIds = { close: "close", open: "open" };

  /**
   * Override the default translation ids
   * @type {(id: ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  import ChevronDown from "../icons/ChevronDown.svelte";

  const defaultTranslations = {
    [translationIds.close]: "Close menu",
    [translationIds.open]: "Open menu",
  };

  $: translationId = open ? translationIds.close : translationIds.open;
  $: description =
    translateWithId?.(translationId) ?? defaultTranslations[translationId];
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--list-box__menu-icon="{true}"
  class:bx--list-box__menu-icon--open="{open}"
  {...$$restProps}
  on:click|preventDefault
>
  <ChevronDown aria-label="{description}" title="{description}" />
</div>
