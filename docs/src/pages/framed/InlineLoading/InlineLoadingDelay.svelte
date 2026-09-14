<script>
  import { Button, InlineLoading, Stack, Text } from "carbon-components-svelte";

  const descriptionMap = {
    active: "Saving...",
    finished: "Saved",
  };

  let status = undefined;

  async function simulateSave(duration) {
    status = "active";
    await new Promise((resolve) => setTimeout(resolve, duration));
    status = "finished";
  }
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={5} align="center">
    <Button on:click={() => simulateSave(100)}>Fast save (100 ms)</Button>
    <Button on:click={() => simulateSave(2000)}>Slow save (2 s)</Button>
    {#if status}
      <InlineLoading
        {status}
        description={descriptionMap[status]}
        delay={250}
      />
    {/if}
  </Stack>

  <Text type="helper-text-01">
    The fast save finishes before the 250 ms delay elapses, so it never shows
    the pending state.
  </Text>
</Stack>
