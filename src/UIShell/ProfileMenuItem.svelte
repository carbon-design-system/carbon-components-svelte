<script>
  /**
   * @template [Icon=any]
   * @slot {{}} avatar - Leading avatar rendered before the label. The label truncates to make room for it.
   */

  /**
   * Specify the `href` attribute to render an anchor.
   * Omit it to render a button (for actions like "Log out" or "Change theme").
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify an icon to render at the end of the item.
   * Use the `icon` slot for full control over the rendered icon.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Obtain a reference to the HTML element (anchor or button).
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { moveIndex } from "../utils/moveIndex.js";

  const ctx = getContext("carbon:ProfileMenu");

  let menuItems = [];
  const unsubMenuItems = ctx?.menuItems.subscribe((_menuItems) => {
    menuItems = _menuItems;
  });

  onMount(() => {
    if (ctx && ref) ctx.registerMenuItem(ref);
    return () => {
      unsubMenuItems?.();
      if (ctx && ref) ctx.unregisterMenuItem(ref);
    };
  });

  function handleKeydown(event) {
    if (!ctx) return;

    const currentIndex = menuItems.indexOf(ref);
    if (currentIndex === -1) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      menuItems[moveIndex(currentIndex, 1, menuItems.length)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      menuItems[moveIndex(currentIndex, -1, menuItems.length)]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      menuItems[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    }
  }
</script>

{#if href}
  <a
    bind:this={ref}
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    class:bx--profile-menu__item={true}
    {...$$restProps}
    on:click
    on:keydown
    on:keydown={handleKeydown}
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
    on:keydown
    on:keydown={handleKeydown}
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
