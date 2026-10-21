<script lang="ts">
  import Callout from "carbon-components-svelte/Notification/Callout.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
</script>

<Callout title="Scheduled downtime">
  <svelte:fragment slot="actions">
    <NotificationActionButton {...$$restProps}>
      View schedule
    </NotificationActionButton>
  </svelte:fragment>
</Callout>
