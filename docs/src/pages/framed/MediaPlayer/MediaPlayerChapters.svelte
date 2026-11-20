<script>
  import { MediaPlayer } from "carbon-components-svelte";

  const chapters = [
    { start: 0, title: "Introduction" },
    { start: 2.5, title: "Setting up" },
    { start: 5.5, title: "Wrap-up" },
  ];
</script>

<MediaPlayer
  aria-label="Setup walkthrough with chapters"
  src="/media/sample.webm"
  {chapters}
/>
