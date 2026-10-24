<script lang="ts">
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";

  export let href: string | undefined = undefined;
  export let timeout = 0;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<ToastNotification
  title="Upload failed"
  subtitle="The connection timed out."
  caption="10:42 AM"
  {timeout}
  on:close={(event) => onclose?.(event)}
>
  <svelte:fragment slot="actions">
    <NotificationActionButton {href}>Retry</NotificationActionButton>
  </svelte:fragment>
</ToastNotification>
