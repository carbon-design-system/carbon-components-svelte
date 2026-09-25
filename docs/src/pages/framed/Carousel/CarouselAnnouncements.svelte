<script>
  import {
    Button,
    Carousel,
    CarouselItem,
    Stack,
    Tag,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";

  const backlog = [
    {
      tag: "Incident",
      type: "red",
      title: "Degraded builds in EU West",
      body: "Queue times are elevated. Builds are running but may take up to 10 minutes to start.",
    },
    {
      tag: "Billing",
      type: "cyan",
      title: "New invoice available",
      body: "Your September invoice is ready to download from the billing page.",
    },
    {
      tag: "Security",
      type: "purple",
      title: "Rotate your API tokens",
      body: "Tokens created before 2024 will stop working on November 1.",
    },
  ];

  let nextId = 3;
  let selectedIndex = 0;
  let announcements = [
    {
      id: 1,
      tag: "Maintenance",
      type: "warm-gray",
      title: "Database maintenance on Sunday",
      body: "Expect up to 5 minutes of read-only mode between 02:00 and 02:30 UTC.",
    },
    {
      id: 2,
      tag: "Feature",
      type: "green",
      title: "Preview environments are GA",
      body: "Every pull request now gets its own URL. No configuration needed.",
    },
  ];

  function add() {
    const next = backlog[(nextId - 3) % backlog.length];
    announcements = [...announcements, { id: nextId++, ...next }];
    selectedIndex = announcements.length - 1;
  }

  /** @param {number} id */
  function dismiss(id) {
    announcements = announcements.filter((item) => item.id !== id);
  }
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" justify="space-between" align="center">
    <span>
      {announcements.length}
      {announcements.length === 1 ? "announcement" : "announcements"}
    </span>
    <Button kind="tertiary" size="small" icon={Add} on:click={add}>
      Add announcement
    </Button>
  </Stack>

  {#if announcements.length > 0}
    <Carousel labelText="Announcements" bind:selectedIndex>
      {#each announcements as item (item.id)}
        <CarouselItem>
          <Stack gap={3}>
            <Stack
              orientation="horizontal"
              justify="space-between"
              align="center"
            >
              <Tag type={item.type} size="sm">{item.tag}</Tag>
              <Button
                kind="ghost"
                size="small"
                icon={Close}
                iconDescription="Dismiss announcement"
                tooltipPosition="left"
                on:click={() => dismiss(item.id)}
              />
            </Stack>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </Stack>
        </CarouselItem>
      {/each}
    </Carousel>
  {:else}
    <p>You're all caught up.</p>
  {/if}
</Stack>
