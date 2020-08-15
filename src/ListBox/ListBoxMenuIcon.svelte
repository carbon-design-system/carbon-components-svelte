<script>
  /**
   * Set to `true` to open the list box menu icon
   * @type {boolean} [open=false]
   */
  export let open = false;

  /**
   * Default translation ids
   * @constant
   * @type {{ close: "close"; open: "open" }}
   */
  export const translationIds = { close: "close", open: "open" };

  /**
   * Override the default translation ids
   * @type {(id: ListBoxMenuIconTranslationId) => string} [translateWithId = (id) => string]
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * @typedef {"close" | "open"} ListBoxMenuIconTranslationId
   */

  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";

  const defaultTranslations = {
    [translationIds.close]: "Close menu",
    [translationIds.open]: "Open menu",
  };

  $: description = open ? translateWithId("close") : translateWithId("open");
</script>

<div
  class:bx--list-box__menu-icon={true}
  class:bx--list-box__menu-icon--open={open}
  {...$$restProps}
  on:click|preventDefault|stopPropagation>
  <ChevronDown16 aria-label={description} title={description} />
</div>
