<script>
  /**
   * @event {ReadonlyArray<File>} add
   * @event {ReadonlyArray<File>} change
   * @event {Array<{ file: File; reason: "type" | "size" | "duplicate" | "invalid" | "count" }>} rejected
   * @restProps {div}
   */

  /**
   * Specify the accepted file types.
   * Dropped files that don't match are reported through the `rejected`
   * event with `reason: 'type'`, like the file picker would exclude them.
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
   * Specify the minimum file size in bytes.
   * Smaller files are filtered out and reported via the `rejected` event
   * with `reason: 'size'`. Use `1` to reject empty files.
   * @type {number | undefined}
   */
  export let minFileSize = undefined;

  /**
   * Specify the maximum file size in bytes.
   * Files exceeding this limit are filtered out and reported via the
   * `rejected` event with `reason: 'size'`.
   * The limit is a raw byte count: use `5 * 1000 * 1000` for 5 MB
   * (decimal) or `5 * 1024 * 1024` for 5 MiB (binary).
   * @type {number | undefined}
   * @example
   * ```svelte
   * <!-- 5 MB = 5 × 1000 × 1000 = 5,000,000 bytes -->
   * <FileUploaderDropContainer maxFileSize={5 * 1000 * 1000} />
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
   * Runs after the `minFileSize`, `maxFileSize`, and `preventDuplicate` checks.
   * Files removed by this function are reported via `rejected` with
   * `reason: 'invalid'`.
   * By default, files are not validated.
   * @type {(files: ReadonlyArray<File>) => ReadonlyArray<File>}
   */
  export let validateFiles = function validateFiles(files) {
    return files;
  };

  /** Specify the label text */
  export let labelText = "Add file";

  /** Specify the `role` attribute of the drop container */
  export let role = "button";

  /**
   * Open the device camera instead of the file picker on mobile.
   * `"user"` requests the front camera and `"environment"` the rear camera.
   * Desktop browsers ignore it and open the file picker.
   * @type {"user" | "environment" | undefined}
   */
  export let capture = undefined;

  /**
   * Set to `true` for the drop area to fill the container instead of
   * stopping at 20rem.
   */
  export let fullWidth = false;

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
   * Specify the id of a form element outside the component to associate
   * the file input with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { filterIncomingFiles } from "../utils/filter-incoming-files.js";
  import { formReset } from "../utils/form-reset.js";
  import { syncInputFiles } from "../utils/sync-input-files.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  let over = false;

  $: atMaxFiles = maxFiles !== undefined && files.length >= maxFiles;
  $: inputDisabled = disabled || atMaxFiles;

  /** @param {ReadonlyArray<File>} incoming */
  function processIncoming(incoming) {
    const { accepted, rejected: builtInRejected } = filterIncomingFiles(
      incoming,
      {
        accept,
        minFileSize,
        maxFileSize,
        preventDuplicate: preventDuplicate && multiple,
        existingFiles: files,
      },
    );
    let validated = validateFiles(accepted);
    const acceptedSet = new Set(validated);
    /** @type {Array<{ file: File; reason: "type" | "size" | "duplicate" | "invalid" | "count" }>} */
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
    // Cap single mode after validation, so it keeps the first valid file.
    files = multiple ? [...files, ...validated] : validated.slice(0, 1);
    dispatch("add", files);
    dispatch("change", files);
  }

  // Keep the native input equal to `files` so native form submission posts
  // exactly the accepted files, whichever way they arrived (drop, browse, or
  // a programmatic `files` update).
  $: if (ref && files !== undefined) syncInputFiles(ref, files);

  // A form reset always empties a file input, and fires no change event.
  // Clear `files` to match; this also restores the initial label.
  function handleFormReset() {
    files = [];
  }

  $: dropTargetId = `${id}-drop-target`;

  // Rest props go to the wrapper, which never takes focus. Move the naming
  // and description attributes to the drop target that does.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperRestProps,
  } = splitAriaNaming($$restProps));
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--file={true}
  {...wrapperRestProps}
  on:dragover
  on:dragover|preventDefault|stopPropagation={(event) => {
    if (!inputDisabled) {
      over = true;
      event.dataTransfer.dropEffect = "copy";
    }
  }}
  on:dragleave
  on:dragleave|preventDefault|stopPropagation={(event) => {
    if (disabled) return;
    const next = event.relatedTarget;
    const current = event.currentTarget;
    if (
      next instanceof Node &&
      current instanceof Node &&
      current.contains(next)
    ) {
      return;
    }
    over = false;
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }}
  on:drop
  on:drop|preventDefault|stopPropagation={(event) => {
    if (!inputDisabled) {
      over = false;
      processIncoming([...event.dataTransfer.files]);
    }
  }}
>
  <!-- A <label> may not take role="button", so the drop target is a div
       that opens the file picker itself. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    id={dropTargetId}
    {role}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    aria-labelledby={ariaLabelledBy}
    tabindex={inputDisabled ? -1 : tabindex}
    aria-disabled={inputDisabled || undefined}
    class:bx--file-browse-btn={true}
    class:bx--file-browse-btn--full-width={fullWidth}
    class:bx--file-browse-btn--disabled={inputDisabled}
    on:click={() => {
      if (!inputDisabled) ref.click();
    }}
    on:keydown
    on:keydown={(event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (!inputDisabled) ref.click();
      }
    }}
  >
    <div
      class:bx--file__drop-container={true}
      class:bx--file__drop-container--drag-over={over}
    >
      <slot name="labelChildren">{labelText}</slot>
    </div>
  </div>
  <input
    bind:this={ref}
    use:formReset={handleFormReset}
    type="file"
    tabindex="-1"
    aria-hidden="true"
    aria-labelledby={dropTargetId}
    {id}
    disabled={inputDisabled}
    accept={typeof accept === "string" ? accept : accept.join(",")}
    {capture}
    {name}
    {form}
    {multiple}
    class:bx--file-input={true}
    on:change={({ target }) => {
      processIncoming([.../** @type {HTMLInputElement} */ (target).files]);
    }}
    on:click
    on:click={(event) => {
      /** @type {HTMLInputElement} */ (event.target).value = null;
    }}
    on:cancel={() => {
      // The click cleared the input so the same file can be picked again; a
      // dismissed picker fires no change, so put the current files back.
      if (ref) syncInputFiles(ref, files);
    }}
  />
</div>
