<script>
  /**
   * Specify the ARIA label for the button
   * @type {string}
   */
  export let ariaLabel = undefined;

  /** Set to `true` to toggle the open state */
  export let isOpen = false;

  /** Obtain a reference to the HTML button element */
  export let ref = null;

  import Close20 from "carbon-icons-svelte/lib/Close20";
  import Menu20 from "carbon-icons-svelte/lib/Menu20";
  import { Icon } from "../../Icon";
</script>

<button
  bind:this="{ref}"
  type="button"
  title="Open menu"
  aria-label="{ariaLabel}"
  class:bx--header__action="{true}"
  class:bx--header__menu-trigger="{true}"
  class:bx--header__menu-toggle="{true}"
  {...$$restProps}
  on:click
  on:click="{() => (isOpen = !isOpen)}"
>
  <Icon
    title="{isOpen ? 'Close' : 'Open Menu'}"
    render="{isOpen ? Close20 : Menu20}"
  />
</button>
