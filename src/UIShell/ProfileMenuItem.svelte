<script>
  /**
   * Specify the `href` attribute to render an anchor.
   * Omit it to render a button (for actions like "Log out" or "Change theme").
   * @type {string}
   */
  export let href = undefined;

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
    <slot name="icon" />
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
    <slot name="icon" />
  </button>
{/if}
