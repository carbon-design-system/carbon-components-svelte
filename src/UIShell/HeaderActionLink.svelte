<script>
  /**
   * @generics {Icon = any} Icon
   */

  /** Set to `true` to use the active state */
  export let linkIsActive = false;

  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;
</script>

<a
  bind:this={ref}
  class:bx--header__action={true}
  class:bx--header__action--active={linkIsActive}
  {href}
  rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
  {...$$restProps}
  on:click
>
  <slot name="icon"><svelte:component this={icon} size={20} /></slot>
</a>

<style>
  :global(.bx--header__global .bx--header__action) {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: 3rem;
    min-height: 3rem;
    /** Hot fix to align icon with `HeaderAction` */
    padding-bottom: 2px;
  }

  :global(.bx--header__global a.bx--header__action),
  :global(
      .bx--header__global
      button.bx--header__action:not(.bx--header-search-button)
    ) {
    position: relative;
    text-decoration: none;
    color: inherit;
    transition:
      background-color 110ms,
      border-color 110ms;
    border: 0.0625rem solid rgba(0, 0, 0, 0);
    background-color: transparent;
  }

  :global(.bx--header__global a.bx--header__action:hover),
  :global(
      .bx--header__global
      button.bx--header__action:not(.bx--header-search-button):hover
    ) {
    background-color: #353535;
  }

  :global(.bx--header__global a.bx--header__action:focus),
  :global(
      .bx--header__global
      button.bx--header__action:not(.bx--header-search-button):focus
    ) {
    border-color: #fff;
    outline: none;
  }

  :global(.bx--header__global a.bx--header__action:active),
  :global(
      .bx--header__global
      button.bx--header__action:not(.bx--header-search-button):active
    ) {
    background-color: #393939;
  }
</style>
