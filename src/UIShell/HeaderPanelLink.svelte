<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Specify the `href` attribute to render an anchor.
   * Omit it to render a button (for actions that do not navigate).
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the label text.
   * Alternatively, use the default slot.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify an icon to render after the label.
   * Alternatively, use the "icon" slot.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Set to `true` to mark the link as the current selection */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML element (anchor or button).
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import { resolveLinkRel } from "../utils/link-rel.js";
</script>

<li class:bx--switcher__item={true}>
  {#if href}
    <a
      bind:this={ref}
      {href}
      rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
      aria-current={isSelected ? "page" : undefined}
      class:bx--switcher__item-link={true}
      class:bx--switcher__item-link--selected={isSelected}
      {...$$restProps}
      on:click
    >
      <span class:bx--switcher__item-text={true}><slot>{text}</slot></span>
      {#if icon || $$slots.icon}
        <span class:bx--switcher__item-icon={true}>
          <slot name="icon"><svelte:component this={icon} size={16} /></slot>
        </span>
      {/if}
    </a>
  {:else}
    <button
      bind:this={ref}
      type="button"
      aria-current={isSelected ? "page" : undefined}
      class:bx--switcher__item-link={true}
      class:bx--switcher__item-link--selected={isSelected}
      {...$$restProps}
      on:click
    >
      <span class:bx--switcher__item-text={true}><slot>{text}</slot></span>
      {#if icon || $$slots.icon}
        <span class:bx--switcher__item-icon={true}>
          <slot name="icon"><svelte:component this={icon} size={16} /></slot>
        </span>
      {/if}
    </button>
  {/if}
</li>
