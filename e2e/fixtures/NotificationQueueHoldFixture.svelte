<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  // `?position=bottom-right` runs the same cases from the bottom edge.
  const position =
    new URLSearchParams(location.search).get("position") ?? "top-right";

  let queue;
  let count = 0;
</script>

<NotificationQueue bind:this={queue} {position} />
<Button
  data-testid="nq-hold-add"
  on:click={() => {
    count += 1;
    queue?.add({ title: `Toast ${count}`, subtitle: "Saved to drafts" });
  }}
>
  Add toast
</Button>
