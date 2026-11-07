<script lang="ts">
  import { Kbd } from "carbon-components-svelte";

  /** One key, shown as written. */
  export let label = "";

  /** A shortcut such as `"mod+k"`, drawn for the reader's platform. */
  export let shortcut = "";

  export let variant: "keycap" | "muted" = "keycap";
</script>

{#if shortcut}
  <Kbd {shortcut} {variant} size="sm" />
{:else}
  <kbd class="bx--type-code-01">{label}</kbd>
{/if}
