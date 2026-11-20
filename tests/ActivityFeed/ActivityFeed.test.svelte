<svelte:options accessors />

<script lang="ts">
  import ActivityComposer from "carbon-components-svelte/ActivityFeed/ActivityComposer.svelte";
  import ActivityFeed from "carbon-components-svelte/ActivityFeed/ActivityFeed.svelte";
  import type { ActivityItem } from "carbon-components-svelte/ActivityFeed/activity-feed.js";
  import { createActivityFeed } from "carbon-components-svelte/ActivityFeed/activity-store.js";

  const ada = { id: "ada", name: "Ada Lovelace" };
  const grace = { id: "grace", name: "Grace Hopper" };
  const alan = { id: "alan", name: "Alan Turing" };

  const at = (iso: string) => Date.parse(iso);

  export let items: ActivityItem[] = [
    {
      id: "e1",
      kind: "event",
      author: grace,
      createdAt: at("2026-03-01T09:00:00Z"),
      body: "changed status to **In progress**",
    },
    {
      id: "e2",
      kind: "event",
      author: grace,
      createdAt: at("2026-03-01T09:05:00Z"),
      body: "added the label `bug`",
    },
    {
      id: "c1",
      kind: "comment",
      author: grace,
      createdAt: at("2026-03-01T10:00:00Z"),
      editedAt: at("2026-03-01T10:30:00Z"),
      body: "Looks like a **regression**. See https://example.com/issue.",
      reactions: [{ emoji: "\u{1F44D}", userIds: ["ada", "alan"] }],
      replies: ["a", "b", "c", "d"].map((letter, index) => ({
        id: `r${letter}`,
        kind: "comment" as const,
        author: index % 2 ? ada : alan,
        createdAt: at(`2026-03-01T1${index + 1}:00:00Z`),
        body: `Reply ${letter}`,
      })),
    },
    {
      id: "c2",
      kind: "comment",
      author: ada,
      createdAt: at("2026-03-02T08:00:00Z"),
      body: "Thanks, @[Grace Hopper](grace). I will take a look.",
    },
  ];
  export let hasOlder = false;
  export let onAdd: (draft: { body: string }) => Promise<ActivityItem> = async (
    draft,
  ) => ({
    id: `saved-${draft.body}`,
    kind: "comment",
    author: ada,
    createdAt: at("2026-03-02T09:00:00Z"),
    body: draft.body,
  });
  export let onEdit: (
    id: string,
    body: string,
  ) => Promise<void> = async () => {};
  export let onDelete: (id: string) => Promise<void> = async () => {};
  export let onReact: (
    id: string,
    emoji: string,
    on: boolean,
  ) => Promise<void> = async () => {};
  export let onLoadOlder = async () => ({
    items: [
      {
        id: "old",
        kind: "comment" as const,
        author: alan,
        createdAt: at("2026-02-01T09:00:00Z"),
        body: "An older comment",
      },
    ],
    hasOlder: false,
  });
  export let height: string | undefined = undefined;
  export let virtual = false;
  export let draftKey: string | undefined = undefined;

  export const people = [
    { id: "grace", text: "Grace Hopper", secondary: "ghopper" },
    { id: "alan", text: "Alan Turing", secondary: "aturing" },
  ];

  export const feed = createActivityFeed({
    items,
    user: ada,
    hasOlder,
    now: () => at("2026-03-02T09:00:00Z"),
    onAdd,
    onEdit,
    onDelete,
    onReact,
    onLoadOlder,
  });
</script>

<ActivityFeed
  items={$feed.items}
  user={ada}
  users={[alan]}
  hasOlder={$feed.hasOlder}
  loadingOlder={$feed.loadingOlder}
  errors={$feed.errors}
  now={at("2026-03-02T12:00:00Z")}
  locale="en-US"
  timeZone="UTC"
  mentionItems={people}
  {height}
  {virtual}
  {draftKey}
  on:react={(event) => feed.react(event.detail.id, event.detail.emoji)}
  on:reply={(event) => feed.add(event.detail.body, event.detail.parentId)}
  on:edit={(event) => feed.edit(event.detail.id, event.detail.body)}
  on:delete={(event) => feed.remove(event.detail.id)}
  on:retry={(event) => feed.retry(event.detail.id)}
  on:discard={(event) => feed.discard(event.detail.id)}
  on:load:older={() => feed.loadOlder()}
  on:dismiss={(event) => feed.dismiss(event.detail.id)}
/>
<ActivityComposer
  mentionItems={people}
  draftKey={draftKey ? `${draftKey}:new` : undefined}
  on:submit={(event) => feed.add(event.detail.body)}
/>
