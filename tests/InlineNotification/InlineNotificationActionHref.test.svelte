<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
</script>

<InlineNotification
  kind="info"
  title="New features available:"
  subtitle="Check out what's new."
>
  <svelte:fragment slot="actions">
    <NotificationActionButton
      href="https://example.com/releases"
      target="_blank"
      >View release notes</NotificationActionButton
    >
  </svelte:fragment>
</InlineNotification>
