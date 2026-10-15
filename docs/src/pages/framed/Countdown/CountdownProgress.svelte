<script>
  import {
    Button,
    Countdown,
    ProgressBar,
    Stack,
  } from "carbon-components-svelte";

  const HOLD = 600;
  let remaining = HOLD;
  let running = true;
</script>

<Stack gap={5}>
  <Countdown seconds={HOLD} bind:remaining bind:running let:formatted>
    <ProgressBar
      size="sm"
      labelText="Seats held"
      value={remaining}
      max={HOLD}
      valueText={formatted}
      helperText={remaining
        ? "Check out before the hold ends."
        : "The hold has ended."}
    />
  </Countdown>
  <Stack orientation="horizontal" gap={3}>
    <Button kind="tertiary" size="small" on:click={() => (remaining += 300)}>
      Add 5 minutes
    </Button>
    <Button kind="ghost" size="small" on:click={() => (running = !running)}>
      {running ? "Pause" : "Resume"}
    </Button>
  </Stack>
</Stack>
