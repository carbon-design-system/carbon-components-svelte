<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import NotificationQueue from "carbon-components-svelte/Notification/NotificationQueue.svelte";
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";

  let showInline = true;
  let showToast = true;
  let queue: NotificationQueue;
  let count = 0;
</script>

<Button data-testid="toggle-inline" on:click={() => (showInline = !showInline)}
  >Toggle inline</Button
>
<Button data-testid="toggle-toast" on:click={() => (showToast = !showToast)}
  >Toggle toast</Button
>
<Button
  data-testid="queue-add"
  on:click={() => {
    count += 1;
    queue.add({ title: `Toast ${count}`, subtitle: "Saved to drafts" });
  }}>Add to queue</Button
>
<Button data-testid="queue-clear" on:click={() => queue.clear()}
  >Clear queue</Button
>

{#if showInline}
  <InlineNotification
    transition
    data-testid="inline"
    kind="info"
    title="Update available"
    subtitle="Restart the app to finish installing."
    on:close={() => (showInline = false)}
  />
{/if}
<p data-testid="below-inline">Content below</p>

{#if showToast}
  <ToastNotification
    transition
    data-testid="toast"
    kind="success"
    title="Report exported"
    subtitle="The file is ready."
    on:close={() => (showToast = false)}
  />
{/if}

<NotificationQueue bind:this={queue} transition maxNotifications={5} />
