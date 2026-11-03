<script>
  /**
   * @typedef {"close" | "open"} ListBoxMenuIconTranslationId
   */

  /** Set to `true` to open the list box menu icon */
  export let open = false;

  /** Default translation ids */
  export const translationIds = /** @type {const} */ ({
    close: "close",
    open: "open",
  });

  /**
   * Override the default translation ids. Unset, it uses
   * `setTranslateContext`, then English.
   * @type {(id: ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return translate?.(id) ?? defaultTranslations[id];
  };

  import ChevronDown from "../icons/ChevronDown.svelte";
  import { getTranslateContext } from "../utils/translate-context.js";

  const translate = getTranslateContext();

  const defaultTranslations = {
    [translationIds.close]: "Close menu",
    [translationIds.open]: "Open menu",
  };

  $: translationId = open ? translationIds.close : translationIds.open;
  $: description =
    translateWithId?.(translationId) ?? defaultTranslations[translationId];
</script>

<div
  class:bx--list-box__menu-icon={true}
  class:bx--list-box__menu-icon--open={open}
  {...$$restProps}
  on:click|preventDefault
>
  <ChevronDown aria-label={description} title={description} />
</div>
