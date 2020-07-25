<script>
  export let disabled = false;
  export let role = "combobox";
  export let tabindex = "-1";
  export const translationIds = { close: "close", open: "open" };
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
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
