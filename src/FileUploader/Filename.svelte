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

  $: resolvedIconLabel = (() => {
    /** @type {FilenameIconDescriptionContext} */
    const ctx = { file, fileName, status, invalid };
    const raw =
      typeof iconDescription === "function"
        ? iconDescription(ctx)
        : iconDescription;
    if (raw != null && `${raw}`.trim() !== "") {
      return `${raw}`.trim();
    }
    return null;
  })();

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import Close from "../icons/Close.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
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
    <WarningFilled class="bx--file-invalid" />
  {/if}
  <button
    aria-label={resolvedIconLabel ?? "Remove file"}
    class:bx--file-close={true}
    type="button"
    tabindex="0"
    {...$$restProps}
    on:click
    on:keydown
  >
    <Close />
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
