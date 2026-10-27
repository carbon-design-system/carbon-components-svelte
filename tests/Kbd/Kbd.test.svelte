<svelte:options accessors />

<script lang="ts">
  import Kbd from "carbon-components-svelte/Kbd/Kbd.svelte";
  import type { ComponentProps } from "svelte";

  export let ref: ComponentProps<Kbd>["ref"] = null;
</script>

<Kbd data-testid="default">K</Kbd>
<Kbd data-testid="small" size="sm">K</Kbd>
<Kbd data-testid="muted" variant="muted">K</Kbd>
<Kbd
  data-testid="forwarded"
  aria-keyshortcuts="Control+K"
  class="custom"
  bind:ref>K</Kbd
>
