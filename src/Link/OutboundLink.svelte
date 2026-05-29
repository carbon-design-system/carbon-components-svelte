<script>
  /** @extends {"./Link.svelte"} LinkProps */

  import Launch from "../icons/Launch.svelte";
  import Link from "./Link.svelte";

  /**
   * Specify the assistive text announced to screen readers to
   * indicate that the link opens in a new tab.
   * Set to an empty string to opt out of the announcement.
   */
  export let assistiveText = "(opens in a new tab)";
</script>

<Link
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  on:keydown
  on:keyup
  target="_blank"
  icon={Launch}
>
  <slot />
  {#if assistiveText}
    <span class:bx--visually-hidden={true}>{assistiveText}</span>
  {/if}
</Link>
