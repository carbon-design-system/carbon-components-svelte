<script lang="ts">
  import { Stack, Text } from "carbon-components-svelte";
  import type { CarbonIconProps } from "carbon-icons-svelte";
  import type { Component } from "svelte";

  export let eyebrow = "";
  export let icon: Component<CarbonIconProps> | undefined = undefined;
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
  <Text type="label-02" color="secondary">{eyebrow}</Text>
</Stack>

<style>
  :global(.eyebrow-icon) {
    fill: var(--cds-text-secondary);
    flex-shrink: 0;
  }
</style>
