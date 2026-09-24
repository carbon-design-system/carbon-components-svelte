<script>
  /**
   * @event {string} delete
   */

  /**
   * Specify the file uploader status.
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /**
   * Specify the size of button skeleton.
   * @type {"default" | "field" | "small"}
   */
  export let size = "default";

  /**
   * Accessible label for the status icons. Forwarded to `Filename`. Use
   * a string, or a function with `{ file, fileName, status, invalid }`
   * (`file` is always `undefined` here). When omitted or the resolved
   * value is blank after trim, `Filename` applies defaults.
   * @type {string
   *   | undefined
   *   | ((ctx: {
   *       file?: File;
   *       fileName: string;
   *       status: "uploading" | "edit" | "complete";
   *       invalid: boolean;
   *     }) => string | undefined)}
   */
  export let iconDescription = undefined;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the error subject text */
  export let errorSubject = "";

  /** Specify the error body text */
  export let errorBody = "";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /** Specify the file uploader name */
  export let name = "";

  /**
   * File size to show under the name.
   * A number is bytes, formatted with decimal units (1000 bytes = 1 kB).
   * A string is shown as-is; use `formatFileSize(bytes, { units: "binary" })`
   * for binary units or a localized size.
   * Omit to show the name only.
   * @type {number | string | undefined}
   */
  export let fileSize = undefined;

  import { createEventDispatcher } from "svelte";
  import { formatFileSize } from "../utils/format-file-size.js";
  import { uniqueId } from "../utils/unique-id.js";
  import Filename from "./Filename.svelte";

  const dispatch = createEventDispatcher();

  $: fileSizeText =
    typeof fileSize === "number" ? formatFileSize(fileSize) : (fileSize ?? "");
</script>

<span
  {id}
  class:bx--file__selected-file={true}
  class:bx--file__selected-file--invalid={invalid}
  class:bx--file__selected-file--md={size === "field"}
  class:bx--file__selected-file--sm={size === "small"}
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--file-filename-group={true}>
    <p class:bx--file-filename={true}>{name}</p>
    {#if fileSizeText}
      <p class:bx--file-size={true}>{fileSizeText}</p>
    {/if}
  </span>
  <span class:bx--file__state-container={true}>
    <Filename
      fileName={name}
      on:keydown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          dispatch("delete", id);
        }
      }}
      on:click={() => {
        dispatch("delete", id);
      }}
      {iconDescription}
      {status}
      {invalid}
    />
  </span>
  {#if invalid && errorSubject}
    <div class:bx--form-requirement={true}>
      <div class:bx--form-requirement__title={true}>{errorSubject}</div>
      {#if errorBody}
        <p class:bx--form-requirement__supplement={true}>{errorBody}</p>
      {/if}
    </div>
  {/if}
</span>
