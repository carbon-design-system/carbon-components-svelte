<script>
  /** @extends {"./Link.svelte"} LinkProps */

  import Launch from "../icons/Launch.svelte";
  import Link from "./Link.svelte";
</script>

<Link
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  target="_blank"
  icon={Launch}
>
  <slot />
</Link>
