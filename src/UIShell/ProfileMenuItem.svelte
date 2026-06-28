<script>
  /** @template [Icon=any] */

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
</script>

{#if href}
  <a
    bind:this={ref}
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    class:bx--profile-menu__item={true}
    {...$$restProps}
    on:click
  >
    <span class:bx--profile-menu__item-label={true}><slot /></span>
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
  >
    <span class:bx--profile-menu__item-label={true}><slot /></span>
    {#if $$slots.icon || icon}
      <slot name="icon"><svelte:component this={icon} size={16} /></slot>
    {/if}
  </button>
{/if}
