<script>
  import { Callout, NotificationActionButton } from "carbon-components-svelte";
</script>

{#each [18, 40] as rem (rem)}
  <div data-width={rem} style="width: {rem}rem">
    <Callout
      kind="warning"
      title="Scheduled downtime"
      subtitle="Billing is read-only on Saturday from 02:00 to 04:00 UTC."
    >
      <svelte:fragment slot="actions">
        <NotificationActionButton>View schedule</NotificationActionButton>
      </svelte:fragment>
    </Callout>
  </div>
{/each}

<Callout
  lowContrast
  kind="info"
  title="Read-only role"
  subtitle="Ask a workspace admin for edit access."
/>
