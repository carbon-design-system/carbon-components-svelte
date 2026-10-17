<script context="module">
  /**
   * @param {File | undefined} file
   * @param {string} fileName
   * @param {"uploading" | "edit" | "complete"} status
   * @param {boolean} invalid
   * @param {string | undefined | ((ctx: {
   *   file: File | undefined,
   *   fileName: string,
   *   status: "uploading" | "edit" | "complete",
   *   invalid: boolean,
   * }) => string | undefined)} iconDescription
   * @returns {string | null}
   */
  function resolveIconLabel(file, fileName, status, invalid, iconDescription) {
    const ctx = { file, fileName, status, invalid };
    const raw =
      typeof iconDescription === "function"
        ? iconDescription(ctx)
        : iconDescription;
    if (raw != null && `${raw}`.trim() !== "") {
      return `${raw}`.trim();
    }
    return null;
  }
</script>

<script>
  /**
   * @restProps {div | button | svg}
   */

  /**
   * @typedef {Object} FilenameIconDescriptionContext
   * @property {File | undefined} [file] Set when rendered from `FileUploader` rows; otherwise `undefined`.
   * @property {string} fileName Display name (`file.name` or `FileUploaderItem` `name`).
   * @property {"uploading" | "edit" | "complete"} status
   * @property {boolean} invalid
   */

  /**
   * Specify the file name status.
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /**
   * Accessible label for the status icons (spinner, remove control, checkmark).
   * Pass a string, or a function receiving {@link FilenameIconDescriptionContext}.
   * When the resolved value is omitted or blank after trim, defaults are used:
   * - `uploading`: passed to `Loading` as `"uploading"`
   * - `edit`: close button `aria-label` is `"Remove file"`
   * - `complete`: checkmark `aria-label` / `title` are `"Upload complete"`
   * @type {string | undefined | ((ctx: FilenameIconDescriptionContext) => string | undefined)}
   */
  export let iconDescription = undefined;

  /**
   * Current file when rendered inside `FileUploader`; omit when using `FileUploaderItem` only.
   * @type {File | undefined}
   */
  export let file = undefined;

  /** Display file name (e.g. `file.name` or `FileUploaderItem` `name`). */
  export let fileName = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Set to `true` to disable the remove button */
  export let disabled = false;

  $: resolvedIconLabel = resolveIconLabel(
    file,
    fileName,
    status,
    invalid,
    iconDescription,
  );

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import Loading from "../Loading/Loading.svelte";
</script>

{#if status === "uploading"}
  <Loading
    description={resolvedIconLabel ?? "uploading"}
    {...$$restProps}
    small
    withOverlay={false}
  />
{/if}

{#if status === "edit"}
  {#if invalid}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      width="16"
      height="16"
      aria-hidden="true"
      class="bx--file-invalid"
    >
      <path
        d="M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14C30,8.3,23.7,2,16,2z M14.9,8h2.2v11h-2.2V8z M16,25	c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22c0.8,0,1.5,0.7,1.5,1.5S16.8,25,16,25z"
      ></path>
      <path
        fill="none"
        d="M17.5,23.5c0,0.8-0.7,1.5-1.5,1.5c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22	C16.8,22,17.5,22.7,17.5,23.5z M17.1,8h-2.2v11h2.2V8z"
        data-icon-path="inner-path"
        opacity="0"
      ></path>
    </svg>
  {/if}
  <button
    aria-label={resolvedIconLabel ?? "Remove file"}
    class:bx--file-close={true}
    type="button"
    tabindex="0"
    {disabled}
    {...$$restProps}
    on:click
    on:keydown
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z"
      ></path>
    </svg>
  </button>
{/if}

{#if status === "complete"}
  <CheckmarkFilled
    aria-label={resolvedIconLabel ?? "Upload complete"}
    title={resolvedIconLabel ?? "Upload complete"}
    class="bx--file-complete"
    {...$$restProps}
  />
{/if}
