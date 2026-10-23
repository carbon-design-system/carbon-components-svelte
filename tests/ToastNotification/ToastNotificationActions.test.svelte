<script lang="ts">
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";

  export let href: string | undefined = undefined;
</script>

<ToastNotification
  title="Upload failed"
  subtitle="The connection timed out."
  caption="10:42 AM"
>
  <svelte:fragment slot="actions">
    <NotificationActionButton {href}>Retry</NotificationActionButton>
  </svelte:fragment>
</ToastNotification>
