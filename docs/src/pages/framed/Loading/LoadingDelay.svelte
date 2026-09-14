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
    <Button on:click={() => simulateRequest(100)}>Fast request (100 ms)</Button>
    <Button on:click={() => simulateRequest(2000)}>Slow request (2 s)</Button>
    <Loading withOverlay={false} small {active} delay={250} />
  </Stack>

  <Text type="helper-text-01">
    The fast request finishes before the 250 ms delay elapses, so it never shows
    the spinner.
  </Text>
</Stack>
