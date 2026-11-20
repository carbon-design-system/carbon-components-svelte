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
  import Button from "../../Button/Button.svelte";
  import { decodeText, readBytes } from "../file-preview.js";
  import { parseMarkdown } from "../markdown-lite.js";
  import FilePreviewMarkdownBlocks from "./FilePreviewMarkdownBlocks.svelte";

  // Blocks drawn at a time. A long README is drawn in steps, not at once.
  const STEP = 150;

  const dispatch = createEventDispatcher();

  /** @type {import("../markdown-lite.js").MarkdownBlock[]} */
  let blocks = [];
  /** @type {string[]} */
  let notes = [];
  let shown = STEP;
  let loaded = false;

  onMount(() => {
    let alive = true;
    readBytes(file.blob).then(
      (bytes) => {
        if (!alive) return;
        const decoded = decodeText(bytes, file.truncated);
        if (decoded.binary) {
          dispatch("fallback", { reason: "unsupported" });
          return;
        }
        blocks = parseMarkdown(decoded.text);
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

  $: visible = blocks.slice(0, shown);
  $: remaining = blocks.length > shown;

  function showMore() {
    shown += STEP;
  }
</script>

{#if loaded}
  <div class:bx--file-preview__text={true}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      class:bx--file-preview__document={true}
      role="group"
      aria-label={file.name}
      tabindex="0"
    >
      <FilePreviewMarkdownBlocks blocks={visible} {options} />
    </div>
    {#if remaining || notes.length > 0}
      <div class:bx--file-preview__footer={true}>
        {#each notes as note (note)}
          <span>{note}</span>
        {/each}
        {#if remaining}
          <Button kind="ghost" size="sm" on:click={showMore}>
            {options.texts.showMore}
          </Button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
