<script lang="ts">
  import MediaPlayer from "carbon-components-svelte/MediaPlayer/MediaPlayer.svelte";

  export let paused = true;
  export let currentTime = 0;
  export let volume = 1;
  export let muted = false;
  export let playbackRate = 1;
  export let variant: "video" | "audio" = "video";
  export let autoHide = true;
  export let autoHideDelay = 3000;
  export let shortcuts = true;
  export let tracks: Array<{
    src: string;
    kind?: "subtitles" | "captions" | "chapters";
    srclang?: string;
    label?: string;
  }> = [];
</script>

<MediaPlayer
  data-testid="player"
  src="/clip.webm"
  {variant}
  {autoHide}
  {autoHideDelay}
  {shortcuts}
  {tracks}
  bind:paused
  bind:currentTime
  bind:volume
  bind:muted
  bind:playbackRate
/>
<input aria-label="Note" />
<p data-testid="bound">
  {paused}
  {currentTime}
  {volume}
  {muted}
  {playbackRate}
</p>
