<script>
  import {
    Button,
    LocalStorage,
    NotificationQueue,
    NotificationsPanel,
    Stack,
  } from "carbon-components-svelte";

  let queue;
  let doNotDisturb = false;
  let count = 0;
  let notifications = [];

  function send() {
    count += 1;
    const notification = {
      id: `n${count}`,
      kind: "info",
      title: `Report ${count} is ready`,
      timestamp: Date.now(),
      unread: true,
    };
    notifications = [notification, ...notifications];
    // Do Not Disturb silences the toast. The panel still lists it.
    if (!doNotDisturb)
      queue.add({ kind: "info", title: notification.title, timeout: 3000 });
  }
</script>

<LocalStorage key="notifications-panel-dnd" bind:value={doNotDisturb} />
<NotificationQueue bind:this={queue} />

<Stack gap={5}>
  <Button size="small" on:click={send}>Send a notification</Button>
  <NotificationsPanel
    {notifications}
    doNotDisturbLabelText="Do not disturb"
    bind:doNotDisturb
    style="--ccs-notifications-panel-max-height: 24rem"
    on:dismiss={({ detail }) => {
      notifications = notifications.filter(
        (n) => n.id !== detail.notification.id,
      );
    }}
    on:dismiss:all={() => (notifications = [])}
  />
</Stack>
