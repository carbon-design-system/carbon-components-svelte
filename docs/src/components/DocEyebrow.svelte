<script lang="ts">
  import { Stack, Text } from "carbon-components-svelte";
  import type { ComponentType } from "svelte";

  export let eyebrow = "";
  export let icon: ComponentType | undefined = undefined;
</script>

<Stack orientation="horizontal" gap={3} align="center">
  {#if icon}
    <svelte:component
      this={icon}
      size={16}
      class="eyebrow-icon"
      aria-hidden="true"
    />
  {/if}
  <Text type="caption-02" color="secondary">{eyebrow}</Text>
</Stack>

<style>
  :global(.eyebrow-icon) {
    fill: var(--cds-text-secondary, var(--cds-text-02));
    flex-shrink: 0;
  }
</style>
