<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
</script>

<InlineNotification kind="warning">
  <strong slot="titleChildren">Custom Title:</strong>
  <strong slot="subtitleChildren">Custom subtitle content.</strong>
  <svelte:fragment slot="actions">
    <NotificationActionButton>Learn more</NotificationActionButton>
  </svelte:fragment>
</InlineNotification>
