<script lang="ts">
  import ActivityComposer from "carbon-components-svelte/ActivityFeed/ActivityComposer.svelte";
  import ActivityFeed from "carbon-components-svelte/ActivityFeed/ActivityFeed.svelte";

  const grace = { id: "grace", name: "Grace Hopper" };
  const ada = { id: "ada", name: "Ada Lovelace" };
</script>

<ActivityFeed
  user={ada}
  now={Date.parse("2026-03-02T12:00:00Z")}
  locale="en-US"
  timeZone="UTC"
  draftKey="thread"
  items={[
    {
      id: "e1",
      kind: "event",
      author: grace,
      createdAt: Date.parse("2026-03-01T09:00:00Z"),
      body: "assigned @[Ada Lovelace](ada)",
    },
    {
      id: "c1",
      kind: "comment",
      author: grace,
      createdAt: Date.parse("2026-03-02T10:00:00Z"),
      editedAt: Date.parse("2026-03-02T10:30:00Z"),
      body: "<script>alert(1)</scr" + "ipt> **bold**",
      reactions: [{ emoji: "\u{1F44D}", userIds: ["ada"] }],
      replies: [
        {
          id: "r1",
          kind: "comment",
          author: ada,
          createdAt: Date.parse("2026-03-02T11:00:00Z"),
          body: "On it",
        },
      ],
    },
  ]}
/>
<ActivityComposer draftKey="thread:new" />
