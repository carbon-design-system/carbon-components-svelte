<script>
  import {
    Button,
    ButtonSet,
    ListItem,
    NotificationQueue,
    Stack,
    UnorderedList,
  } from "carbon-components-svelte";

  let queue;
  let count = 0;
  let log = [];
</script>

<NotificationQueue
  bind:this={queue}
  maxNotifications={2}
  on:dismiss={(e) => {
    const { notification, trigger } = e.detail;
    log = [`${notification.title}: ${trigger}`, ...log].slice(0, 5);
  }}
/>

<Stack gap={5}>
  <ButtonSet>
    <Button
      on:click={() => {
        count += 1;
        queue.add({
          id: `toast-${count}`,
          kind: "info",
          title: `Notification ${count}`,
          subtitle: "Close it, wait 5 seconds, or add more than two.",
          timeout: 5_000,
        });
      }}
    >
      Add notification
    </Button>
    <Button kind="secondary" on:click={() => queue.clear()}>Clear all</Button>
  </ButtonSet>

  <UnorderedList>
    {#each log as entry}
      <ListItem>{entry}</ListItem>
    {:else}
      <ListItem>No dismissals yet</ListItem>
    {/each}
  </UnorderedList>
</Stack>
