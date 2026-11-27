<script>
  import { Button, DiffViewer, Stack } from "carbon-components-svelte";

  const before = Array.from(
    { length: 60 },
    (_, i) => `replicas: ${i % 5 === 0 ? 2 : 3}  # service ${i + 1}`,
  ).join("\n");
  const after = Array.from(
    { length: 60 },
    (_, i) => `replicas: ${i % 5 === 0 ? 4 : 3}  # service ${i + 1}`,
  ).join("\n");

  let viewer;
  let current = -1;
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={3}>
    <Button size="small" kind="tertiary" on:click={() => viewer.goTo(0)}>
      First change
    </Button>
    <Button size="small" kind="tertiary" on:click={() => viewer.goTo(-1)}>
      Last change
    </Button>
    <Button size="small" kind="tertiary" on:click={() => viewer.expandAll()}>
      Show all lines
    </Button>
  </Stack>
  <p>Current change: {current < 0 ? "none" : current + 1}</p>
  <DiffViewer
    bind:this={viewer}
    bind:current
    oldText={before}
    newText={after}
    labelText="Replica counts"
    height={260}
  />
</Stack>
