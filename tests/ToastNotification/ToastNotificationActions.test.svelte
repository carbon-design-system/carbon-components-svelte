<script lang="ts">
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";

  export let onAction: () => void = () => {};
</script>

<ToastNotification
  kind="success"
  title="Item deleted"
  subtitle="You can undo this action."
>
  <svelte:fragment slot="actions">
    <NotificationActionButton on:click={onAction}
      >Undo</NotificationActionButton
    >
  </svelte:fragment>
</ToastNotification>
