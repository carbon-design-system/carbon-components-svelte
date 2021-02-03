<script>
  /** @extends {"./Link"} LinkProps */

  import Link from "./Link.svelte";
  import Launch16 from "carbon-icons-svelte/lib/Launch16/Launch16.svelte";
</script>

<Link
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  target="_blank"
>
  <slot />
  <Launch16 />
</Link>
