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
  import { decodeText, languageOf, readBytes } from "../file-preview.js";
  import FilePreviewCode from "./FilePreviewCode.svelte";

  const dispatch = createEventDispatcher();

  let text = "";
  /** @type {string[]} */
  let notes = [];
  const language = languageOf(file.mime, file.name);
  let loaded = false;

  onMount(() => {
    let alive = true;
    readBytes(file.blob).then(
      (bytes) => {
        if (!alive) return;
        const decoded = decodeText(bytes, file.truncated);
        if (decoded.binary) {
          // The name or type said text; the bytes are not.
          dispatch("fallback", { reason: "unsupported" });
          return;
        }
        text = decoded.text;
        const next = [];
        if (file.truncated) {
          next.push(
            options.texts.truncated(file.blob.size, file.size, "bytes"),
          );
        }
        if (decoded.encoding !== "utf-8") {
          next.push(options.texts.encoding(decoded.encoding));
        }
        notes = next;
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
  <FilePreviewCode
    {text}
    {language}
    name={file.name}
    dir={language ? "ltr" : "auto"}
    {notes}
    {options}
  />
{/if}
