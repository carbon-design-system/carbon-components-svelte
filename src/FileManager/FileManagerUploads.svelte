<script>
  /**
   * The upload list of `FileManager`: a progress bar for each file, with
   * cancel, retry and remove. Internal.
   * @event {{ id: string }} cancel
   * @event {{ id: string }} retry
   * @event {{ id: string }} dismiss
   * @event {null} clear
   */

  /**
   * @typedef {Object} UploadItem
   * @property {string} id
   * @property {string} name
   * @property {string} path
   * @property {number} size
   * @property {number} loaded
   * @property {"queued" | "uploading" | "complete" | "error" | "canceled"} status
   * @property {string} [message]
   */

  /** @type {ReadonlyArray<UploadItem>} */
  export let items = [];

  /** @type {import("./texts.js").FileManagerTexts} */
  export let texts;

  export let id = "file-manager-uploads";

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import ProgressBar from "../ProgressBar/ProgressBar.svelte";
  import Close from "../icons/Close.svelte";
  import Restart from "../icons/Restart.svelte";
  import { formatFileSize } from "../utils/format-file-size.js";

  const dispatch = createEventDispatcher();

  /** @param {UploadItem} item */
  function helper(item) {
    if (item.status === "queued") return texts.uploadQueued;
    if (item.status === "canceled") return texts.uploadCanceled;
    if (item.status === "error") return item.message || texts.uploadFailed;
    return formatFileSize(item.size);
  }

  /** @param {UploadItem} item */
  function barStatus(item) {
    if (item.status === "complete") return "finished";
    if (item.status === "error" || item.status === "canceled") return "error";
    return "active";
  }

  $: done = items.filter((item) => item.status === "complete").length;
  $: finished = items.some((item) =>
    ["complete", "error", "canceled"].includes(item.status),
  );
</script>

{#if items.length > 0}
  <section class:bx--file-manager__uploads={true} aria-labelledby="{id}-title">
    <div class:bx--file-manager__uploads-header={true}>
      <h3 id="{id}-title" class:bx--file-manager__uploads-title={true}>
        {texts.uploadsTitle(done, items.length)}
      </h3>
      {#if finished}
        <Button kind="ghost" size="sm" on:click={() => dispatch("clear")}>
          {texts.uploadClear}
        </Button>
      {/if}
    </div>
    <ul class:bx--file-manager__uploads-list={true}>
      {#each items as item (item.id)}
        <li class:bx--file-manager__upload={true} data-status={item.status}>
          <div class:bx--file-manager__upload-bar={true}>
            <ProgressBar
              size="sm"
              labelText={item.name}
              helperText={helper(item)}
              status={barStatus(item)}
              value={item.status === "queued"
                ? 0
                : item.size > 0
                  ? Math.round((item.loaded / item.size) * 100)
                  : item.status === "complete"
                    ? 100
                    : 0}
              max={100}
              errorText={item.status === "canceled"
                ? texts.uploadCanceled
                : texts.uploadFailed}
            />
          </div>
          {#if item.status === "queued" || item.status === "uploading"}
            <Button
              kind="ghost"
              size="sm"
              icon={Close}
              iconDescription="{texts.uploadCancel}: {item.name}"
              tooltipPosition="top"
              on:click={() => dispatch("cancel", { id: item.id })}
            />
          {:else}
            {#if item.status === "error" || item.status === "canceled"}
              <Button
                kind="ghost"
                size="sm"
                icon={Restart}
                iconDescription="{texts.uploadRetry}: {item.name}"
                tooltipPosition="top"
                on:click={() => dispatch("retry", { id: item.id })}
              />
            {/if}
            <Button
              kind="ghost"
              size="sm"
              icon={Close}
              iconDescription="{texts.uploadDismiss}: {item.name}"
              tooltipPosition="top"
              on:click={() => dispatch("dismiss", { id: item.id })}
            />
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}
