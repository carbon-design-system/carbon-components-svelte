<script context="module">
  /**
   * Per-file override: call `fn(file, index)` when supplied, else `fallback`.
   *
   * @template T
   * @param {((file: File, index: number) => T) | undefined} fn
   * @param {T} fallback
   * @param {File} file
   * @param {number} index
   * @returns {T}
   */
  function resolveFileOverride(fn, fallback, file, index) {
    return typeof fn === "function" ? fn(file, index) : fallback;
  }
</script>

<script>
  /**
   * @event {ReadonlyArray<File>} add
   * @event {ReadonlyArray<File>} remove
   * @event {ReadonlyArray<File>} change
   * @event {void} clear
   * @event {Array<{ file: File; reason: "size" | "duplicate" | "count" }>} rejected
   * @restProps {div}
   */

  /**
   * Specify the file uploader status.
   * Applied to every file row unless overridden by `fileStatus`.
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /**
   * Override the global `status` for an individual file.
   * Receives `(file, index)` and returns `"uploading" | "edit" | "complete"`.
   * When omitted, every row uses `status`.
   * @type {undefined | ((file: File, index: number) => "uploading" | "edit" | "complete")}
   */
  export let fileStatus = undefined;

  /**
   * Mark an individual file as invalid.
   * Receives `(file, index)` and returns a boolean.
   * @type {undefined | ((file: File, index: number) => boolean)}
   */
  export let fileInvalid = undefined;

  /**
   * Per-file error subject when the row is invalid.
   * Receives `(file, index)` and returns the subject text.
   * The error is announced with `role="alert"` when the row becomes
   * invalid, and describes the row's remove button.
   * @type {undefined | ((file: File, index: number) => string)}
   */
  export let fileErrorSubject = undefined;

  /**
   * Per-file error body when the row is invalid.
   * Receives `(file, index)` and returns the body text.
   * @type {undefined | ((file: File, index: number) => string)}
   */
  export let fileErrorBody = undefined;

  /**
   * Show each file's size under its name.
   * - `false` (default): show the name only
   * - `true` or `"decimal"`: format `file.size` with decimal units (1000 bytes = 1 kB)
   * - `"binary"`: format `file.size` with binary units (1024 bytes = 1 KiB)
   * - A function receiving `(file, index)` that returns the text (e.g., a localized size)
   * @type {boolean | "decimal" | "binary" | ((file: File, index: number) => string)}
   */
  export let fileSize = false;

  /**
   * Set to `true` for the selected files to fill the container instead of
   * stopping at 20rem.
   */
  export let fullWidth = false;

  /**
   * Set to `true` to disable the file uploader.
   * Also disables each file row's remove button.
   */
  export let disabled = false;

  /**
   * Specify the accepted file types.
   * @type {ReadonlyArray<string>}
   */
  export let accept = [];

  /**
   * Specify the minimum file size in bytes.
   * Smaller files are filtered out and reported via the `rejected` event
   * with `reason: 'size'`. Use `1` to reject empty files.
   * @type {number | undefined}
   */
  export let minFileSize = undefined;

  /**
   * Specify the maximum file size in bytes.
   * Files exceeding this limit will be filtered out.
   * The limit is a raw byte count: use `5 * 1000 * 1000` for 5 MB
   * (decimal) or `5 * 1024 * 1024` for 5 MiB (binary).
   * @type {number | undefined}
   * @example
   * ```svelte
   * <!-- 5 MB = 5 × 1000 × 1000 = 5,000,000 bytes -->
   * <FileUploader maxFileSize={5 * 1000 * 1000} />
   * ```
   */
  export let maxFileSize = undefined;

  /**
   * Specify the maximum number of files that can be attached.
   * Excess files are rejected after size and duplicate checks, in selection
   * order, via the `rejected` event with `reason: "count"`.
   * When the list is at capacity, further picks are disabled until a file is removed.
   * @type {number | undefined}
   * @example
   * ```svelte
   * <FileUploader multiple maxFiles={3} />
   * ```
   */
  export let maxFiles = undefined;

  /**
   * Obtain a reference to the uploaded files.
   * @type {ReadonlyArray<File>}
   * @bindable writable
   */
  export let files = [];

  /**
   * Open the device camera instead of the file picker on mobile.
   * `"user"` requests the front camera and `"environment"` the rear camera.
   * Desktop browsers ignore it and open the file picker.
   * @type {"user" | "environment" | undefined}
   */
  export let capture = undefined;

  /**
   * Set to `true` to select a folder instead of individual files.
   * Every file inside the folder and its subfolders is added, and each row
   * shows the file's path relative to the selected folder. Browsers do not
   * apply `accept` to folder contents.
   */
  export let directory = false;

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /**
   * Set to `true` to reject files that match an already-selected file
   * (by name, size, and lastModified). Rejected duplicates are reported
   * via the `rejected` event with `reason: 'duplicate'`.
   */
  export let preventDuplicate = false;

  /**
   * Control how newly added files are ordered in the list.
   * - `"append"` (default): new files appear at the end
   * - `"prepend"`: new files appear at the beginning
   * - A custom function receiving (existingFiles, newFiles) that returns the merged array
   * @type {"append" | "prepend" | ((existing: ReadonlyArray<File>, added: ReadonlyArray<File>) => ReadonlyArray<File>)}
   */
  export let orderFiles = "append";

  /**
   * Programmatically clear the uploaded files.
   * @type {() => void}
   * @example
   * ```svelte
   * <FileUploader bind:this={uploader} bind:files={files} />
   * <button on:click={() => uploader.clearFiles()}>Clear Files</button>
   * ```
   */
  export function clearFiles() {
    files = [];
  }

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
   * At `"xs"`, the file rows are extra small too.
   * Inherits the height of the parent `Form` size when unset,
   * otherwise defaults to `"small"`.
   * Accepts the same Carbon v11 aliases as `Button`.
   * @type {import("../Button/Button.svelte").ButtonProps["size"] | undefined}
   */
  export let size = undefined;

  /** Specify the button label */
  export let buttonLabel = "";

  /**
   * Accessible label for file row status icons (spinner, remove control, checkmark).
   * Forwarded to `Filename`. Use a string, or a function with context `{ file, fileName, status, invalid }`
   * where `file` is the row's `File` (only set from `FileUploader`, not from `FileUploaderItem`).
   * When omitted or the resolved value is blank after trim, `Filename` uses built-in defaults.
   * @type {string | undefined | ((ctx: { file?: File; fileName: string; status: "uploading" | "edit" | "complete"; invalid: boolean }) => string | undefined)}
   */
  export let iconDescription = undefined;

  /** Specify a name attribute for the file button uploader input */
  export let name = "";

  /**
   * Specify the id of a form element outside the component to associate
   * the file input with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Set an id for the top-level element.
   * The file input id derives from it as `{id}-input`, and the label
   * description id as `{id}-description`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the input HTML element.
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, tick } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { filterIncomingFiles } from "../utils/filter-incoming-files.js";
  import { returnFocus } from "../utils/focus.js";
  import { formButtonSize } from "../utils/form-button-size.js";
  import { formatFileSize } from "../utils/format-file-size.js";
  import { overflowTitle } from "../utils/overflow-title.js";
  import { BUTTON_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import FileUploaderButton from "./FileUploaderButton.svelte";
  import Filename from "./Filename.svelte";

  const dispatch = createEventDispatcher();

  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize =
    normalizeSize(size, BUTTON_SIZE_ALIASES) ??
    formButtonSize($formSize) ??
    "small";

  $: descriptionId = `${id}-description`;
  $: hasDescription = Boolean(labelDescription || $$slots.labelDescription);

  // The add button takes focus, not the wrapper, so it gets the naming and
  // description attributes. A consumer's description joins the built-in one.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperRestProps,
  } = splitAriaNaming($$restProps));

  let prevFiles = [];

  // Set by a row's remove button, so the removal also reports the new
  // list in `change`, as a pick does.
  let rowRemoved = false;

  /** @type {null | HTMLDivElement} */
  let root = null;

  /**
   * @param {File} file
   * @param {number} index
   */
  function removeFile(file, index) {
    // Removing the row unmounts its focused remove button. Hand focus to the
    // next row's remove button, else the previous row's, else the add
    // button, instead of letting it fall to <body>.
    const rows = root
      ? [...root.querySelectorAll(".bx--file__selected-file")]
      : [];
    const row = rows[index];
    const hadFocus = row?.contains(document.activeElement);
    const neighbours = hadFocus
      ? [...rows.slice(index + 1), ...rows.slice(0, index).reverse()].map(
          (other) =>
            /** @type {HTMLElement | null} */ (
              other.querySelector(".bx--file-close")
            ),
        )
      : [];

    rowRemoved = true;
    files = files.filter((f) => f !== file);

    if (!hadFocus) return;
    tick().then(() => {
      if (row.isConnected) return;
      returnFocus(
        [
          ...neighbours,
          /** @type {HTMLElement | null | undefined} */ (
            root?.querySelector(":scope > .bx--btn")
          ),
        ].find((el) => el?.isConnected),
      );
    });
  }

  // Per-file stable id: assigned once on first sight and carried with the
  // File reference, so reorders and removals don't shift other files' ids.
  // Two files with the same name/size/lastModified get distinct ids via a
  // `#n` suffix.
  /** @type {WeakMap<File, string>} */
  const fileKeys = new WeakMap();

  /** @param {ReadonlyArray<File>} list */
  function keyFiles(list) {
    const used = new Set();
    for (const f of list) {
      const cached = fileKeys.get(f);
      if (cached !== undefined) used.add(cached);
    }
    return list.map((file) => {
      let key = fileKeys.get(file);
      if (key === undefined) {
        const base = `${file.name}-${file.size}-${file.lastModified}`;
        key = base;
        let n = 1;
        while (used.has(key)) key = `${base}#${n++}`;
        fileKeys.set(file, key);
        used.add(key);
      }
      return { file, key };
    });
  }

  /** Stable keys for `{#each}` (and Biome-safe: no commas in the each header). */
  $: filesWithKeys = keyFiles(files);

  /**
   * @param {typeof fileSize} option
   * @param {File} file
   * @param {number} index
   * @returns {string}
   */
  function resolveFileSize(option, file, index) {
    if (typeof option === "function") return option(file, index);
    if (!option) return "";
    return formatFileSize(file.size, {
      units: option === "binary" ? "binary" : "decimal",
    });
  }

  $: atMaxFiles = maxFiles !== undefined && files.length >= maxFiles;
  $: inputDisabled = disabled || atMaxFiles;

  $: {
    const prevSet = new Set(prevFiles);
    const currentSet = new Set(files);
    const added = files.filter((f) => !prevSet.has(f));
    const removed = prevFiles.filter((f) => !currentSet.has(f));
    const byRow = rowRemoved;
    rowRemoved = false;

    if (added.length > 0 || removed.length > 0) {
      const cleared = prevFiles.length > 0 && files.length === 0;
      const changed = cleared || byRow;
      const next = files;

      // Update prevFiles before dispatching. Defer notification events with
      // tick() so a throwing handler can't abort the file-list render.
      prevFiles = [...files];
      tick().then(() => {
        if (added.length > 0) dispatch("add", added);
        if (removed.length > 0) dispatch("remove", removed);
        if (changed) dispatch("change", next);
        if (cleared) dispatch("clear");
      });
    }
  }
