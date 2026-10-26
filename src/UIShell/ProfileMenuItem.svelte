<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @slot {{}} avatar - Leading avatar rendered before the label. The label truncates to make room for it.
   */

  /**
   * Specify the `href` attribute to render an anchor.
   * Omit it to render a button (for actions like "Log out" or "Change theme").
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify an icon to render at the end of the item.
   * Use the `icon` slot for full control over the rendered icon.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Obtain a reference to the HTML element (anchor or button).
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { PROFILE_MENU_CONTEXT_KEY } from "../constants/context-keys.js";
  import { resolveLinkRel } from "../utils/link-rel.js";

  const ctx = getContext(PROFILE_MENU_CONTEXT_KEY);

  onMount(() => {
    if (ctx && ref) ctx.registerMenuItem(ref);
    return () => {
      if (ctx && ref) ctx.unregisterMenuItem(ref);
    };
  });

  // Runs after the forwarded `click` handler so it can opt out with
  // `event.preventDefault()`.
  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (!event.defaultPrevented) ctx?.select?.();
  }
</script>

{#if href}
  <a
    bind:this={ref}
    {href}
    rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
    class:bx--profile-menu__item={true}
    {...$$restProps}
    on:click
    on:click={handleClick}
    on:keydown
  >
    <span class:bx--profile-menu__item-label={true}>
      {#if $$slots.avatar}
        <span class:bx--profile-menu__item-avatar={true}
          ><slot name="avatar" /></span
        >
      {/if}
      <span class:bx--profile-menu__item-text={true}><slot /></span>
    </span>
    {#if $$slots.icon || icon}
      <slot name="icon"><svelte:component this={icon} size={16} /></slot>
    {/if}
  </a>
{:else}
  <button
    bind:this={ref}
    type="button"
    class:bx--profile-menu__item={true}
    {...$$restProps}
    on:click
    on:click={handleClick}
    on:keydown
  >
    <span class:bx--profile-menu__item-label={true}>
      {#if $$slots.avatar}
        <span class:bx--profile-menu__item-avatar={true}
          ><slot name="avatar" /></span
        >
      {/if}
      <span class:bx--profile-menu__item-text={true}><slot /></span>
    </span>
    {#if $$slots.icon || icon}
      <slot name="icon"><svelte:component this={icon} size={16} /></slot>
    {/if}
  </button>
{/if}
