<script>
  /**
   * @event {ReadonlyArray<File>} change
   */

  /**
   * Specify the accepted file types.
   * @type {ReadonlyArray<string>}
   */
  export let accept = [];

  /**
   * Obtain a reference to the uploaded files.
   * @type {ReadonlyArray<File>}
   */
  export let files = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to disable label changes */
  export let disableLabelChanges = false;

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

  /** Specify the label text */
  export let labelText = "Add file";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify a name attribute for the input */
  export let name = "";

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  /**
   * Specify the icon to render.
   * @type {any}
   */
  export let icon = undefined;

  /**
   * Specify the ARIA label for the button icon.
   * @type {string}
   */
  export let iconDescription = undefined;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies to icon-only buttons.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Set the position of the tooltip relative to the icon.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set to `true` to hide the tooltip while maintaining accessibility.
   * Only applies to icon-only buttons.
   * When `true`, the tooltip is visually hidden but the `iconDescription` remains accessible to screen readers.
   */
  export let hideTooltip = false;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let initialLabelText = labelText;

  // Determine if this is icon-only (has icon but no label content)
  $: hasIconOnly =
    icon && !$$slots.labelChildren && (!labelText || labelText === "");

  $: iconProps = {
    "aria-hidden": "true",
    class: "bx--btn__icon",
    "aria-label": iconDescription,
  };

  $: if (ref && files !== undefined) {
    if (files.length === 0) {
      labelText = initialLabelText;
      ref.value = "";
    }

    // Sync input files with component files array.
    try {
      const dt = new DataTransfer();
      for (const file of files) {
        dt.items.add(file);
      }
      ref.files = dt.files;
    } catch {
      // Fail open if DataTransfer API is not supported.
    }
  }
</script>

<button
  type="button"
  on:click={() => ref?.click()}
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
  class:bx--btn--sm={size === "small"}
  class:bx--btn--field={size === "field"}
  class:bx--btn--lg={size === "lg"}
  class:bx--btn--xl={size === "xl"}
  class:bx--btn--icon-only={hasIconOnly}
  class:bx--tooltip__trigger={hasIconOnly && !hideTooltip}
  class:bx--tooltip--a11y={hasIconOnly && !hideTooltip}
  class:bx--btn--icon-only--top={hasIconOnly &&
    !hideTooltip &&
    tooltipPosition === "top"}
  class:bx--btn--icon-only--right={hasIconOnly &&
    !hideTooltip &&
    tooltipPosition === "right"}
  class:bx--btn--icon-only--bottom={hasIconOnly &&
    !hideTooltip &&
    tooltipPosition === "bottom"}
  class:bx--btn--icon-only--left={hasIconOnly &&
    !hideTooltip &&
    tooltipPosition === "left"}
  class:bx--tooltip--align-start={hasIconOnly &&
    !hideTooltip &&
    tooltipAlignment === "start"}
  class:bx--tooltip--align-center={hasIconOnly &&
    !hideTooltip &&
    tooltipAlignment === "center"}
  class:bx--tooltip--align-end={hasIconOnly &&
    !hideTooltip &&
    tooltipAlignment === "end"}
  on:keydown
>
  {#if hasIconOnly}
    <span class:bx--assistive-text={true}>{iconDescription}</span>
  {:else}
    <slot name="labelChildren">
      {labelText}
    </slot>
  {/if}
  {#if icon}
    <svelte:component
      this={icon}
      style={hasIconOnly ? "margin-left: 0" : undefined}
      {...iconProps}
    />
  {/if}
</button>
<input
  bind:this={ref}
  type="file"
  tabindex="-1"
  {accept}
  {disabled}
  {id}
  {multiple}
  {name}
  aria-label={hasIconOnly ? iconDescription : labelText}
  class:bx--visually-hidden={true}
  {...$$restProps}
  on:change|stopPropagation={({ target }) => {
    files = multiple ? [...files, ...target.files] : [...target.files];

    if (files && files.length > 0 && !disableLabelChanges) {
      labelText = files.length > 1 ? `${files.length} files` : files[0].name;
    }

    dispatch("change", files);
  }}
  on:click
  on:click={({ target }) => {
    target.value = "";
  }}
/>
