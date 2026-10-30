<script>
  /**
   * @template {string | number} [Value=string | number]
   * @event {Value} update The selected value.
   */

  /**
   * Specify the selected item value.
   * @type {Value | undefined}
   * @bindable writable
   */
  export let selected = undefined;

  /**
   * Set the size of the select input.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to disable the select element */
  export let disabled = false;

  /** Set an id for the select element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the select element.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to not render a label */
  export let noLabel = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Obtain a reference to the select HTML element.
   * @bindable readonly
   * @type {null | HTMLSelectElement}
   */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` for the select to be read-only */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   * Cannot be combined with the inline variant.
   */
  export let fluid = false;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    setContext,
    tick,
  } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const formContext = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);
  /**
   * @type {import("svelte/store").Writable<string | number | undefined>}
   */
  const selectedValue = writable(selected);
  const defaultSelectId = writable(null);
  const defaultValue = writable(null);
  const itemTypesByValue = writable({});
  // Every `SelectItem` registers itself from its own script body during the
  // same synchronous mount pass; batch those updates into one flush instead
  // of notifying subscribers once per item.
  const batchedItemTypesUpdate = batchStoreUpdates(itemTypesByValue);

  /**
   * Use the first `SelectItem` value as the
   * default value if `selected` is `undefined`.
   * @type {(id: string, value: string | number) => void}
   */
  function setDefaultValue(id, value) {
    if ($defaultValue === null) {
      defaultSelectId.set(id);
      defaultValue.set(value);
    } else {
      if ($defaultSelectId === id) {
        selectedValue.set(value);
      }
    }

    batchedItemTypesUpdate((types) => ({
      ...types,
      [value]: typeof value,
    }));
  }

  setContext("carbon:Select", {
    selectedValue,
    setDefaultValue,
    syncNativeSelectValue,
  });

  /** @param {Event} event */
  function handleChange(event) {
    const select = /** @type {HTMLSelectElement} */ (event.target);
    // A person can only pick a listed option. No option selected means a
    // script set a value the select doesn't list, so keep the current one.
    if (select.selectedIndex === -1) {
      syncNativeSelectValue();
      return;
    }

    let value = select.value;

    if ($itemTypesByValue[value] === "number") {
      value = Number(value);
    }

    selectedValue.set(value);
  }

  /** @type {(e: MouseEvent) => void} */
  function handleMousedown(event) {
    if (readonly) {
      event.preventDefault();
      /** @type {HTMLSelectElement} */ (event.currentTarget).focus();
    }
  }

  /** @type {(e: KeyboardEvent) => void} */
  function handleKeydown(event) {
    // A closed select changes value on arrows, Space, Home/End, and
    // typeahead letters, so block every key but focus movement. Ctrl/Cmd
    // shortcuts (copy, find, reload) never change the value.
    if (
      readonly &&
      event.key !== "Tab" &&
      event.key !== "Shift" &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
    }
  }

  let prevSelected = null;

  afterUpdate(() => {
    if (selected !== $selectedValue) {
      const isInitialRender = prevSelected === null;
      selected = $selectedValue;
      if (!isInitialRender) {
        dispatch("update", $selectedValue);
      }
    }

    prevSelected = selected;
  });

  // Options mounted after selected is set do not update the native value.
  // selectedIndex -1 comes back as value "", indistinguishable from an
  // empty-valued option being selected, so it must be re-asserted explicitly.
  function syncNativeSelectValue() {
    tick().then(() => {
      if (!ref) return;
      const nextValue = $selectedValue == null ? "" : String($selectedValue);
      if (ref.selectedIndex === -1 || ref.value !== nextValue) {
        ref.value = nextValue;
      }
    });
  }

  $: ({ errorId, warnId, helperId, readonlyId } = buildFieldIds(id));
  $: {
    selectedValue.set(selected ?? $defaultValue);
    syncNativeSelectValue();
  }
  // Invalid/warn states are suppressed when the select is disabled or read-only.
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = !inline && (fluid || !!formContext?.isFluid);
  $: statusDescribedById = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    invalidText,
    warnText,
    helperText,
    isFluid,
    errorId,
    warnId,
    helperId,
  });
  $: describedById = joinDescribedBy(
    readonly ? readonlyId : null,
    statusDescribedById,
  );
</script>

<div
  class:bx--form-item={true}
  class:bx--select--fluid={isFluid}
  class:bx--select__form-item--inline={inline}
>
  <div
    class:bx--select={true}
    class:bx--select--inline={inline}
    class:bx--select--invalid={showInvalid}
    class:bx--select--disabled={disabled}
    class:bx--select--warning={showWarn}
    class:bx--select--readonly={readonly}
  >
    {#if !noLabel && (labelText || $$slots.labelChildren)}
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
        use:titleWhenTruncated={{ enabled: isFluid && !$$slots.labelChildren }}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    {/if}
    {#if inline}
      <div class:bx--select-input--inline__wrapper={true}>
        <div
          class:bx--select-input__wrapper={true}
          class:bx--select-input__wrapper--decorator={$$slots.decorator &&
            !isFluid}
          class:bx--select-input__wrapper--ai-label={$aiLabelState === "active"}
          data-invalid={showInvalid || undefined}
        >
          <select
            bind:this={ref}
            aria-invalid={showInvalid ? "true" : undefined}
            aria-readonly={readonly ? "true" : undefined}
            disabled={disabled || undefined}
            required={required || undefined}
            {id}
            {name}
            class:bx--select-input={true}
            class:bx--select-input--xs={effectiveSize === "xs"}
            class:bx--select-input--sm={effectiveSize === "sm"}
            class:bx--select-input--xl={effectiveSize === "xl"}
            {...$$restProps}
            aria-describedby={joinDescribedBy(
              describedById,
              $$restProps["aria-describedby"],
            )}
            on:change={handleChange}
            on:change
            on:input
            on:focus
            on:blur
            on:mousedown={handleMousedown}
            on:keydown={handleKeydown}
          >
            <slot />
          </select>
          <ChevronDown class="bx--select__arrow" />
          {#if $$slots.decorator}
            <Decorator
              class="bx--field-decorator bx--select__inner-wrapper--decorator"
              size={effectiveSize}
              state={aiLabelState}
            >
              <slot name="decorator" />
            </Decorator>
          {/if}
          {#if showInvalid}
            <WarningFilled class="bx--select__invalid-icon" />
          {/if}
          {#if showWarn}
            <WarningAltFilled
              class="bx--select__invalid-icon bx--select__invalid-icon--warning"
            />
          {/if}
        </div>
        {#if readonly}
          <span id={readonlyId} class:bx--visually-hidden={true}
            >{readonlyText}</span
          >
        {/if}
        {#if showInvalid && invalidText}
          <div class:bx--form-requirement={true} id={errorId} role="alert">
            {invalidText}
          </div>
        {/if}
        {#if showWarn && warnText}
          <div class:bx--form-requirement={true} id={warnId}>
            {warnText}
          </div>
        {/if}
        <!-- Under the field, where the messages it alternates with go. -->
        {#if helperText && !showInvalid && !showWarn}
          <div
            id={helperId}
            class:bx--form__helper-text={true}
            class:bx--form__helper-text--disabled={disabled}
          >
            {helperText}
          </div>
        {/if}
      </div>
    {/if}
    {#if !inline}
      <div
        class:bx--select-input__wrapper={true}
        class:bx--select-input__wrapper--decorator={$$slots.decorator &&
          !isFluid}
        class:bx--select-input__wrapper--ai-label={$aiLabelState === "active"}
        data-invalid={showInvalid || undefined}
      >
        <select
          bind:this={ref}
          {id}
          {name}
          disabled={disabled || undefined}
          required={required || undefined}
          aria-invalid={showInvalid ? "true" : undefined}
          aria-readonly={readonly ? "true" : undefined}
          class:bx--select-input={true}
          class:bx--select-input--xs={effectiveSize === "xs"}
          class:bx--select-input--sm={effectiveSize === "sm"}
          class:bx--select-input--xl={effectiveSize === "xl"}
          {...$$restProps}
          aria-describedby={joinDescribedBy(
            describedById,
            $$restProps["aria-describedby"],
          )}
          on:change={handleChange}
          on:change
          on:input
          on:focus
          on:blur
          on:mousedown={handleMousedown}
          on:keydown={handleKeydown}
        >
          <slot />
        </select>
        <ChevronDown class="bx--select__arrow" />
        {#if $$slots.decorator}
          <Decorator
            class="bx--field-decorator bx--select__inner-wrapper--decorator"
            size={effectiveSize}
            state={aiLabelState}
          >
            <slot name="decorator" />
          </Decorator>
        {/if}
        {#if showInvalid}
          <WarningFilled class="bx--select__invalid-icon" />
        {/if}
        {#if showWarn}
          <WarningAltFilled
            class="bx--select__invalid-icon bx--select__invalid-icon--warning"
          />
        {/if}
        {#if isFluid}
          <hr class:bx--select__divider={true} />
          {#if showInvalid && invalidText}
            <div id={errorId} class:bx--form-requirement={true} role="alert">
              {invalidText}
            </div>
          {/if}
          {#if showWarn && warnText}
            <div id={warnId} class:bx--form-requirement={true}>
              {warnText}
            </div>
          {/if}
        {/if}
      </div>
      {#if readonly}
        <span id={readonlyId} class:bx--visually-hidden={true}
          >{readonlyText}</span
        >
      {/if}
      {#if !isFluid && helperText && !showInvalid && !showWarn}
        <div
          id={helperId}
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={disabled}
        >
          {helperText}
        </div>
      {/if}
      {#if !isFluid && showInvalid && invalidText}
        <div id={errorId} class:bx--form-requirement={true} role="alert">
          {invalidText}
        </div>
      {/if}
      {#if !isFluid && showWarn && warnText}
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    {/if}
  </div>
</div>
