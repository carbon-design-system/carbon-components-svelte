<script lang="ts">
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
</script>

<PageHeader data-testid="slotted" title="Fallback">
  <svelte:fragment slot="titleChildren">
    Databases <span data-testid="count">(4)</span>
  </svelte:fragment>
</PageHeader>

<PageHeader data-testid="slot-only">
  <svelte:fragment slot="titleChildren">Slot only</svelte:fragment>
</PageHeader>

<PageHeader data-testid="start-only">
  <span slot="titleStart" data-testid="start">Start</span>
</PageHeader>

<PageHeader data-testid="end-only">
  <span slot="titleEnd" data-testid="end">End</span>
</PageHeader>
