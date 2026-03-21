<script>
  /**
   * @event {ReadonlyArray<File>} add
   * @event {ReadonlyArray<File>} remove
   * @event {ReadonlyArray<File>} change
   * @event {void} clear
   * @event {Array<{ file: File; reason: "size" | "duplicate" }>} rejected
   */

  /**
   * Specify the file uploader status.
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /** Set to `true` to disable the file uploader */
  export let disabled = false;

  /**
   * Specify the accepted file types.
   * @type {ReadonlyArray<string>}
   */
  export let accept = [];

  /**
   * Specify the maximum file size in bytes.
   * Files exceeding this limit will be filtered out.
   * File sizes use binary (base 2) units: 1024 bytes = 1 KiB, not 1000 bytes.
   * @type {number | undefined}
   * @example
   * ```svelte
   * <!-- 5 MB = 5 × 1024 × 1024 = 5,242,880 bytes -->
   * <FileUploader maxFileSize={5 * 1024 * 1024} />
   * ```
   */
  export let maxFileSize = undefined;

  /**
   * Obtain a reference to the uploaded files.
   * @type {ReadonlyArray<File>}
   */
  export let files = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /**
   * Set to `true` to reject files that match an already-selected file
   * (by name, size, and lastModified). Rejected duplicates are reported
   * via the `rejected` event with `reason: 'duplicate'`.
   */
  export let preventDuplicate = false;

  /**
   * Programmatically clear the uploaded files.
   * @type {() => void}
   * @example
   * ```svelte
   * <FileUploader bind:this={uploader} bind:files={files} />
   * <button on:click={() => uploader.clearFiles()}>Clear Files</button>
   * ```
   */
  export const clearFiles = () => {
    files = [];
  };

  /**
   * Specify the label title.
   * Alternatively, use the named slot "labelTitle".
   * @example
   * ```svelte
   * <FileUploader>
   *   <span slot="labelTitle">Custom Label</span>
   * </FileUploader>
   * ```
   */
  export let labelTitle = "";

  /**
   * Specify the label description.
   * Alternatively, use the named slot "labelDescription".
   * @example
   * ```svelte
   * <FileUploader>
   *   <span slot="labelDescription">Custom description text</span>
   * </FileUploader>
   * ```
   */
  export let labelDescription = "";

  /**
   * Specify the kind of file uploader button.
   * @type {import("../Button/Button.svelte").ButtonProps["kind"]}
   */
  export let kind = "primary";

  /**
   * Specify the size of the file uploader button.
   * @type {import("../Button/Button.svelte").ButtonProps["size"]}
   */
  export let size = "small";

  /** Specify the button label */
  export let buttonLabel = "";

  /**
   * Accessible label for file row status icons (spinner, remove control, checkmark).
   * Forwarded to `Filename`. When omitted or blank after trim, `Filename` uses:
   * - `uploading`: `Loading` description `"uploading"`
   * - `edit`: close button `aria-label` `"Remove file"`
   * - `complete`: checkmark `aria-label` / `title` `"Upload complete"`
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  /** Specify a name attribute for the file button uploader input */
  export let name = "";

  import { afterUpdate, createEventDispatcher } from "svelte";
  import Filename from "./Filename.svelte";
  import FileUploaderButton from "./FileUploaderButton.svelte";

  const dispatch = createEventDispatcher();

  let prevFiles = [];

  /** @type {(file: File, index: number) => string} */
  const getFileId = (file, index) =>
    `${file.lastModified + file.name}-${index}`;

  /** Stable keys for `{#each}` (and Biome-safe: no commas in the each header). */
  $: filesWithKeys = files.map((file, index) => ({
    file,
    key: getFileId(file, index),
  }));

  afterUpdate(() => {
    const fileIds = files.map((f, i) => getFileId(f, i));
    const prevFileIds = prevFiles.map((f, i) => getFileId(f, i));
    const addedIds = fileIds.filter((_) => !prevFileIds.includes(_));
    const removedIds = prevFileIds.filter((_) => !fileIds.includes(_));

    if (addedIds.length > 0) {
      dispatch(
        "add",
        addedIds.map((id) =>
          files.find((file, i) => id === getFileId(file, i)),
        ),
      );
    }

    if (removedIds.length > 0) {
      dispatch(
        "remove",
        removedIds.map((id) =>
          prevFiles.find((file, i) => id === getFileId(file, i)),
        ),
      );
    }

    if (prevFiles.length > 0 && files.length === 0) {
      dispatch("change", []);
      dispatch("clear");
    }

    prevFiles = [...files];
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if labelTitle || $$slots.labelTitle}
    <p
      class:bx--file--label={true}
      class:bx--label-description--disabled={disabled}
    >
      <slot name="labelTitle"> {labelTitle} </slot>
    </p>
  {/if}
  {#if labelDescription || $$slots.labelDescription}
    <p
      class:bx--label-description={true}
      class:bx--label-description--disabled={disabled}
    >
      <slot name="labelDescription"> {labelDescription} </slot>
    </p>
  {/if}
  <FileUploaderButton
    {disabled}
    disableLabelChanges
    labelText={buttonLabel}
    {accept}
    {name}
    {multiple}
    {kind}
    {size}
    bind:files
    on:change={(e) => {
      let newFiles = e.detail;
      const allRejected = [];

      if (maxFileSize !== undefined) {
        const rejected = newFiles.filter((file) => file.size > maxFileSize);
        newFiles = newFiles.filter((file) => file.size <= maxFileSize);

        if (rejected.length > 0) {
          allRejected.push(
            ...rejected.map((file) => ({ file, reason: "size" })),
          );
        }
      }

      if (preventDuplicate) {
        // In multiple mode, newFiles includes re-sent existing files
        // (same reference) plus newly selected ones. Only reject new
        // objects that match an existing file by content.
        const existingRefs = new Set(prevFiles);
        const existingKeys = new Set(
          prevFiles.map((f) => `${f.name}\0${f.size}\0${f.lastModified}`),
        );
        const isDuplicate = (f) =>
          !existingRefs.has(f) &&
          existingKeys.has(`${f.name}\0${f.size}\0${f.lastModified}`);
        const duplicates = newFiles.filter(isDuplicate);
        newFiles = newFiles.filter((f) => !isDuplicate(f));

        if (duplicates.length > 0) {
          allRejected.push(
            ...duplicates.map((file) => ({ file, reason: "duplicate" })),
          );
        }
      }

      if (allRejected.length > 0) {
        dispatch("rejected", allRejected);
      }

      files = newFiles;
      dispatch("change", newFiles);
    }}
  />
  <div class:bx--file-container={true}>
    {#each filesWithKeys as { file, key } (key)}
      <span class:bx--file__selected-file={true}>
        <p class:bx--file-filename={true}>{file.name}</p>
        <span class:bx--file__state-container={true}>
          <Filename
            {iconDescription}
            {status}
            on:keydown
            on:keydown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                files = files.filter((f) => f !== file);
              }
            }}
            on:click
            on:click={() => {
              files = files.filter((f) => f !== file);
            }}
          />
        </span>
      </span>
    {/each}
  </div>
</div>
