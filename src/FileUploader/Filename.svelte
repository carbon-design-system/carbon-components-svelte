<script>
  /**
   * @restProps {div | button | svg}
   */

  /**
   * Specify the file name status.
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /**
   * Accessible label for the status icons (spinner, remove control, checkmark).
   * When omitted or blank after trim, defaults are used:
   * - `uploading`: passed to `Loading` as `"uploading"`
   * - `edit`: close button `aria-label` is `"Remove file"`
   * - `complete`: checkmark `aria-label` / `title` are `"Upload complete"`
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  $: resolvedIconLabel =
    iconDescription != null && `${iconDescription}`.trim() !== ""
      ? `${iconDescription}`.trim()
      : null;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

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
