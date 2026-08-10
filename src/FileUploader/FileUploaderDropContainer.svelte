<script>
  /**
   * @event {ReadonlyArray<File>} add
   * @event {ReadonlyArray<File>} change
   * @event {Array<{ file: File; reason: "size" | "duplicate" | "invalid" }>} rejected
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
  export let id = uniqueId();

  /** Specify a name attribute for the input */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { filterIncomingFiles } from "../utils/filterIncomingFiles.js";
  import { uniqueId } from "../utils/uniqueId.js";

  const dispatch = createEventDispatcher();

  let over = false;

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
    const validated = validateFiles(accepted);
    const acceptedSet = new Set(validated);
    /** @type {Array<{ file: File; reason: "size" | "duplicate" | "invalid" }>} */
    const rejected = [
      ...builtInRejected,
      ...accepted
        .filter((file) => !acceptedSet.has(file))
        .map((file) => ({ file, reason: /** @type {const} */ ("invalid") })),
    ];
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
    if (!disabled) {
      over = true;
      event.dataTransfer.dropEffect = "copy";
    }
  }}
  on:dragleave
  on:dragleave|preventDefault|stopPropagation={(event) => {
    if (!disabled) {
      over = false;
      event.dataTransfer.dropEffect = "move";
    }
  }}
  on:drop
  on:drop|preventDefault|stopPropagation={(event) => {
    if (!disabled) {
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
    tabindex={disabled ? -1 : tabindex}
    aria-disabled={disabled || undefined}
    class:bx--file-browse-btn={true}
    class:bx--file-browse-btn--disabled={disabled}
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
    {disabled}
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
