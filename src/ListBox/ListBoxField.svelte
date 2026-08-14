<script>
  /** Set to `true` to disable the list box field */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Specify the role attribute */
  export let role = "combobox";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "-1";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext } from "svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  const ctx = getContext("carbon:MultiSelect");

  $: if (ctx && ref) {
    ctx.declareRef({ key: "field", ref });
  }

  $: ariaExpanded = $$props["aria-expanded"];
  $: menuId = `menu-${id}`;
</script>

<button
  bind:this={ref}
  type="button"
  {id}
  {role}
  aria-expanded={ariaExpanded}
  aria-controls={(ariaExpanded && menuId) || undefined}
  aria-disabled={disabled}
  aria-readonly={readonly || undefined}
  tabindex={disabled ? "-1" : tabindex}
  class:bx--list-box__field={true}
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
</button>
