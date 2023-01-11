<script>
  /** @extends {"./Link.svelte"} LinkProps */

  import Link from "./Link.svelte";
  import Launch from "../icons/Launch.svelte";
</script>

<Link
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  target="_blank"
  icon="{Launch}"
>
  <slot />
</Link>
