<script>
  /**
   * Specify the ARIA label for the button
   * @type {string} [ariaLabel]
   */
  export let ariaLabel = undefined;

  /**
   * Set to `true` to toggle the open state
   * @type {boolean} [isOpen=false]
   */
  export let isOpen = false;

  import { fly } from "svelte/transition";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import Menu20 from "carbon-icons-svelte/lib/Menu20";
  import { Icon } from "../../Icon";
</script>

<button
  type="button"
  title="Open menu"
  aria-label="{ariaLabel}"
  class:bx--header__action="{true}"
  class:bx--header__menu-trigger="{true}"
  class:bx--header__menu-toggle="{true}"
  {...$$restProps}
  transition:fly="{{ x: -200, delay: 50, duration: 250 }}"
  on:click
  on:click="{() => (isOpen = !isOpen)}">
  <Icon
    title="{isOpen ? 'Close' : 'Open Menu'}"
    render="{isOpen ? Close20 : Menu20}" />
</button>
