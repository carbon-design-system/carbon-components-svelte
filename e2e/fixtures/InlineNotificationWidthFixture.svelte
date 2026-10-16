<script>
  import {
    InlineNotification,
    NotificationActionButton,
  } from "carbon-components-svelte";
</script>

{#each [18, 40] as rem (rem)}
  <div data-width={rem} style="width: {rem}rem">
    <InlineNotification
      kind="info"
      title="Deployment finished"
      subtitle="billing-api is live in 3 regions."
    >
      <svelte:fragment slot="actions">
        <NotificationActionButton>View logs</NotificationActionButton>
      </svelte:fragment>
    </InlineNotification>
  </div>
{/each}
