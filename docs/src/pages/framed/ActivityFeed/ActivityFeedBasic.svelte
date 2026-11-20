<script>
  import {
    ActivityComposer,
    ActivityFeed,
    createActivityFeed,
    Stack,
  } from "carbon-components-svelte";

  const ada = { id: "ada", name: "Ada Okafor" };
  const grace = { id: "grace", name: "Grace Lindqvist" };
  const marcus = { id: "marcus", name: "Marcus Oyelaran" };
  const people = [grace, marcus].map(({ id, name }) => ({ id, text: name }));

  const minutes = (count) => Date.now() - count * 60_000;

  const feed = createActivityFeed({
    user: ada,
    items: [
      {
        id: "e1",
        kind: "event",
        author: grace,
        createdAt: minutes(190),
        body: "changed the status to **Investigating**",
      },
      {
        id: "e2",
        kind: "event",
        author: grace,
        createdAt: minutes(185),
        body: "added the label `p1`",
      },
      {
        id: "c1",
        kind: "comment",
        author: grace,
        createdAt: minutes(120),
        body: "Failover to `eu-west-2` finished at 14:02. Error rate is back under 1%.\n\nRunbook: https://example.com/runbooks/failover",
        reactions: [
          { emoji: "👍", userIds: ["ada", "marcus"] },
          { emoji: "🎉", userIds: ["marcus"] },
        ],
        replies: [
          {
            id: "r1",
            kind: "comment",
            author: marcus,
            createdAt: minutes(95),
            body: "Confirmed from the dashboard. I will keep watching until 16:00.",
          },
        ],
      },
      {
        id: "e3",
        kind: "event",
        author: marcus,
        createdAt: minutes(40),
        body: "assigned @[Ada Okafor](ada)",
      },
      {
        id: "c2",
        kind: "comment",
        author: ada,
        createdAt: minutes(12),
        body: "Taking this. @[Grace Lindqvist](grace) can you share the timeline for the post-mortem?",
      },
    ],
    // For demo purposes only: a real handler calls your API.
    onAdd: async ({ body }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        id: crypto.randomUUID(),
        kind: "comment",
        author: ada,
        createdAt: Date.now(),
        body,
      };
    },
    onEdit: () => new Promise((resolve) => setTimeout(resolve, 300)),
    onDelete: () => new Promise((resolve) => setTimeout(resolve, 300)),
    onReact: () => new Promise((resolve) => setTimeout(resolve, 200)),
  });
</script>

<Stack gap={5}>
  <ActivityFeed
    items={$feed.items}
    user={ada}
    errors={$feed.errors}
    mentionItems={people}
    height="28rem"
    on:react={(event) => feed.react(event.detail.id, event.detail.emoji)}
    on:reply={(event) => feed.add(event.detail.body, event.detail.parentId)}
    on:edit={(event) => feed.edit(event.detail.id, event.detail.body)}
    on:delete={(event) => feed.remove(event.detail.id)}
    on:retry={(event) => feed.retry(event.detail.id)}
    on:discard={(event) => feed.discard(event.detail.id)}
    on:dismiss={(event) => feed.dismiss(event.detail.id)}
  />
  <ActivityComposer
    mentionItems={people}
    on:submit={(event) => feed.add(event.detail.body)}
  />
</Stack>
