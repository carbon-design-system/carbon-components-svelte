<script lang="ts">
  import ActivityComposer from "carbon-components-svelte/ActivityFeed/ActivityComposer.svelte";
  import ActivityFeed from "carbon-components-svelte/ActivityFeed/ActivityFeed.svelte";
  import type { ActivityItem } from "carbon-components-svelte/ActivityFeed/activity-feed.js";
  import { createActivityFeed } from "carbon-components-svelte/ActivityFeed/activity-store.js";
  import { onMount } from "svelte";

  const started = performance.now();
  const params = new URLSearchParams(location.search);
  const count = Number(params.get("n") ?? 14);
  const virtual = params.get("virtual") === "1";
  const lazyRows = params.get("lazy") !== "0";
  const live = params.get("live") === "1";
  const height = params.get("height") ?? "30rem";
  const older = params.get("older") === "1";

  const people = [
    { id: "ada", name: "Ada Lovelace" },
    { id: "grace", name: "Grace Hopper" },
    { id: "alan", name: "Alan Turing" },
    { id: "katherine", name: "Katherine Johnson" },
    { id: "linus", name: "Linus Torvalds" },
    { id: "margaret", name: "Margaret Hamilton" },
  ];
  const me = people[0];

  const BASE = Date.parse("2026-03-01T08:00:00Z");
  const STEP = 37 * 60_000;
  const NOW = live
    ? undefined
    : BASE + count * STEP + (older ? 40 * STEP : 0) + 600_000;

  const bodies = [
    "Looks good to me.",
    "Could we **rename** this before merging? See https://example.com/rfc/12.",
    "I ran `bun test` locally and it passes.\n\nOne more thing: the *docs* need an update.",
    "@[Grace Hopper](grace) can you take a look at this?",
    "```\nconst x = await load();\nconsole.log(x);\n```\nThis is the failing case.",
    "> We should ship it\n\nAgreed. Shipping today.",
    "- first thing\n- second thing\n- third thing",
    "مرحبا بالجميع، هذا تعليق بالعربية مع كلمة English في المنتصف.",
    "A long one: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  ];
  const events = [
    "changed status to **Done**",
    "added the label `bug`",
    "assigned @[Alan Turing](alan)",
    "closed this as completed",
    "renamed the title",
  ];

  function make(index: number): ActivityItem {
    const author = people[(index * 7 + 1) % people.length];
    const createdAt = BASE + index * STEP;
    if (index % 5 === 1 || index % 5 === 2) {
      return {
        id: `e${index}`,
        kind: "event",
        author,
        createdAt,
        body: events[index % events.length],
      };
    }
    const replies =
      index % 7 === 0
        ? Array.from({ length: index % 14 === 0 ? 12 : 2 }, (_, r) => ({
            id: `c${index}r${r}`,
            kind: "comment" as const,
            author: people[(index + r + 2) % people.length],
            createdAt: createdAt + (r + 1) * 60_000,
            body: bodies[(index + r) % bodies.length],
          }))
        : undefined;
    return {
      id: `c${index}`,
      kind: "comment",
      author,
      createdAt,
      editedAt: index % 6 === 0 ? createdAt + 90_000 : undefined,
      body: bodies[index % bodies.length],
      reactions:
        index % 3 === 0
          ? [
              {
                emoji: "\u{1F44D}",
                userIds: ["ada", "grace", "alan"].slice(0, 1 + (index % 3)),
              },
              { emoji: "\u{1F389}", userIds: ["linus"] },
            ]
          : [],
      replies,
    };
  }

  const all = Array.from({ length: count + (older ? 40 : 0) }, (_, i) =>
    make(i),
  );
  const initial = older ? all.slice(40) : all;
  const olderPage = older ? all.slice(0, 40) : [];

  let fail = "";
  const feed = createActivityFeed({
    items: initial,
    user: me,
    hasOlder: older,
    now: () => NOW ?? Date.now(),
    onAdd: async (draft) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (fail === "add") throw new Error("offline");
      return {
        id: `saved-${draft.clientId}`,
        kind: "comment",
        author: me,
        createdAt: NOW ?? Date.now(),
        body: draft.body,
      };
    },
    onEdit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (fail === "edit") throw new Error("offline");
    },
    onDelete: async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (fail === "delete") throw new Error("offline");
    },
    onReact: async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (fail === "react") throw new Error("offline");
    },
    onLoadOlder: async () => ({ items: olderPage, hasOlder: false }),
  });

  let feedRef: ActivityFeed;
  let nextIncoming = count;

  onMount(() => {
    // Two frames after mount, the feed has been laid out and painted.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        (window as unknown as Record<string, unknown>).__activityMountMs =
          performance.now() - started;
      }),
    );
    // The page drives the feed: `receive` adds items as a socket would.
    (window as unknown as Record<string, unknown>).__activity = {
      feed,
      failNext(op: string) {
        fail = op;
      },
      receive(total = 1, author = people[2]) {
        const incoming = Array.from({ length: total }, () => ({
          id: `in${nextIncoming}`,
          kind: "comment" as const,
          author,
          createdAt: (NOW ?? Date.now()) + 1000 * ++nextIncoming,
          body: `Incoming comment ${nextIncoming}`,
        }));
        feed.receive(incoming);
      },
      scrollToEnd: () => feedRef.scrollToEnd(),
    };
  });
</script>

<div style="max-width: 44rem; padding: 1rem">
  <ActivityFeed
    bind:this={feedRef}
    items={$feed.items}
    user={me}
    hasOlder={$feed.hasOlder}
    loadingOlder={$feed.loadingOlder}
    errors={$feed.errors}
    now={NOW}
    locale="en-US"
    timeZone="UTC"
    {height}
    {virtual}
    {lazyRows}
    mentionItems={people
      .slice(1)
      .map((person) => ({ id: person.id, text: person.name }))}
    draftKey="fixture"
    data-testid="feed"
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
    draftKey="fixture:new"
    mentionItems={people
      .slice(1)
      .map((person) => ({ id: person.id, text: person.name }))}
    on:submit={(event) => feed.add(event.detail.body)}
  />
</div>
