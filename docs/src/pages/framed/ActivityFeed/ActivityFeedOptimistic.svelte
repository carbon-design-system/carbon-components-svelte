<script>
  import {
    ActivityComposer,
    ActivityFeed,
    createActivityFeed,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  const ada = { id: "ada", name: "Ada Okafor" };
  const marcus = { id: "marcus", name: "Marcus Oyelaran" };

  let offline = false;

  // For demo purposes only: a real handler calls your API.
  async function request() {
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (offline) throw new Error("The server is not reachable");
  }

  const feed = createActivityFeed({
    user: ada,
    items: [
      {
        id: "c1",
        kind: "comment",
        author: marcus,
        createdAt: Date.now() - 30 * 60_000,
        body: "Rollback is ready. Say the word and I will start it.",
      },
      {
        id: "c2",
        kind: "comment",
        author: ada,
        createdAt: Date.now() - 12 * 60_000,
        body: "Hold off until the cache has warmed up.",
        reactions: [{ emoji: "👍", userIds: ["marcus"] }],
      },
    ],
    onAdd: async ({ body }) => {
      await request();
      return {
        id: crypto.randomUUID(),
        kind: "comment",
        author: ada,
        createdAt: Date.now(),
        body,
      };
    },
    onEdit: request,
    onDelete: request,
    onReact: request,
  });
</script>

<Stack gap={5}>
  <Toggle
    labelText="Server"
    labelA="Online"
    labelB="Offline"
    bind:toggled={offline}
  />
  <ActivityFeed
    items={$feed.items}
    user={ada}
    errors={$feed.errors}
    on:react={(event) => feed.react(event.detail.id, event.detail.emoji)}
    on:reply={(event) => feed.add(event.detail.body, event.detail.parentId)}
    on:edit={(event) => feed.edit(event.detail.id, event.detail.body)}
    on:delete={(event) => feed.remove(event.detail.id)}
    on:retry={(event) => feed.retry(event.detail.id)}
    on:discard={(event) => feed.discard(event.detail.id)}
    on:dismiss={(event) => feed.dismiss(event.detail.id)}
  />
  <ActivityComposer on:submit={(event) => feed.add(event.detail.body)} />
</Stack>
