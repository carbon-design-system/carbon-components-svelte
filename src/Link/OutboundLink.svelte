<script>
  /** @extends {"./Link.svelte"} LinkProps */

  import Link from "./Link.svelte";
  import Launch16 from "../icons/Launch16.svelte";
</script>

<Link
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  target="_blank"
  icon="{Launch16}"
>
  <slot />
</Link>
