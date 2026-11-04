<script>
  import { Button, MediaPlayer, Stack } from "carbon-components-svelte";

  let paused = true;
  let currentTime = 0;
  let playbackRate = 1;
</script>

<Stack gap={5}>
  <MediaPlayer
    aria-label="Setup walkthrough"
    src="/media/sample.webm"
    bind:paused
    bind:currentTime
    bind:playbackRate
  />
  <Stack orientation="horizontal" gap={3}>
    <Button size="sm" kind="tertiary" on:click={() => (currentTime = 5.5)}>
      Jump to "Wrap-up"
    </Button>
    <Button size="sm" kind="tertiary" on:click={() => (playbackRate = 2)}>
      Speed up
    </Button>
  </Stack>
  <p>
    {paused ? "Paused" : "Playing"} at {currentTime.toFixed(1)} s, {playbackRate}×
  </p>
</Stack>
