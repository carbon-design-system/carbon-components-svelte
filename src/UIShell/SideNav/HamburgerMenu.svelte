<script>
  /**
   * Specify the ARIA label for the button
   * @type {string}
   */
  export let ariaLabel = undefined;

  /** Set to `true` to toggle the open state */
  export let isOpen = false;

  /**
   * Specify the icon to render for the closed state
   * Defaults to `Menu20`
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let iconMenu = Menu20;

  /**
   * Specify the icon to render for the opened state
   * Defaults to `Close20`
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let iconClose = Close20;

  /** Obtain a reference to the HTML button element */
  export let ref = null;

  import Close20 from "../../icons/Close20.svelte";
  import Menu20 from "../../icons/Menu20.svelte";
</script>

<button
  bind:this="{ref}"
  type="button"
  title="{ariaLabel}"
  aria-label="{ariaLabel}"
  class:bx--header__action="{true}"
  class:bx--header__menu-trigger="{true}"
  class:bx--header__menu-toggle="{true}"
  {...$$restProps}
  on:click
  on:click="{() => (isOpen = !isOpen)}"
>
  <svelte:component this="{isOpen ? iconClose : iconMenu}" />
</button>
