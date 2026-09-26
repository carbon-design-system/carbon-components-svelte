<script>
  import {
    Breakpoint,
    Button,
    ButtonSet,
    OverflowMenu,
    OverflowMenuItem,
    PageHeader,
  } from "carbon-components-svelte";

  let size;

  $: compact = size === "sm" || size === "md";
</script>

<Breakpoint bind:size />

<PageHeader title="db-prod-01" subtitle="PostgreSQL 16 · us-south">
  <svelte:fragment slot="actions">
    {#if compact}
      <OverflowMenu size="xl" flipped iconDescription="Actions">
        <OverflowMenuItem text="Restart" />
        <OverflowMenuItem text="Create backup" />
        <OverflowMenuItem text="Connect" />
      </OverflowMenu>
    {:else}
      <ButtonSet>
        <Button kind="tertiary">Restart</Button>
        <Button kind="secondary">Create backup</Button>
        <Button>Connect</Button>
      </ButtonSet>
    {/if}
  </svelte:fragment>
</PageHeader>
