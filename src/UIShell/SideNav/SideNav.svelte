<script>
  /** Set to `true` to use the fixed variant */
  export let fixed = false;

  /**
   * Specify the ARIA label for the nav
   * @type {string}
   */
  export let ariaLabel = undefined;

  /** Set to `true` to toggle the expanded state */
  export let isOpen = false;

  import { onMount } from "svelte";
  import { shouldRenderHamburgerMenu } from "../navStore";

  onMount(() => {
    shouldRenderHamburgerMenu.set(true);
    return () => shouldRenderHamburgerMenu.set(false);
  });
</script>

{#if !fixed}
  <div
    on:click="{() => {
      isOpen = false;
    }}"
    class:bx--side-nav__overlay="{true}"
    class:bx--side-nav__overlay-active="{isOpen}"
  ></div>
{/if}
<nav
  aria-hidden="{!isOpen}"
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
