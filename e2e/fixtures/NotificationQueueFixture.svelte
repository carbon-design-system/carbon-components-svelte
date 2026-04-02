<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  let queue;
</script>

<div data-testid="notification-queue-root">
  <NotificationQueue bind:this={queue} maxNotifications={2} />
  <Button
    data-testid="nq-add"
    on:click={() => {
      queue?.add({ title: "Toast A" });
    }}
  >
    Add toast
  </Button>
  <Button
    data-testid="nq-t1"
    on:click={() => {
      queue?.add({ title: "T1" });
    }}
  >
    T1
  </Button>
  <Button
    data-testid="nq-t2"
    on:click={() => {
      queue?.add({ title: "T2" });
    }}
  >
    T2
  </Button>
  <Button
    data-testid="nq-t3"
    on:click={() => {
      queue?.add({ title: "T3" });
    }}
  >
    T3
  </Button>
  <Button
    data-testid="nq-timed"
    on:click={() => {
      queue?.add({ title: "Quick", timeout: 400 });
    }}
  >
    Add timed
  </Button>
</div>
