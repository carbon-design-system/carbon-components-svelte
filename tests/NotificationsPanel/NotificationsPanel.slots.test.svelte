<script lang="ts">
  import NotificationsPanel from "carbon-components-svelte/NotificationsPanel/NotificationsPanel.svelte";

  export let notifications: { id: string; title: string; timestamp: number }[] =
    [];
</script>

<NotificationsPanel {notifications} now={Date.UTC(2026, 9, 27, 15)}>
  <button slot="actions" type="button">Settings</button>
  <p slot="empty">Nothing yet</p>
  <svelte:fragment slot="notification" let:notification>
    <em>Custom {notification.title}</em>
  </svelte:fragment>
</NotificationsPanel>
