<script>
  /**
   * @typedef {"close" | "open"} ListBoxFieldTranslationId
   */

  /** Set to `true` to disable the list box field */
  export let disabled = false;

  /** Specify the role attribute */
  export let role = "combobox";

  /** Specify the tabindex */
  export let tabindex = "-1";

  /** Default translation ids */
  export const translationIds = { close: "close", open: "open" };

  /**
   * Override the default translation ids
   * @type {(id: ListBoxFieldTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the top-level HTML element */
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

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  bind:this="{ref}"
  role="{role}"
  aria-expanded="{ariaExpanded}"
  aria-owns="{(ariaExpanded && menuId) || undefined}"
  aria-controls="{(ariaExpanded && menuId) || undefined}"
  aria-disabled="{disabled}"
  aria-label="{ariaExpanded
    ? translateWithId('close')
    : translateWithId('open')}"
  tabindex="{disabled ? '-1' : tabindex}"
  class:bx--list-box__field="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown|stopPropagation
  on:focus
  on:blur
>
  <slot />
</div>
