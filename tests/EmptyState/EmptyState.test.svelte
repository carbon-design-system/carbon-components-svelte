<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import EmptyState from "carbon-components-svelte/EmptyState/EmptyState.svelte";
  import Add from "carbon-components-svelte/icons/Add.svelte";
  import type { ComponentProps } from "svelte";

  export let title = "No projects yet";
  export let subtitle =
    "Projects hold the files and people for one piece of work.";
  export let size: ComponentProps<EmptyState>["size"] = "lg";
  export let headingLevel: ComponentProps<EmptyState>["headingLevel"] = 3;
  export let withSlots = true;
  export let linkSubtitle = false;
</script>

{#if withSlots}
  <EmptyState {title} {subtitle} {size} {headingLevel} data-testid="empty">
    <Add slot="illustration" />
    <svelte:fragment slot="subtitle">
      {#if linkSubtitle}
        Try <a href="#docs">the docs</a>
      {:else}
        {subtitle}
      {/if}
    </svelte:fragment>
    <Button>Create project</Button>
  </EmptyState>
{:else}
  <EmptyState {title} {subtitle} {size} {headingLevel} data-testid="empty" />
{/if}
