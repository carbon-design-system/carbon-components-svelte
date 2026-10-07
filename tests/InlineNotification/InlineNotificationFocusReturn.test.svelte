<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";

  let open = true;
</script>

<button type="button">Before</button>

<InlineNotification bind:open title="Saved">
  <svelte:fragment slot="actions">
    <NotificationActionButton on:click={() => (open = false)}>
      Undo
    </NotificationActionButton>
  </svelte:fragment>
</InlineNotification>
