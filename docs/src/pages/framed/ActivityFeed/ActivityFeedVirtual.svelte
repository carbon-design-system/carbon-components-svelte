<script>
  import { ActivityFeed } from "carbon-components-svelte";

  const people = [
    { id: "ada", name: "Ada Okafor" },
    { id: "grace", name: "Grace Lindqvist" },
    { id: "marcus", name: "Marcus Oyelaran" },
  ];

  const kinds = /** @type {const} */ (["comment", "event"]);
  const start = Date.now() - 2000 * 20 * 60_000;

  const items = Array.from({ length: 2000 }, (_, index) => ({
    id: `item-${index}`,
    kind: kinds[index % 4 === 1 ? 1 : 0],
    author: people[index % people.length],
    createdAt: start + index * 20 * 60_000,
    body:
      index % 4 === 1
        ? "changed the status to **In review**"
        : `Deploy ${index + 1} finished. Smoke tests passed in ${40 + (index % 30)} seconds.`,
  }));
</script>

<ActivityFeed {items} user={people[0]} virtual height="28rem" />
