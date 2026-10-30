<script>
  import { Button, Loading, Stack, Text } from "carbon-components-svelte";

  let active = false;

  async function simulateRequest(duration) {
    active = true;
    await new Promise((resolve) => setTimeout(resolve, duration));
    active = false;
  }
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={5} align="center">
    <Button on:click={() => simulateRequest(150)}>Fast request (150 ms)</Button>
    <Button kind="secondary" on:click={() => simulateRequest(400)}>
      Request (400 ms)
    </Button>
    <Button kind="tertiary" on:click={() => simulateRequest(2000)}>
      Slow request (2 s)
    </Button>
    <Loading withOverlay={false} small {active} delay={300} />
  </Stack>

  <Text type="helper-text-01">
    The fast request finishes before the 300 ms delay, so it shows no spinner.
    The 400 ms request shows the spinner at 300 ms and keeps it until 800 ms.
  </Text>
</Stack>
