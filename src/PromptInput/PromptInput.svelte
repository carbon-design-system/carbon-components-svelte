<script>
  /**
   * @typedef {object} PromptAttachment
   * @property {string} id - Unique id; used as the each-block key
   * @property {string} name - The name shown on the chip
   * @property {File} [file] - The file, when it came from the picker, a paste or a drop
   * @property {number} [size] - The size in bytes, shown on a finished chip
   * @property {string} [type] - The MIME type; `image/*` chips show a preview
   * @property {"uploading" | "complete" | "error"} [status] - Default `"complete"`
   * @property {number} [progress] - Percent uploaded, from 0 to 100, while `status` is `"uploading"`; unset shows an indeterminate bar
   * @property {string} [errorText] - Shown on the chip when `status` is `"error"`
   *
   * @typedef {"type" | "size" | "duplicate" | "count"} PromptRejectReason
   *
   * @typedef {object} PromptStatusEvent
   * @property {"attached" | "removed" | "rejected"} type
   * @property {string} name
   * @property {PromptRejectReason} [reason]
   *
   * @restProps {textarea}
   * @slot {{}} tools - After the attach button, such as a model or mode selector.
   * @slot {{}} end - Before the hint and the send button, such as a voice input button.
   * @event {{ text: string, attachments: ReadonlyArray<PromptAttachment> }} submit
   * @event {null} stop
   * @event {{ items: ReadonlyArray<PromptAttachment> }} attach
   * @event {{ attachment: PromptAttachment }} remove
   * @event {{ file: File, reason: PromptRejectReason }} reject
   */

  /**
   * Specify the text of the message.
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify what the app is doing with the last message. While it is
   * `"submitted"` (waiting for the first word) or `"streaming"`, the send
   * button becomes a stop button, Escape stops, and Enter doesn't send.
   * @type {"ready" | "submitted" | "streaming"}
   */
  export let status = "ready";

  /**
   * Specify the keys that send. `"enter"` sends on Enter and starts a new
   * line on Shift+Enter. `"mod-enter"` starts a new line on Enter and sends
   * on Ctrl+Enter or Cmd+Enter, for long messages. Enter that confirms an
   * IME composition never sends.
   * @type {"enter" | "mod-enter"}
   */
  export let submitOn = "enter";

  /**
   * Specify the label of the field, which is visually hidden.
   */
  export let labelText = "Message";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the number of rows the field starts at */
  export let rows = 1;

  /** Specify the number of rows the field grows to before it scrolls */
  export let maxRows = 8;

  /** Set to `true` to disable the composer */
  export let disabled = false;

  /**
   * Specify the limit, in characters. A message over it can't be sent, and
   * the hint turns to the error color.
   * @type {number | undefined}
   */
  export let maxCount = undefined;

  /**
   * Specify the hint under the field, such as a token estimate, as text or
   * a function of the message. Unset, it shows the count against `maxCount`.
   * @type {string | ((value: string) => string) | undefined}
   */
  export let hint = undefined;

  /**
   * Set to `false` to leave the attach button out and ignore pasted and
   * dropped files.
   */
  export let attachable = true;

  /**
   * Specify the files that are attached, as chips above the field. The
   * composer adds files from the picker, a paste or a drop, and removes a
   * chip when its button is pressed. Set a chip's `status` and `progress`
   * to show an upload.
   * @type {PromptAttachment[]}
   * @bindable writable
   */
  export let attachments = [];

  /**
   * Specify the types that can be attached, as the `accept` of a file
   * input: extensions such as `".pdf"`, and MIME types such as `"image/*"`.
   * Empty accepts any.
   * @type {string | ReadonlyArray<string>}
   */
  export let accept = "";

  /** Specify the most files that can be attached */
  export let maxFiles = 10;

  /**
   * Specify the largest file, in bytes.
   * @type {number | undefined}
   */
  export let maxFileSize = undefined;

  /**
   * Specify the messages sent before, oldest first. ArrowUp in an empty
   * field recalls the last, then older ones; ArrowDown goes back. Each sent
   * message is added.
   * @type {string[]}
   * @bindable writable
   */
  export let history = [];

  /** Specify how many messages `history` keeps */
  export let historyLimit = 50;

  /** Set to `false` to keep the message and the attachments after sending */
  export let clearOnSubmit = true;

  /** Specify the label of the send button */
  export let sendText = "Send";

  /** Specify the label of the stop button */
  export let stopText = "Stop";

  /** Specify the label of the attach button */
  export let attachText = "Attach files";

  /** Specify the accessible name of the list of attachments */
  export let attachmentsLabel = "Attachments";

  /** Specify the text shown over the composer while files are dragged onto it */
  export let dropText = "Drop files to attach";

  /**
   * Specify the label of a chip's remove button.
   * @type {(name: string) => string}
   */
  export let removeText = (name) => `Remove ${name}`;

  /**
   * Specify the line under a chip's name: the size, the progress or the error.
   * @type {(attachment: PromptAttachment) => string}
   */
  export let attachmentText = (attachment) => {
    if (attachment.status === "uploading") {
      return typeof attachment.progress === "number"
        ? `Uploading ${Math.round(attachment.progress)}%`
        : "Uploading";
    }
    if (attachment.status === "error") {
      return attachment.errorText || "Upload failed";
    }
    return typeof attachment.size === "number"
      ? formatFileSize(attachment.size)
      : "";
  };

  /**
   * Specify what screen readers hear when a file is attached, removed or
   * turned away.
   * @type {(event: PromptStatusEvent) => string}
   */
  export let statusText = ({ type, name, reason }) => {
    if (type === "attached") return `Attached ${name}`;
    if (type === "removed") return `Removed ${name}`;
    return `Couldn't attach ${name}: ${
      {
        type: "type not accepted",
        size: "too large",
        duplicate: "already attached",
        count: "too many files",
      }[reason ?? "type"]
    }`;
  };

  /**
   * Obtain a reference to the textarea element.
   * @type {null | HTMLTextAreaElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import TextArea from "../TextArea/TextArea.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Attachment from "../icons/Attachment.svelte";
  import Close from "../icons/Close.svelte";
  import Document from "../icons/Document.svelte";
  import StopFilledAlt from "../icons/StopFilledAlt.svelte";
  import { filterIncomingFiles } from "../utils/filter-incoming-files.js";
  import { formatFileSize } from "../utils/format-file-size.js";
  import { graphemeCount } from "../utils/grapheme-count.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const id = uniqueId();
  const hintId = `${id}-hint`;

  /** @type {null | HTMLInputElement} */
  let fileInput = null;
  let mounted = false;
  let dragDepth = 0;
  let announcement = "";

  $: busy = status !== "ready";
  $: count = graphemeCount(value ?? "");
  $: over = typeof maxCount === "number" && count > maxCount;
  $: uploading = attachments.some((item) => item.status === "uploading");
  $: failed = attachments.some((item) => item.status === "error");
  $: filled = (value ?? "").trim() !== "" || attachments.length > 0;
  $: canSend = !disabled && !busy && filled && !uploading && !failed && !over;
  $: hintText =
    typeof hint === "function"
      ? hint(value ?? "")
      : (hint ?? (typeof maxCount === "number" ? `${count}/${maxCount}` : ""));
  $: describedBy =
    [hintText && hintId, $$restProps["aria-describedby"]]
      .filter(Boolean)
      .join(" ") || undefined;

  /** @param {string} text */
  function announce(text) {
    // Clearing first makes the same text announce again.
    announcement = "";
    tick().then(() => {
      announcement = text;
    });
  }

  function send() {
    if (!canSend) return;
    const text = (value ?? "").trim();
    if (text && history[history.length - 1] !== text) {
      history = [...history, text].slice(-historyLimit);
    }
    const detail = { text, attachments: [...attachments] };
    browsing = -1;
    if (clearOnSubmit) {
      value = "";
      attachments = [];
    }
    dispatch("submit", detail);
    ref?.focus();
  }

  function stop() {
    dispatch("stop");
    ref?.focus();
  }

  // -- History -------------------------------------------------------------

  /** Where in `history` the field is, or -1 while it holds the draft. */
  let browsing = -1;
  let draft = "";

  /** @param {number} index */
  async function recall(index) {
    if (browsing === -1) draft = value ?? "";
    browsing = index;
    value = index === -1 ? draft : history[index];
    await tick();
    ref?.setSelectionRange(value.length, value.length);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    // A key another handler took, such as a menu choosing a command.
    if (event.defaultPrevented || isImeComposition(event)) return;
    const field = /** @type {HTMLTextAreaElement} */ (event.target);

    if (event.key === "Enter") {
      const modifier = event.ctrlKey || event.metaKey;
      const sends =
        submitOn === "enter" ? !event.shiftKey && !event.altKey : modifier;
      if (!sends) return;
      event.preventDefault();
      send();
    } else if (event.key === "Escape" && busy) {
      event.preventDefault();
      stop();
    } else if (
      event.key === "ArrowUp" &&
      history.length > 0 &&
      !event.shiftKey &&
      // In an empty field, or in a recalled prompt with the caret on its
      // first line, where ArrowUp would have nowhere to go.
      (browsing === -1
        ? field.value === ""
        : !field.value.slice(0, field.selectionStart).includes("\n"))
    ) {
      event.preventDefault();
      recall(browsing === -1 ? history.length - 1 : Math.max(browsing - 1, 0));
    } else if (
      event.key === "ArrowDown" &&
      browsing !== -1 &&
      !event.shiftKey &&
      !field.value.slice(field.selectionEnd).includes("\n")
    ) {
      event.preventDefault();
      recall(browsing + 1 >= history.length ? -1 : browsing + 1);
    }
  }

  function handleInput() {
    browsing = -1;
  }

  // -- Attachments ---------------------------------------------------------

  /** @param {ReadonlyArray<File>} files */
  function addFiles(files) {
    if (!attachable || disabled || files.length === 0) return;
    const { accepted, rejected } = filterIncomingFiles(files, {
      accept,
      maxFileSize,
      preventDuplicate: true,
      existingFiles: attachments.flatMap((item) =>
        item.file ? [item.file] : [],
      ),
    });
    const room = Math.max(0, maxFiles - attachments.length);
    /** @type {Array<{ file: File, reason: PromptRejectReason }>} */
    const turnedAway = [
      ...rejected,
      ...accepted
        .slice(room)
        .map((file) => ({ file, reason: /** @type {const} */ ("count") })),
    ];
    /** @type {PromptAttachment[]} */
    const items = accepted.slice(0, room).map((file) => ({
      id: uniqueId("attachment"),
      name: file.name,
      file,
      size: file.size,
      type: file.type,
      status: "complete",
    }));
    if (items.length > 0) {
      attachments = [...attachments, ...items];
      dispatch("attach", { items });
    }
    for (const rejection of turnedAway) dispatch("reject", rejection);
    const messages = [
      ...items.map((item) => statusText({ type: "attached", name: item.name })),
      ...turnedAway.map(({ file, reason }) =>
        statusText({ type: "rejected", name: file.name, reason }),
      ),
    ];
    if (messages.length > 0) announce(messages.join(". "));
  }

  /** @param {PromptAttachment} attachment */
  function removeAttachment(attachment) {
    attachments = attachments.filter((item) => item !== attachment);
    dispatch("remove", { attachment });
    announce(statusText({ type: "removed", name: attachment.name }));
    // The button that had focus is gone.
    ref?.focus();
  }

  /** @param {Event & { currentTarget: HTMLInputElement }} event */
  function handlePick(event) {
    addFiles([...(event.currentTarget.files ?? [])]);
    event.currentTarget.value = "";
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    const data = event.clipboardData;
    if (!attachable || !data || data.files.length === 0) return;
    // Text wins: a spreadsheet copies its cells as text and as a picture.
    if (data.getData("text/plain")) return;
    event.preventDefault();
    addFiles([...data.files]);
  }

  // While dragging, a browser reveals the kind of the items, not the files.
  /** @param {DragEvent} event */
  const hasFiles = (event) => {
    const transfer = event.dataTransfer;
    return (
      !!transfer &&
      (Array.from(transfer.types ?? []).includes("Files") ||
        (transfer.files?.length ?? 0) > 0)
    );
  };

  /** @param {DragEvent} event */
  function handleDragEnter(event) {
    if (!attachable || disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth++;
  }

  /** @param {DragEvent} event */
  function handleDragOver(event) {
    if (!attachable || disabled || !hasFiles(event)) return;
    event.preventDefault();
  }

  /** @param {DragEvent} event */
  function handleDragLeave(event) {
    if (!attachable || disabled || !hasFiles(event)) return;
    dragDepth = Math.max(0, dragDepth - 1);
  }

  /** @param {DragEvent} event */
  function handleDrop(event) {
    if (!attachable || disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth = 0;
    addFiles([...(event.dataTransfer?.files ?? [])]);
    ref?.focus();
  }

  // -- Previews ------------------------------------------------------------

  /** @type {Map<string, { file: File, url: string }>} */
  const previews = new Map();
  /** @type {Record<string, string>} */
  let previewUrls = {};

  /** @param {ReadonlyArray<PromptAttachment>} items */
  function syncPreviews(items) {
    if (typeof URL.createObjectURL !== "function") return;
    const keep = new Set();
    let changed = false;
    for (const item of items) {
      if (!item.file || !item.type?.startsWith("image/")) continue;
      keep.add(item.id);
      if (previews.get(item.id)?.file !== item.file) {
        previews.set(item.id, {
          file: item.file,
          url: URL.createObjectURL(item.file),
        });
        changed = true;
      }
    }
    for (const [key, { url }] of previews) {
      if (!keep.has(key)) {
        URL.revokeObjectURL(url);
        previews.delete(key);
        changed = true;
      }
    }
    if (changed) {
      previewUrls = Object.fromEntries(
        [...previews].map(([key, { url }]) => [key, url]),
      );
    }
  }

  $: if (mounted) syncPreviews(attachments);

  onMount(() => {
    mounted = true;
    return () => {
      for (const { url } of previews.values()) URL.revokeObjectURL(url);
      previews.clear();
    };
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--prompt-input={true}
  class:bx--prompt-input--disabled={disabled}
  class:bx--prompt-input--dragging={dragDepth > 0}
  class:bx--prompt-input--invalid={over}
  on:dragenter={handleDragEnter}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  {#if attachments.length > 0}
    <ul
      class:bx--prompt-input__attachments={true}
      aria-label={attachmentsLabel}
    >
      {#each attachments as attachment (attachment.id)}
        <li
          class:bx--prompt-input__chip={true}
          class:bx--prompt-input__chip--error={attachment.status === "error"}
        >
          <span class:bx--prompt-input__thumb={true}>
            {#if previewUrls[attachment.id]}
              <img src={previewUrls[attachment.id]} alt="" />
            {:else}
              <Document />
            {/if}
          </span>
          <span class:bx--prompt-input__chip-text={true}>
            <span
              class:bx--prompt-input__chip-name={true}
              dir="auto"
              title={attachment.name}>{attachment.name}</span
            >
            <span class:bx--prompt-input__chip-meta={true} dir="auto"
              >{attachmentText(attachment)}</span
            >
          </span>
          <Button
            kind="ghost"
            size="xs"
            icon={Close}
            iconDescription={removeText(attachment.name)}
            tooltipPosition="top"
            tooltipAlignment="end"
            {disabled}
            on:click={() => removeAttachment(attachment)}
          />
          {#if attachment.status === "uploading"}
            <span
              class:bx--prompt-input__progress={true}
              class:bx--prompt-input__progress--indeterminate={typeof attachment.progress !==
                "number"}
              role="progressbar"
              aria-label={attachmentText(attachment)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={typeof attachment.progress === "number"
                ? Math.round(attachment.progress)
                : undefined}
            >
              <span
                style:width={typeof attachment.progress === "number"
                  ? `${Math.min(100, Math.max(0, attachment.progress))}%`
                  : undefined}
              ></span>
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  <TextArea
    bind:ref
    bind:value
    hideLabel
    grow
    {labelText}
    {placeholder}
    {rows}
    {maxRows}
    {disabled}
    aria-invalid={over ? "true" : undefined}
    {...$$restProps}
    aria-describedby={describedBy}
    on:keydown={handleKeydown}
    on:input={handleInput}
    on:paste={handlePaste}
  />
  <div class:bx--prompt-input__toolbar={true}>
    <div class:bx--prompt-input__tools={true}>
      {#if attachable}
        <Button
          kind="ghost"
          size="sm"
          icon={Attachment}
          iconDescription={attachText}
          tooltipPosition="top"
          {disabled}
          on:click={() => fileInput?.click()}
        />
        <input
          bind:this={fileInput}
          type="file"
          multiple
          hidden
          tabindex="-1"
          accept={typeof accept === "string" ? accept : accept.join(",")}
          on:change={handlePick}
        />
      {/if}
      <slot name="tools" />
    </div>
    <div class:bx--prompt-input__end={true}>
      <slot name="end" />
      {#if hintText}
        <span
          id={hintId}
          class:bx--prompt-input__hint={true}
          dir="auto"
          class:bx--prompt-input__hint--over={over}>{hintText}</span
        >
      {/if}
      <!-- One button for send and stop, so focus stays on it when it turns. -->
      <span
        class:bx--prompt-input__send={true}
        class:bx--prompt-input__send--waiting={status === "submitted"}
      >
        <Button
          kind="primary"
          size="sm"
          icon={busy ? StopFilledAlt : ArrowUp}
          iconDescription={busy ? stopText : sendText}
          aria-busy={status === "submitted" ? "true" : undefined}
          tooltipPosition="top"
          tooltipAlignment="end"
          disabled={busy ? disabled : !canSend}
          on:click={() => (busy ? stop() : send())}
        />
      </span>
    </div>
  </div>
  {#if dragDepth > 0}
    <div class:bx--prompt-input__drop={true} aria-hidden="true">
      {dropText}
    </div>
  {/if}
  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {announcement}
  </div>
</div>
