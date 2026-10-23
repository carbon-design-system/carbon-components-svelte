<script>
  import {
    Button,
    InlineNotification,
    NotificationActionButton,
    ToastNotification,
  } from "carbon-components-svelte";

  let inlineOpen = false;
  let toastOpen = false;
</script>

<Button on:click={() => (inlineOpen = true)}>Delete file</Button>
<Button on:click={() => (toastOpen = true)}>Upload</Button>

<InlineNotification
  bind:open={inlineOpen}
  actionable
  kind="success"
  title="File deleted"
  subtitle="quarterly-report.pdf moved to the trash."
>
  <svelte:fragment slot="actions">
    <NotificationActionButton on:click={() => (inlineOpen = false)}>
      Undo
    </NotificationActionButton>
  </svelte:fragment>
</InlineNotification>

<ToastNotification
  bind:open={toastOpen}
  actionable
  lowContrast
  title="Upload failed"
  subtitle="The connection timed out."
>
  <svelte:fragment slot="actions">
    <NotificationActionButton on:click={() => (toastOpen = false)}>
      Retry
    </NotificationActionButton>
  </svelte:fragment>
</ToastNotification>
