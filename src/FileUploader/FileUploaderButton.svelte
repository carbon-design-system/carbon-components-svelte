<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @event {ReadonlyArray<File>} change
   * @event {Array<{ file: File; reason: "size" | "duplicate" }>} rejected
   * @restProps {input}
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
   * Specify the minimum file size in bytes.
   * Smaller files are filtered out and reported via the `rejected` event
   * with `reason: 'size'`. Use `1` to reject empty files.
   * @type {number | undefined}
   */
  export let minFileSize = undefined;

  /**
   * Specify the maximum file size in bytes.
   * @type {number | undefined}
   */
  export let maxFileSize = undefined;

  /**
   * Set to `true` to reject files that match an already-selected file
   * (by name, size, and lastModified).
   */
  export let preventDuplicate = false;

  /**
   * Open the device camera instead of the file picker on mobile.
   * `"user"` requests the front camera and `"environment"` the rear camera.
   * Desktop browsers ignore it and open the file picker.
   * @type {"user" | "environment" | undefined}
   */
  export let capture = undefined;

  /**
   * Set to `true` to select a folder instead of individual files.
   * Every file inside the folder and its subfolders is added, and each
   * keeps its `webkitRelativePath`. Browsers do not apply `accept` to
   * folder contents.
   */
  export let directory = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to disable label changes */
  export let disableLabelChanges = false;

  /**
   * Specify the button label after more than one file is picked.
   * @type {(count: number) => string}
   */
  export let fileCountText = function fileCountText(count) {
    return `${count} files`;
  };

  /**
   * Specify the kind of file uploader button.
   * @type {import("../Button/Button.svelte").ButtonProps["kind"]}
   */
  export let kind = "primary";

  /**
   * Specify the size of the file uploader button.
   * Inherits the height of the parent `Form` size when unset,
   * otherwise defaults to `"small"`.
   * Accepts the same Carbon v11 aliases as `Button`.
   * @type {import("../Button/Button.svelte").ButtonProps["size"] | undefined}
   */
  export let size = undefined;

  /**
   * Specify the label text.
   * @bindable writable
   */
  export let labelText = "Add file";

  /** Set an id for the input element */
  export let id = uniqueId();

  /** Specify a name attribute for the input */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify the ARIA label for the button icon.
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies to icon-only buttons.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Set the position of the tooltip relative to the icon.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set to `true` to hide the tooltip while maintaining accessibility.
   * Only applies to icon-only buttons.
   * When `true`, the tooltip is visually hidden but the `iconDescription` remains accessible to screen readers.
   */
  export let hideTooltip = false;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { createAnchoredTooltip } from "../utils/anchored-tooltip.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { filterIncomingFiles } from "../utils/filter-incoming-files.js";
  import { formButtonSize } from "../utils/form-button-size.js";
  import { formReset } from "../utils/form-reset.js";
  import { noop } from "../utils/noop.js";
  import { BUTTON_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { syncInputFiles } from "../utils/sync-input-files.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize =
    normalizeSize(size, BUTTON_SIZE_ALIASES) ??
    formButtonSize($formSize) ??
    "small";

  // Rest props go to the hidden input, which never takes focus. Move the
  // naming and description attributes to the button that does.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: inputRestProps,
  } = splitAriaNaming($$restProps));

  let initialLabelText = labelText;
  // The label a pick last wrote. Any other `labelText` came from the
  // consumer (e.g. a locale change), so clearing restores that instead.
  let fileLabel;

  // Determine if this is icon-only (has icon but no label content)
  $: hasIconOnly =
    icon && !$$slots.labelChildren && (!labelText || labelText === "");

  $: hasTooltip = hasIconOnly && !hideTooltip;

  /** @type {null | HTMLButtonElement} */
  let buttonRef = null;

  // CSS shows the icon-only tooltip on hover and focus at once. This takes
  // the tooltip group's active slot so it never overlaps another tooltip,
  // and lets Escape hide it until the next hover or focus.
  const tooltip = createAnchoredTooltip({
    group: getTooltipGroup(),
    enabled: () => !!hasTooltip,
    dismissOnClick: false,
    enterDelayMs: () => 0,
  });
  const {
    open: tooltipOpen,
    hidden: tooltipHidden,
    instant: tooltipInstant,
  } = tooltip;

  let detachTooltip = noop;

  $: {
    detachTooltip();
    detachTooltip = buttonRef ? tooltip.attach(buttonRef) : noop;
  }

  $: if (!hasTooltip) tooltip.hide();

  onMount(() => {
    return () => {
      detachTooltip();
      tooltip.destroy();
    };
  });

  $: iconProps = {
    "aria-hidden": "true",
    class: "bx--btn__icon",
    "aria-label": iconDescription,
  };

  $: if (ref && files !== undefined) {
    if (files.length === 0) {
      if (labelText !== fileLabel) initialLabelText = labelText;
      labelText = initialLabelText;
    }
    syncInputFiles(ref, files);
  }
  /** @param {ReadonlyArray<File>} incoming */
  function processIncoming(incoming) {
    const { accepted, rejected } = filterIncomingFiles(incoming, {
      minFileSize,
      maxFileSize,
      preventDuplicate: preventDuplicate && multiple,
      existingFiles: files,
    });

    if (rejected.length > 0) dispatch("rejected", rejected);

    files = multiple ? [...files, ...accepted] : accepted;

    // An icon-only button has no label to replace.
    if (files.length > 0 && !disableLabelChanges && !hasIconOnly) {
      if (labelText !== fileLabel) initialLabelText = labelText;
      labelText = fileLabel =
        files.length > 1 ? fileCountText(files.length) : files[0].name;
    }

    dispatch("change", files);
  }

  // A form reset always empties a file input, and fires no change event.
  // Clear `files` to match; this also restores the initial label.
  function handleFormReset() {
    files = [];
  }

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<button
  bind:this={buttonRef}
  type="button"
  on:click={() => ref?.click()}
  aria-label={ariaLabel}
  aria-describedby={ariaDescribedBy}
  aria-labelledby={ariaLabelledBy}
  {disabled}
  class:bx--btn={true}
  class:bx--btn--disabled={disabled}
  class:bx--btn--primary={kind === "primary"}
  class:bx--btn--secondary={kind === "secondary"}
  class:bx--btn--tertiary={kind === "tertiary"}
  class:bx--btn--ghost={kind === "ghost"}
  class:bx--btn--danger={kind === "danger"}
  class:bx--btn--danger-tertiary={kind === "danger-tertiary"}
  class:bx--btn--danger-ghost={kind === "danger-ghost"}
  class:bx--btn--xs={effectiveSize === "xs"}
  class:bx--btn--sm={effectiveSize === "small"}
  class:bx--btn--field={effectiveSize === "field"}
  class:bx--btn--lg={effectiveSize === "lg"}
  class:bx--btn--xl={effectiveSize === "xl"}
  class:bx--btn--icon-only={hasIconOnly}
  class:bx--tooltip__trigger={hasIconOnly && !hideTooltip}
  class:bx--tooltip--a11y={hasIconOnly && !hideTooltip}
  class:bx--btn--icon-only--top={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipPosition === "top"}
  class:bx--btn--icon-only--right={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipPosition === "right"}
  class:bx--btn--icon-only--bottom={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipPosition === "bottom"}
  class:bx--btn--icon-only--left={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipPosition === "left"}
  class:bx--tooltip--align-start={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipAlignment === "start"}
  class:bx--tooltip--align-center={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipAlignment === "center"}
  class:bx--tooltip--align-end={hasIconOnly &&
    !hideTooltip &&
    effectiveTooltipAlignment === "end"}
  class:bx--tooltip--hidden={hasTooltip && $tooltipHidden}
  class:bx--tooltip--visible={hasTooltip && $tooltipOpen}
  class:bx--tooltip--instant={hasTooltip && $tooltipInstant}
  on:keydown
>
  {#if hasIconOnly}
    <span class:bx--assistive-text={true}>{iconDescription}</span>
  {:else}
    <slot name="labelChildren">{labelText}</slot>
  {/if}
  {#if icon}
    <svelte:component
      this={icon}
      style={hasIconOnly ? "margin-inline-start: 0" : undefined}
      {...iconProps}
    />
  {/if}
</button>
<input
  bind:this={ref}
  use:formReset={handleFormReset}
  type="file"
  tabindex="-1"
  aria-hidden="true"
  accept={typeof accept === "string" ? accept : accept.join(",")}
  {capture}
  webkitdirectory={directory || undefined}
  {disabled}
  {id}
  {multiple}
  {name}
  aria-label={hasIconOnly ? iconDescription : labelText}
  class:bx--visually-hidden={true}
  {...inputRestProps}
  on:change={(event) => {
    processIncoming([.../** @type {HTMLInputElement} */ (event.target).files]);
  }}
  on:click
  on:click={(event) => {
    /** @type {HTMLInputElement} */ (event.target).value = "";
  }}
  on:cancel={() => {
    // The click cleared the input so the same file can be picked again; a
    // dismissed picker fires no change, so put the current files back.
    if (ref) syncInputFiles(ref, files);
  }}
/>
