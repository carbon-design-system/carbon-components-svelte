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
  // The bar's full length. Added time fills the bar back up, and grows it
  // when the hold would pass its first length.
  let total = HOLD;

  function extend() {
    remaining += 300;
    total = Math.max(total, remaining);
  }
</script>

<Stack gap={5}>
  <Countdown seconds={total} bind:remaining bind:running let:formatted>
    <ProgressBar
      size="sm"
      labelText="Seats held"
      value={remaining}
      max={total}
      valueText={formatted}
      helperText={remaining
        ? "Check out before the hold ends."
        : "The hold has ended."}
    />
  </Countdown>
  <Stack orientation="horizontal" gap={3}>
    <Button kind="tertiary" size="small" on:click={extend}>
      Add 5 minutes
    </Button>
    <Button kind="ghost" size="small" on:click={() => (running = !running)}>
      {running ? "Pause" : "Resume"}
    </Button>
  </Stack>
</Stack>
