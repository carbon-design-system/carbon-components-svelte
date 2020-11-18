<script>
  /**
   * Set to `true` to use the fixed variant
   * @type {boolean} [fixed=false]
   */
  export let fixed = false;

  /**
   * Specify the ARIA label for the nav
   * @type {string} [ariaLabel]
   */
  export let ariaLabel = undefined;

  /**
   * Set to `true` to toggle the expanded state
   * @type {boolean} [isOpen=false]
   */
  export let isOpen = false;
</script>

{#if fixed}
  <div
    on:click="{() => {
      isOpen = false;
    }}"
    class:bx--side-nav__overlay="{true}"
    class:bx--side-nav__overlay-active="{isOpen}"
  ></div>
{/if}
<nav
  aria-label="{ariaLabel}"
  class:bx--side-nav__navigation="{true}"
  class:bx--side-nav="{true}"
  class:bx--side-nav--ux="{true}"
  class:bx--side-nav--expanded="{isOpen}"
  class:bx--side-nav--collapsed="{!isOpen}"
  {...$$restProps}
>
  <slot />
</nav>
