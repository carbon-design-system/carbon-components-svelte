<script>
  /**
   * @event {null} ready
   * @event {{ reason: "unreadable" }} fallback
   */

  /**
   * Specify the file to play.
   * @type {import("../file-preview.js").PreviewFile}
   */
  export let file;

  /**
   * Specify what the renderer is given. Unused here: the browser's own
   * controls have their own labels.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { createEventDispatcher } from "svelte";
  import Document from "../../icons/Document.svelte";
  import { fileKind } from "../file-preview.js";

  const dispatch = createEventDispatcher();

  $: video = fileKind(file.mime, file.name) === "video";
  $: void options;

  // The frame is 16:9 until the video says how wide it is.
  let ratio = "16 / 9";

  /** @param {Event} event */
  function sized(event) {
    const element = /** @type {HTMLVideoElement} */ (event.currentTarget);
    if (element.videoWidth > 0 && element.videoHeight > 0) {
      ratio = `${element.videoWidth} / ${element.videoHeight}`;
    }
    dispatch("ready");
  }

  function failed() {
    dispatch("fallback", { reason: "unreadable" });
  }
</script>

{#if video}
  <div class:bx--file-preview__video={true} style:aspect-ratio={ratio}>
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
      controls
      playsinline
      preload="metadata"
      src={file.url}
      aria-label={file.name}
      on:loadedmetadata={sized}
      on:error={failed}
    ></video>
  </div>
{:else}
  <div class:bx--file-preview__audio={true}>
    <Document size={32} aria-hidden="true" />
    <!-- svelte-ignore a11y-media-has-caption -->
    <audio
      controls
      preload="metadata"
      src={file.url}
      aria-label={file.name}
      on:loadedmetadata={() => dispatch("ready")}
      on:error={failed}
    ></audio>
  </div>
{/if}
