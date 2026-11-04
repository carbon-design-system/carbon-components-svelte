<script>
  import { MediaPlayer } from "carbon-components-svelte";

  const tracks = /** @type {const} */ ([
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
  ]);
</script>

<MediaPlayer
  aria-label="Setup walkthrough with captions"
  src="/media/sample.webm"
  {tracks}
/>
