<script>
  /**
   * @restProps {fieldset}
   * @slot {{ describedBy: string | undefined; invalid: boolean; warn: boolean; size: "xs" | "sm" | "xl" | undefined }}
   * @slot {{}} legendChildren
   */

  /**
   * Specify the legend text that names a set of fields, such as an
   * amount and its currency. Leave it out for a single field beside a
   * button, and label the field itself.
   */
  export let legendText = "";

  /**
   * Set to `true` to visually hide the legend text.
   * The legend remains available to screen readers.
   */
  export let hideLegend = false;

  /** Specify the helper text, shown below the group */
  export let helperText = "";

  /**
   * Set to `true` to indicate an invalid state.
   * Pass the `invalid` slot prop to the field it applies to.
   */
  export let invalid = false;

  /** Specify the invalid state text, shown below the group */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text, shown below the group */
  export let warnText = "";

  /** Set to `true` to disable every field and button in the group */
  export let disabled = false;

  /**
   * Set the size of the fields in the group. Buttons in the group match
   * the field height. Defaults to the size of a parent `Form`.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /** Set an id for the group's label and messages */
  export let id = uniqueId();

  import { getContext, setContext } from "svelte";
  import { derived, readable, writable } from "svelte/store";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import {
    buildFieldIds,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** Button size whose height matches a field of each size. */
  const BUTTON_SIZE = { xs: "xs", sm: "small", md: "field", xl: undefined };

  const formSize = getContext(FORM_SIZE_CONTEXT_KEY) ?? readable(undefined);
  const ownSize = writable(size);
  $: ownSize.set(size);

  const sharedSize = derived(
    [ownSize, formSize],
    ([$ownSize, $formSize]) => $ownSize ?? $formSize,
  );

  // Fields read the size like any other form size; buttons read a height
  // match, the same way they read an `ActionSet`'s size.
  setContext(FORM_SIZE_CONTEXT_KEY, sharedSize);
  setContext("carbon:InputGroup", {
    buttonSize: derived(sharedSize, ($size) => BUTTON_SIZE[$size ?? "md"]),
  });

  $: labelId = `label-${id}`;
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  // As on a field, a disabled group shows neither state.
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
  }));
  $: describedBy = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    helperText,
    invalidText,
    warnText,
    errorId,
    warnId,
    helperId,
  });
</script>

<fieldset
  class:bx--input-group={true}
  class:bx--input-group--xs={$sharedSize === "xs"}
  class:bx--input-group--sm={$sharedSize === "sm"}
  class:bx--input-group--xl={$sharedSize === "xl"}
  class:bx--input-group--invalid={showInvalid}
  class:bx--input-group--warning={showWarn}
  disabled={disabled || undefined}
  {...$$restProps}
>
  {#if legendText || $$slots.legendChildren}
    <legend
      id={labelId}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLegend}
    >
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  <div class:bx--input-group__fields={true}>
    <slot
      {describedBy}
      invalid={showInvalid}
      warn={showWarn}
      size={$sharedSize}
    />
  </div>
  <!-- As on a field, invalid or warn replaces the helper text, even when
       the message has no text of its own. -->
  {#if showInvalid}
    {#if invalidText}
      <div
        id={errorId}
        class:bx--form-requirement={true}
        class:bx--form-requirement--invalid={true}
        role="alert"
      >
        {invalidText}
      </div>
    {/if}
  {:else if showWarn}
    {#if warnText}
      <div
        id={warnId}
        class:bx--form-requirement={true}
        class:bx--form-requirement--warn={true}
      >
        {warnText}
      </div>
    {/if}
  {:else if helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</fieldset>
