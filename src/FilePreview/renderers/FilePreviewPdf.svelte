<script>
  /**
   * @event {null} ready
   * @event {{ reason: "unsupported" | "unreadable" }} fallback
   */

  /**
   * Specify the file to show.
   * @type {import("../file-preview.js").PreviewFile}
   */
  export let file;

  /**
   * Specify what the renderer is given. Unused here: the browser's own
   * viewer has its own toolbar.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { createEventDispatcher, onMount } from "svelte";
  import { readBytes } from "../file-preview.js";

  const dispatch = createEventDispatcher();

  // A PDF starts with "%PDF-". A file that says it is a PDF and is not one
  // (HTML, say) is never put in a frame.
  let verified = false;
  $: void options;

  onMount(() => {
    let alive = true;
    readBytes(file.blob.slice(0, 5)).then(
      (bytes) => {
        if (!alive) return;
        const head = String.fromCharCode(...bytes);
        if (head === "%PDF-") {
          verified = true;
        } else {
          dispatch("fallback", { reason: "unreadable" });
        }
      },
      () => alive && dispatch("fallback", { reason: "unreadable" }),
    );
    return () => {
      alive = false;
    };
  });
</script>

{#if verified}
  <!--
    No `sandbox`: Chromium refuses to open its PDF viewer in a sandboxed
    frame (it shows a blocked page, with every sandbox value). What stands in
    for it: the bytes must start with "%PDF-", and the blob URL is typed
    application/pdf, so the browser never parses it as HTML; the PDF itself
    runs in the browser's isolated viewer, not in this page.
  -->
  <iframe
    class:bx--file-preview__frame={true}
    title={file.name}
    src={file.url}
    referrerpolicy="no-referrer"
    on:load={() => dispatch("ready")}
  ></iframe>
{/if}
