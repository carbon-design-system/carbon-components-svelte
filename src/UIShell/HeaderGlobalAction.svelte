<script>
  /**
   * @extends {"../Button/Button.svelte"} ButtonProps
   */

  /** Set to `true` to use the active variant */
  export let isActive = false;

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML button element
   * @type {HTMLButtonElement}
   */
  export let ref = null;

  import Button from "../Button/Button.svelte";

  $: buttonClass = [
    "bx--header__action",
    isActive && " bx--header__action--active",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Button bind:ref {...$$restProps} class="{buttonClass}" on:click>
  <svelte:component this="{icon}" slot="icon" size="{20}" />
</Button>
