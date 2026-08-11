<script>
  import {
    NotificationActionButton,
    Stack,
    ToastNotification,
  } from "carbon-components-svelte";

  let open = true;
  let restored = false;

  function undo() {
    restored = true;
    open = false;
  }
</script>

<Stack gap={5}>
  {#if open}
    <ToastNotification
      kind="success"
      title="Item deleted"
      subtitle="You can undo this action."
      caption={new Date().toLocaleString()}
      bind:open
    >
      <svelte:fragment slot="actions">
        <NotificationActionButton on:click={undo}
          >Undo</NotificationActionButton
        >
      </svelte:fragment>
    </ToastNotification>
  {:else if restored}
    <p>Item restored.</p>
  {/if}
</Stack>
