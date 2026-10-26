<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {a | button}
   */

  /**
   * Specify the `href` attribute to render an anchor.
   * Omit it to render a button (for actions that do not navigate).
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the label text.
   * Alternatively, use the default slot.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify an icon to render after the label.
   * Alternatively, use the "icon" slot.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /** Set to `true` to mark the link as the current selection */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML element (anchor or button).
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import { getContext } from "svelte";
  import { resolveLinkRel } from "../utils/link-rel.js";

  const panel = getContext("carbon:HeaderAction");

  // Runs after the forwarded `click` handler so it can opt out with
  // `event.preventDefault()`.
  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (!event.defaultPrevented) panel?.select();
  }
</script>

<li class:bx--switcher__item={true}>
  <svelte:element
    this={href ? "a" : "button"}
    bind:this={ref}
    {href}
    type={href ? undefined : "button"}
    rel={href ? resolveLinkRel($$restProps.target, $$restProps.rel) : undefined}
    aria-current={isSelected ? "page" : undefined}
    class:bx--switcher__item-link={true}
    class:bx--switcher__item-link--selected={isSelected}
    {...$$restProps}
    on:click
    on:click={handleClick}
    on:keydown
  >
    <span class:bx--switcher__item-text={true}><slot>{text}</slot></span>
    {#if icon || $$slots.icon}
      <span class:bx--switcher__item-icon={true}>
        <slot name="icon"><svelte:component this={icon} size={16} /></slot>
      </span>
    {/if}
  </svelte:element>
</li>
