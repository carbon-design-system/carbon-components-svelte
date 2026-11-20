<script>
  import {
    Button,
    createMediaState,
    MediaScrubber,
    Stack,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const state = createMediaState();
  let video;

  onMount(() => state.attach(video));
</script>

<Stack gap={5}>
  <!-- svelte-ignore a11y-media-has-caption -->
  <video bind:this={video} src="/media/sample.webm" width="320" muted></video>
  <MediaScrubber
    currentTime={$state.currentTime}
    duration={$state.duration}
    buffered={$state.buffered}
    on:change={(event) => state.seek(event.detail.time)}
  />
  <Button size="sm" on:click={() => state.toggle()}>
    {$state.paused ? "Play" : "Pause"}
  </Button>
</Stack>