</script>

<div
  bind:this={root}
  {id}
  class:bx--form-item={true}
  {...wrapperRestProps}
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
      <slot name="labelTitle">{labelTitle}</slot>
    </p>
  {/if}
  {#if hasDescription}
    <p
      id={descriptionId}
      class:bx--label-description={true}
      class:bx--label-description--disabled={disabled}
    >
      <slot name="labelDescription">{labelDescription}</slot>
    </p>
  {/if}
  <FileUploaderButton
    id="{id}-input"
    disabled={inputDisabled}
    disableLabelChanges
    labelText={buttonLabel}
    {accept}
    {capture}
    {directory}
    {name}
    {form}
    {multiple}
    {kind}
    size={effectiveSize}
    aria-describedby={joinDescribedBy(
      hasDescription && descriptionId,
      ariaDescribedBy,
    )}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    bind:ref
    bind:files
    on:change={(event) => {
      // In multiple mode, newFiles includes re-sent existing files
      // (same reference) plus newly selected ones. Only reject new
      // objects that match an existing file by content.
      const existingRefs = new Set(prevFiles);
      let { accepted: newFiles, rejected: allRejected } = filterIncomingFiles(
        event.detail,
        {
          minFileSize,
          maxFileSize,
          preventDuplicate,
          existingFiles: prevFiles,
          carryRefs: existingRefs,
        },
      );

      // Count check runs after size/duplicate. Keep carried files; trim
      // newly added files that would exceed maxFiles (selection order).
      if (maxFiles !== undefined) {
        const carriedForCount = newFiles.filter((f) => existingRefs.has(f));
        const addedForCount = newFiles.filter((f) => !existingRefs.has(f));
        const slots = Math.max(0, maxFiles - carriedForCount.length);
        if (addedForCount.length > slots) {
          const excess = addedForCount.slice(slots);
          allRejected.push(
            ...excess.map((file) => ({ file, reason: "count" })),
          );
          newFiles = [...carriedForCount, ...addedForCount.slice(0, slots)];
        }
      }

      if (allRejected.length > 0) {
        dispatch("rejected", allRejected);
      }

      const carried = newFiles.filter((f) => existingRefs.has(f));
      const added = newFiles.filter((f) => !existingRefs.has(f));

      if (typeof orderFiles === "function") {
        files = orderFiles(carried, added);
      } else if (orderFiles === "prepend") {
        files = [...added, ...carried];
      } else {
        files = [...carried, ...added];
      }

      dispatch("change", files);
    }}
  />
  <div class:bx--file-container={true}>
    {#each filesWithKeys as { file, key }, index (key)}
      {@const rowStatus = resolveFileOverride(fileStatus, status, file, index)}
      {@const rowInvalid = resolveFileOverride(fileInvalid, false, file, index)}
      {@const rowErrorSubject = resolveFileOverride(
        fileErrorSubject,
        "",
        file,
        index,
      )}
      {@const rowErrorBody = resolveFileOverride(
        fileErrorBody,
        "",
        file,
        index,
      )}
      {@const rowFileSize = resolveFileSize(fileSize, file, index)}
      {@const rowErrorId =
        rowInvalid && rowErrorSubject ? `${id}-error-${index}` : undefined}
      {@const rowName = file.webkitRelativePath || file.name}
      <span
        class:bx--file__selected-file={true}
        class:bx--file__selected-file--invalid={rowInvalid}
        class:bx--file__selected-file--disabled={disabled}
        class:bx--file__selected-file--xs={effectiveSize === "xs"}
        class:bx--file__selected-file--full-width={fullWidth}
      >
        <span class:bx--file-filename-group={true}>
          <p class:bx--file-filename={true} use:overflowTitle>{rowName}</p>
          {#if rowFileSize}
            <p class:bx--file-size={true}>{rowFileSize}</p>
          {/if}
        </span>
        <span class:bx--file__state-container={true}>
          <Filename
            {file}
            fileName={rowName}
            {iconDescription}
            status={rowStatus}
            invalid={rowInvalid}
            {disabled}
            aria-describedby={rowErrorId}
            on:keydown
            on:click={() => removeFile(file, index)}
          />
        </span>
        {#if rowErrorId}
          <div id={rowErrorId} class:bx--form-requirement={true} role="alert">
            <div class:bx--form-requirement__title={true}>
              {rowErrorSubject}
            </div>
            {#if rowErrorBody}
              <p class:bx--form-requirement__supplement={true}>
                {rowErrorBody}
              </p>
            {/if}
          </div>
        {/if}
      </span>
    {/each}
  </div>
</div>
