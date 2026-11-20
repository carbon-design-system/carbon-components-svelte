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
   * Specify what the renderer is given.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { createEventDispatcher, onMount } from "svelte";
  import { decodeText, prettyJson, readBytes } from "../file-preview.js";
  import FilePreviewCode from "./FilePreviewCode.svelte";

  const dispatch = createEventDispatcher();

  let text = "";
  /** @type {string[]} */
  let notes = [];
  let loaded = false;

  onMount(() => {
    let alive = true;
    readBytes(file.blob).then(
      (bytes) => {
        if (!alive) return;
        const decoded = decodeText(bytes);
        if (decoded.binary) {
          dispatch("fallback", { reason: "unsupported" });
          return;
        }
        // Invalid JSON shows as it is, still as source.
        text = prettyJson(decoded.text) ?? decoded.text;
        if (decoded.encoding !== "utf-8") {
          notes = [options.texts.encoding(decoded.encoding)];
        }
        loaded = true;
        dispatch("ready");
      },
      () => alive && dispatch("fallback", { reason: "unreadable" }),
    );
    return () => {
      alive = false;
    };
  });
</script>

{#if loaded}
  <FilePreviewCode {text} language="json" name={file.name} {notes} {options} />
{/if}
