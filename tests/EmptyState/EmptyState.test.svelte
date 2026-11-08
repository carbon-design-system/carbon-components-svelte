<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import EmptyState from "carbon-components-svelte/EmptyState/EmptyState.svelte";
  import Add from "carbon-components-svelte/icons/Add.svelte";
  import type { ComponentProps } from "svelte";

  export let titleText = "No projects yet";
  export let subtitleText =
    "Projects hold the files and people for one piece of work.";
  export let size: ComponentProps<EmptyState>["size"] = "lg";
  export let headingLevel: ComponentProps<EmptyState>["headingLevel"] =
    undefined;
  export let withSlots = true;
  export let linkSubtitle = false;
</script>

{#if withSlots}
  <EmptyState
    {titleText}
    {subtitleText}
    {size}
    {headingLevel}
    data-testid="empty"
  >
    <Add slot="illustration" />
    <svelte:fragment slot="subtitleChildren">
      {#if linkSubtitle}
        Try <a href="#docs">the docs</a>
      {:else}
        {subtitleText}
      {/if}
    </svelte:fragment>
    <Button>Create project</Button>
  </EmptyState>
{:else}
  <EmptyState
    {titleText}
    {subtitleText}
    {size}
    {headingLevel}
    data-testid="empty"
  />
{/if}
