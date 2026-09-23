<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
    RelativeTime,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
  } from "carbon-components-svelte";

  let queue;
  let history = [];
  let count = 0;
</script>

<NotificationQueue
  bind:this={queue}
  bind:history
  maxHistory={5}
  position="bottom-right"
/>

<ButtonSet>
  <Button
    on:click={() => {
      count += 1;
      queue.add({
        kind: "info",
        title: `Notification ${count}`,
        subtitle: "Close it to move it into history.",
      });
    }}
  >
    Add notification
  </Button>
  <Button kind="secondary" on:click={() => queue.clearHistory()}>
    Clear history
  </Button>
</ButtonSet>

<StructuredList condensed>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Dismissed</StructuredListCell>
      <StructuredListCell head>When</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each history as notification (notification.id)}
      <StructuredListRow>
        <StructuredListCell>{notification.title}</StructuredListCell>
        <StructuredListCell>
          <RelativeTime date={notification.dismissedAt} />
        </StructuredListCell>
      </StructuredListRow>
    {:else}
      <StructuredListRow>
        <StructuredListCell>No dismissed notifications</StructuredListCell>
        <StructuredListCell />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
