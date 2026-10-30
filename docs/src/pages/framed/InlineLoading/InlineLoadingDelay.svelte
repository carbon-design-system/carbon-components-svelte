<script>
  import { Button, InlineLoading, Stack, Text } from "carbon-components-svelte";

  const descriptionMap = {
    active: "Saving...",
    finished: "Saved",
  };

  let status;

  async function simulateSave(duration) {
    status = "active";
    await new Promise((resolve) => setTimeout(resolve, duration));
    status = "finished";
  }
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={5} align="center">
    <Button on:click={() => simulateSave(150)}>Fast save (150 ms)</Button>
    <Button kind="secondary" on:click={() => simulateSave(400)}>
      Save (400 ms)
    </Button>
    <Button kind="tertiary" on:click={() => simulateSave(2000)}>
      Slow save (2 s)
    </Button>
    {#if status}
      <InlineLoading
        {status}
        description={descriptionMap[status]}
        delay={300}
      />
    {/if}
  </Stack>

  <Text type="helper-text-01">
    The fast save finishes before the 300 ms delay, so it goes straight to
    "Saved". The 400 ms save shows the spinner at 300 ms and keeps it until 800
    ms, then shows "Saved".
  </Text>
</Stack>
