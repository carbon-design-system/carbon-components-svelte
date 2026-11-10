<script lang="ts">
  import MediaScrubber from "carbon-components-svelte/MediaPlayer/MediaScrubber.svelte";

  export let currentTime = 65;
  export let duration = 240;
  export let buffered: ReadonlyArray<readonly [number, number]> = [];
  export let chapters: ReadonlyArray<{
    start: number;
    end: number;
    title: string;
  }> = [];
  export let disabled = false;
  export let onscrubstart: ((detail: { time: number }) => void) | undefined =
    undefined;
  export let oninput: ((detail: { time: number }) => void) | undefined =
    undefined;
  export let onchange: ((detail: { time: number }) => void) | undefined =
    undefined;
</script>

<MediaScrubber
  {currentTime}
  {duration}
  {buffered}
  {chapters}
  {disabled}
  locale="en"
  on:scrubstart={(e) => onscrubstart?.(e.detail)}
  on:input={(e) => oninput?.(e.detail)}
  on:change={(e) => onchange?.(e.detail)}
/>
