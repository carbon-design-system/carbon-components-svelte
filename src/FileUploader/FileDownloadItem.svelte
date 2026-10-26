<script>
  /** @template {import("../utils/icon-component.js").IconComponent} [Icon=any] */

  /**
   * @restProps {a | button}
   */

  /** Specify the file name. */
  export let name = "";

  /**
   * Specify the file URL. Without `href`, the item renders a button, such
   * as for a download that needs a signed URL or an authorized request in
   * `on:click`.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Set the `download` attribute so the browser saves the file instead of
   * opening it. A string suggests a file name. Browsers apply it only to
   * same-origin and `blob:` or `data:` URLs.
   * @type {boolean | string}
   */
  export let download = true;

  /**
   * File size to show under the name.
   * A number is bytes, formatted with decimal units (1000 bytes = 1 kB).
   * A string is shown as-is, such as `formatFileSize(bytes, { units: "binary" })`
   * or "2.4 MB · PDF".
   * Omit to show the name only.
   * @type {number | string | undefined}
   */
  export let fileSize = undefined;

  /**
   * Specify an icon to show before the name, such as for the file type.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify what the download icon means, as text screen readers hear
   * before the file name and size. The icon itself is hidden from them.
   */
  export let iconDescription = "Download";

  /**
   * Specify the size of the item.
   * Also accepts Carbon v11's `"sm"` (`"small"`), `"md"` (`"field"`) and
   * `"lg"` (`"default"`).
   * @type {"default" | "field" | "small" | "xs" | "sm" | "md" | "lg"}
   */
  export let size = "default";

  /**
   * Set to `true` for the item to fill the container instead of
   * stopping at 20rem.
   */
  export let fullWidth = false;

  /**
   * Set to `true` to remove the bottom margin, such as for an item in a
   * flex or grid layout that sets its own spacing.
   */
  export let noMargin = false;

  /** Set to `true` to disable the item, such as for an expired file. */
  export let disabled = false;

  /**
   * Obtain a reference to the anchor or button element.
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import Download from "../icons/Download.svelte";
  import { formatFileSize } from "../utils/format-file-size.js";
  import { overflowTitle } from "../utils/overflow-title.js";
  import {
    FILE_ITEM_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";

  $: fileSizeText =
    typeof fileSize === "number" ? formatFileSize(fileSize) : (fileSize ?? "");

  $: effectiveSize = normalizeSize(size, FILE_ITEM_SIZE_ALIASES);
</script>

{#if href !== undefined}
  <a
    bind:this={ref}
    href={disabled ? undefined : href}
    download={disabled || download === false
      ? undefined
      : download === true
        ? ""
        : download}
    role={disabled ? "link" : undefined}
    aria-disabled={disabled ? "true" : undefined}
    class:bx--file__selected-file={true}
    class:bx--file-download-item={true}
    class:bx--file-download-item--with-icon={!!icon}
    class:bx--file-download-item--with-size={!!fileSizeText}
    class:bx--file-download-item--disabled={disabled}
    class:bx--file__selected-file--full-width={fullWidth}
    class:bx--file__selected-file--no-margin={noMargin}
    class:bx--file__selected-file--disabled={disabled}
    class:bx--file__selected-file--md={effectiveSize === "field"}
    class:bx--file__selected-file--sm={effectiveSize === "small"}
    class:bx--file__selected-file--xs={effectiveSize === "xs"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
  >
    {#if icon}
      <svelte:component this={icon} class="bx--file-download-item__icon" />
    {/if}
    <span class:bx--file-filename-group={true}>
      <span class:bx--visually-hidden={true}>{iconDescription}</span>
      <span class:bx--file-filename={true} use:overflowTitle>{name}</span>
      {#if fileSizeText}
        <span class:bx--file-size={true}>{fileSizeText}</span>
      {/if}
    </span>
    <span class:bx--file__state-container={true}>
      <Download class="bx--file-download-item__download" />
    </span>
  </a>
{:else}
  <button
    bind:this={ref}
    type="button"
    {disabled}
    class:bx--file__selected-file={true}
    class:bx--file-download-item={true}
    class:bx--file-download-item--with-icon={!!icon}
    class:bx--file-download-item--with-size={!!fileSizeText}
    class:bx--file-download-item--disabled={disabled}
    class:bx--file__selected-file--full-width={fullWidth}
    class:bx--file__selected-file--no-margin={noMargin}
    class:bx--file__selected-file--disabled={disabled}
    class:bx--file__selected-file--md={effectiveSize === "field"}
    class:bx--file__selected-file--sm={effectiveSize === "small"}
    class:bx--file__selected-file--xs={effectiveSize === "xs"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
  >
    {#if icon}
      <svelte:component this={icon} class="bx--file-download-item__icon" />
    {/if}
    <span class:bx--file-filename-group={true}>
      <span class:bx--visually-hidden={true}>{iconDescription}</span>
      <span class:bx--file-filename={true} use:overflowTitle>{name}</span>
      {#if fileSizeText}
        <span class:bx--file-size={true}>{fileSizeText}</span>
      {/if}
    </span>
    <span class:bx--file__state-container={true}>
      <Download class="bx--file-download-item__download" />
    </span>
  </button>
{/if}
