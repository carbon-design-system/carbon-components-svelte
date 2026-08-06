<script>
  /**
   * @event {ReadonlyArray<File>} add
   * @event {ReadonlyArray<File>} change
   * @event {Array<{ file: File; reason: "size" | "duplicate" | "invalid" | "count" }>} rejected
   */

  /**
   * Specify the accepted file types.
   * @type {ReadonlyArray<string>}
   */
  export let accept = [];

  /**
   * Obtain a reference to the uploaded files.
   * @type {ReadonlyArray<File>}
   * @bindable writable
   */
  export let files = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /**
   * Specify the maximum file size in bytes.
   * Files exceeding this limit are filtered out and reported via the
   * `rejected` event with `reason: 'size'`.
   * File sizes use binary (base 2) units: 1024 bytes = 1 KiB, not 1000 bytes.
   * @type {number | undefined}
   * @example
   * ```svelte
   * <!-- 5 MB = 5 × 1024 × 1024 = 5,242,880 bytes -->
   * <FileUploaderDropContainer maxFileSize={5 * 1024 * 1024} />
   * ```
   */
  export let maxFileSize = undefined;

  /**
   * Set to `true` to reject files that match an already-selected file
   * (by name, size, and lastModified). Rejected duplicates are reported
   * via the `rejected` event with `reason: 'duplicate'`.
   */
  export let preventDuplicate = false;

  /**
   * Specify the maximum number of files that can be attached.
   * Excess files are rejected after `validateFiles`, in selection order, via
   * the `rejected` event with `reason: "count"`.
   * When the list is at capacity, further picks are disabled until a file is removed.
   * @type {number | undefined}
   * @example
   * ```svelte
   * <FileUploaderDropContainer multiple maxFiles={3} />
   * ```
   */
  export let maxFiles = undefined;

  /**
   * Override the default behavior of validating uploaded files.
   * Runs after `maxFileSize` and `preventDuplicate` checks.
   * Files removed by this function are reported via `rejected` with
   * `reason: 'invalid'`.
   * By default, files are not validated.
   * @type {(files: ReadonlyArray<File>) => ReadonlyArray<File>}
   */
  export let validateFiles = (files) => files;

  /** Specify the label text */
  export let labelText = "Add file";

  /** Specify the `role` attribute of the drop container */
  export let role = "button";

  /** Set to `true` to disable the input */
  export let disabled = false;

  /**
   * Specify `tabindex` attribute
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Specify a name attribute for the input */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { filterIncomingFiles } from "../utils/filterIncomingFiles.js";

  const dispatch = createEventDispatcher();

  let over = false;

  $: atMaxFiles = maxFiles !== undefined && files.length >= maxFiles;
  $: inputDisabled = disabled || atMaxFiles;

  /** @param {ReadonlyArray<File>} incoming */
  function processIncoming(incoming) {
    const { accepted, rejected: builtInRejected } = filterIncomingFiles(
      incoming,
      {
        maxFileSize,
        preventDuplicate,
        existingFiles: files,
      },
    );
    let validated = validateFiles(accepted);
    const acceptedSet = new Set(validated);
    /** @type {Array<{ file: File; reason: "size" | "duplicate" | "invalid" | "count" }>} */
    const rejected = [
      ...builtInRejected,
      ...accepted
        .filter((file) => !acceptedSet.has(file))
        .map((file) => ({ file, reason: /** @type {const} */ ("invalid") })),
    ];

    // Count check runs after validateFiles. In multiple mode, slots are
    // relative to files already attached; in single mode, the selection replaces.
    if (maxFiles !== undefined) {
      const existingCount = multiple ? files.length : 0;
      const slots = Math.max(0, maxFiles - existingCount);
      if (validated.length > slots) {
        const excess = validated.slice(slots);
        rejected.push(
          ...excess.map((file) => ({
            file,
            reason: /** @type {const} */ ("count"),
          })),
        );
        validated = validated.slice(0, slots);
      }
    }

    if (rejected.length > 0) dispatch("rejected", rejected);
    files = multiple ? [...files, ...validated] : validated;
    dispatch("add", files);
    dispatch("change", files);
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--file={true}
  {...$$restProps}
  on:dragover
  on:dragover|preventDefault|stopPropagation={(event) => {
    if (!inputDisabled) {
      over = true;
      event.dataTransfer.dropEffect = "copy";
    }
  }}
  on:dragleave
  on:dragleave|preventDefault|stopPropagation={(event) => {
    if (!inputDisabled) {
      over = false;
      event.dataTransfer.dropEffect = "move";
    }
  }}
  on:drop
  on:drop|preventDefault|stopPropagation={(event) => {
    if (!inputDisabled) {
      over = false;
      processIncoming([...event.dataTransfer.files]);
    }
  }}
>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <label
    for={id}
    {role}
    tabindex={inputDisabled ? -1 : tabindex}
    aria-disabled={inputDisabled || undefined}
    class:bx--file-browse-btn={true}
    class:bx--file-browse-btn--disabled={inputDisabled}
    on:keydown
    on:keydown={(event) => {
      if (event.key === " " || event.key === "Enter") {
        ref.click();
      }
    }}
  >
    <div
      class:bx--file__drop-container={true}
      class:bx--file__drop-container--drag-over={over}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </div>
  </label>
  <input
    bind:this={ref}
    type="file"
    tabindex="-1"
    {id}
    disabled={inputDisabled}
    accept={typeof accept === "string" ? accept : accept.join(",")}
    {name}
    {multiple}
    class:bx--file-input={true}
    on:change={({ target }) => {
      processIncoming([...target.files]);
    }}
    on:click
    on:click={(event) => {
      event.target.value = null;
    }}
  >
</div>
