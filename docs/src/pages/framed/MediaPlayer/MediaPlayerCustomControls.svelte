<script>
  import { Button, formatClock, MediaPlayer } from "carbon-components-svelte";
</script>

<MediaPlayer aria-label="Setup walkthrough" src="/media/sample.webm">
  <svelte:fragment slot="controls" let:state let:actions>
    <Button size="sm" on:click={() => actions.toggle()}>
      {state.paused ? "Play" : "Pause"}
    </Button>
    <Button size="sm" kind="ghost" on:click={() => actions.seekBy(-5)}>
      Back 5 s
    </Button>
    <span>{formatClock(state.currentTime)} / {formatClock(state.duration)}</span
    >
  </svelte:fragment>
</MediaPlayer>
