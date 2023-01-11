<script>
  /**
   * Specify the ARIA label for the button
   * @type {string}
   */
  export let ariaLabel = undefined;

  /** Set to `true` to toggle the open state */
  export let isOpen = false;

  /**
   * Specify the icon to render for the closed state.
   * Defaults to `<Menu size={20} />`
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let iconMenu = Menu;

  /**
   * Specify the icon to render for the opened state.
   * Defaults to `<Close size={20} />`
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let iconClose = Close;

  /** Obtain a reference to the HTML button element */
  export let ref = null;

  import Close from "../icons/Close.svelte";
  import Menu from "../icons/Menu.svelte";
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
  <svelte:component this="{isOpen ? iconClose : iconMenu}" size="{20}" />
</button>
