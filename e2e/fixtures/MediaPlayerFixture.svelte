<script>
  import { MediaPlayer } from "carbon-components-svelte";

  const tracks = [
    {
      src: "/media/captions-en.vtt",
      kind: "captions",
      srclang: "en",
      label: "English",
    },
    {
      src: "/media/captions-es.vtt",
      kind: "subtitles",
      srclang: "es",
      label: "Español",
    },
    { src: "/media/chapters.vtt", kind: "chapters", srclang: "en" },
  ];

  // Four seconds of a quiet tone as 8-bit mono PCM: a real file, with no
  // network and no encoder, that every engine plays.
  function wavUrl() {
    const rate = 8000;
    const samples = rate * 4;
    const bytes = new Uint8Array(44 + samples);
    const view = new DataView(bytes.buffer);
    const text = (/** @type {number} */ at, /** @type {string} */ value) => {
      for (let i = 0; i < value.length; i++) {
        bytes[at + i] = value.charCodeAt(i);
      }
    };
    text(0, "RIFF");
    view.setUint32(4, 36 + samples, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    text(36, "data");
    view.setUint32(40, samples, true);
    for (let i = 0; i < samples; i++) {
      bytes[44 + i] =
        128 + Math.round(20 * Math.sin((i / rate) * 440 * 2 * Math.PI));
    }
    return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
  }

  let paused = true;
  let currentTime = 0;
  let volume = 1;
  let muted = false;
  let playbackRate = 1;
</script>

<MediaPlayer
  data-testid="video"
  aria-label="Training video"
  src="/media/clip.webm"
  {tracks}
  preload="auto"
  autoHideDelay={800}
  bind:paused
  bind:currentTime
  bind:volume
  bind:muted
  bind:playbackRate
/>
<p data-testid="bound">
  {paused ? "paused" : "playing"}
  {currentTime.toFixed(1)}
  {volume.toFixed(2)}
  {muted}
  {playbackRate}
</p>

<MediaPlayer
  data-testid="audio"
  variant="audio"
  aria-label="Podcast"
  src={wavUrl()}
  preload="auto"
/>
