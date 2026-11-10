<script>
  import {
    ActivityFeed,
    Button,
    createActivityFeed,
    Stack,
  } from "carbon-components-svelte";

  const ada = { id: "ada", name: "Ada Okafor" };
  const grace = { id: "grace", name: "Grace Lindqvist" };

  const hours = (count) => Date.now() - count * 3_600_000;

  // Thirty comments, newest last. The first page holds the latest ten.
  const all = Array.from({ length: 30 }, (_, index) => ({
    id: `c${index}`,
    kind: /** @type {const} */ ("comment"),
    author: index % 3 === 0 ? ada : grace,
    createdAt: hours(30 - index),
    body: `Update ${index + 1}: the batch finished and the next one starts on the hour.`,
  }));

  let received = 0;

  const feed = createActivityFeed({
    user: ada,
    items: all.slice(20),
    hasOlder: true,
    onLoadOlder: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { items: all.slice(0, 20), hasOlder: false };
    },
  });

  function receive() {
    received += 1;
    feed.receive([
      {
        id: `incoming-${received}`,
        kind: "comment",
        author: grace,
        createdAt: Date.now(),
        body: `New from Grace (${received}): the queue is empty.`,
      },
    ]);
  }
</script>

<Stack gap={5}>
  <Button kind="tertiary" size="sm" on:click={receive}>
    Simulate a new comment
  </Button>
  <ActivityFeed
    items={$feed.items}
    user={ada}
    hasOlder={$feed.hasOlder}
    loadingOlder={$feed.loadingOlder}
    errors={$feed.errors}
    height="24rem"
    on:load:older={() => feed.loadOlder()}
    on:dismiss={(event) => feed.dismiss(event.detail.id)}
  />
</Stack>
