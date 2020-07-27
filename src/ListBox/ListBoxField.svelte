<script>
  /**
   * Set to `true` to disable the list box field
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the role attribute
   * @type {string} [role="combobox"]
   */
  export let role = "combobox";

  /**
   * Specify the tabindex
   * @type {string} [tabindex="-1"]
   */
  export let tabindex = "-1";

  /**
   * @typedef {"close" | "open"} ListBoxFieldTranslationId
   */

  /**
   * Default translation ids
   * @constant
   * @type {{ close: "close"; open: "open"; }}
   */
  export const translationIds = { close: "close", open: "open" };

  /**
   * Override the default translation ids
   * @type {(id: ListBoxFieldTranslationId) => string;} [translateWithId = (id) => string;]
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the top-level HTML element
   * @type {null | HTMLElement} [ref=null]
   */
  export let ref = null;

  import { getContext } from "svelte";

  const defaultTranslations = {
    [translationIds.close]: "Close menu",
    [translationIds.open]: "Open menu",
  };
  const ctx = getContext("MultiSelect");

  $: if (ctx && ref) {
    ctx.declareRef({ key: "field", ref });
  }

  $: ariaExpanded = $$props["aria-expanded"];
  $: menuId = `menu-${id}`;
</script>

<div
  bind:this={ref}
  role={ariaExpanded ? 'combobox' : role}
  aria-expanded={ariaExpanded}
  aria-owns={(ariaExpanded && menuId) || undefined}
  aria-controls={(ariaExpanded && menuId) || undefined}
  aria-disabled={disabled}
  aria-label={ariaExpanded ? translateWithId('close') : translateWithId('open')}
  tabindex={disabled ? '-1' : tabindex}
  class:bx--list-box__field={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown|preventDefault|stopPropagation
  on:blur>
  <slot />
</div>
