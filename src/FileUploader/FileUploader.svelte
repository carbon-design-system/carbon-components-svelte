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
   * @type {undefined | ((file: File, index: number) => string)}
   */
  export let fileErrorSubject = undefined;

  /**
   * Per-file error body when the row is invalid.
   * Receives `(file, index)` and returns the body text.
   * @type {undefined | ((file: File, index: number) => string)}
   */
  export let fileErrorBody = undefined;

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
   * @bindable writable
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
   * @type {import("../Button/Button.svelte").ButtonProps["size"]}
   */
  export let size = "small";

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
   * Enable paste-to-upload for screenshots and clipboard files.
   * When `true`, listens for `paste` on `document`. Pass an `HTMLElement`
   * (for example a form) to listen on that element instead.
   * Clipboard files use the same size, duplicate, ordering, `add`, `change`,
   * and `rejected` path as button selection. No-op when `disabled`.
   * @type {boolean | HTMLElement}
   */
  export let pasteTarget = false;

  /**
   * Obtain a reference to the input HTML element.
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import { filterIncomingFiles } from "../utils/filterIncomingFiles.js";
  import Filename from "./Filename.svelte";
  import FileUploaderButton from "./FileUploaderButton.svelte";

  const dispatch = createEventDispatcher();

  let prevFiles = [];

  /** @type {EventTarget | null} */
  let pasteListenNode = null;

  /**
   * Shared path for files from button selection and paste: filters by size
   * and duplicates, orders, and dispatches `change`/`rejected`.
   * @param {ReadonlyArray<File>} newFiles
   */
  function processIncomingFiles(newFiles) {
    const existingRefs = new Set(prevFiles);
    const { accepted, rejected: allRejected } = filterIncomingFiles(newFiles, {
      maxFileSize,
      preventDuplicate,
      existingFiles: prevFiles,
      carryRefs: existingRefs,
    });

    if (allRejected.length > 0) {
      dispatch("rejected", allRejected);
    }

    const carried = accepted.filter((f) => existingRefs.has(f));
    const added = accepted.filter((f) => !existingRefs.has(f));

    if (typeof orderFiles === "function") {
      files = orderFiles(carried, added);
    } else if (orderFiles === "prepend") {
      files = [...added, ...carried];
    } else {
      files = [...carried, ...added];
    }

    dispatch("change", files);
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    if (disabled) return;
    const clipboardFiles = event.clipboardData?.files;
    if (!clipboardFiles?.length) return;

    event.preventDefault();
    const incoming = [...clipboardFiles];
    processIncomingFiles(multiple ? [...files, ...incoming] : incoming);
  }

  /** @param {boolean | HTMLElement} target */
  function setPasteListener(target) {
    /** @type {EventTarget | null} */
    const next =
      target === true
        ? typeof document === "undefined"
          ? null
          : document
        : typeof HTMLElement !== "undefined" && target instanceof HTMLElement
          ? target
          : null;

    if (pasteListenNode === next) return;

    if (pasteListenNode !== null) {
      pasteListenNode.removeEventListener("paste", handlePaste);
    }

    pasteListenNode = next;

    if (pasteListenNode !== null) {
      pasteListenNode.addEventListener("paste", handlePaste);
    }
  }

  $: setPasteListener(pasteTarget);

  onMount(() => {
    return () => {
      setPasteListener(false);
    };
  });

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
   * @param {File} file
   * @param {number} index
   * @returns {"uploading" | "edit" | "complete"}
   */
  function resolveFileStatus(file, index) {
    return typeof fileStatus === "function" ? fileStatus(file, index) : status;
  }

  /**
   * @param {File} file
   * @param {number} index
   */
  function resolveFileInvalid(file, index) {
    return typeof fileInvalid === "function" ? fileInvalid(file, index) : false;
  }

  /**
   * @param {File} file
   * @param {number} index
   */
  function resolveFileErrorSubject(file, index) {
    return typeof fileErrorSubject === "function"
      ? fileErrorSubject(file, index)
      : "";
  }

  /**
   * @param {File} file
   * @param {number} index
   */
  function resolveFileErrorBody(file, index) {
    return typeof fileErrorBody === "function"
      ? fileErrorBody(file, index)
      : "";
  }

  $: {
    const prevSet = new Set(prevFiles);
    const currentSet = new Set(files);
    const added = files.filter((f) => !prevSet.has(f));
    const removed = prevFiles.filter((f) => !currentSet.has(f));

    if (added.length > 0 || removed.length > 0) {
      const cleared = prevFiles.length > 0 && files.length === 0;

      // Update prevFiles before dispatching. Defer notification events with
      // tick() so a throwing handler can't abort the file-list render.
      prevFiles = [...files];
      tick().then(() => {
        if (added.length > 0) dispatch("add", added);
        if (removed.length > 0) dispatch("remove", removed);

        if (cleared) {
          dispatch("change", []);
          dispatch("clear");
        }
      });
    }
  }
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
    bind:ref
    bind:files
    on:change={(event) => {
      processIncomingFiles(event.detail);
    }}
  />
  <div class:bx--file-container={true}>
    {#each filesWithKeys as { file, key }, index (key)}
      {@const rowStatus = resolveFileStatus(file, index)}
      {@const rowInvalid = resolveFileInvalid(file, index)}
      {@const rowErrorSubject = resolveFileErrorSubject(file, index)}
      {@const rowErrorBody = resolveFileErrorBody(file, index)}
      <span
        class:bx--file__selected-file={true}
        class:bx--file__selected-file--invalid={rowInvalid}
      >
        <p class:bx--file-filename={true}>{file.name}</p>
        <span class:bx--file__state-container={true}>
          <Filename
            {file}
            fileName={file.name}
            {iconDescription}
            status={rowStatus}
            invalid={rowInvalid}
            on:keydown
            on:keydown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                files = files.filter((f) => f !== file);
              }
            }}
            on:click
            on:click={() => {
              files = files.filter((f) => f !== file);
            }}
          />
        </span>
        {#if rowInvalid && rowErrorSubject}
          <div class:bx--form-requirement={true}>
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
