<script>
  /**
   * @event {null | number | string} change
   * @event {null | number | string} input
   */

  /**
   * Set to "char" to enable display the character counter or "word" to display the word count.
   * @type {"char" | "word"}
   */
  export let counter = undefined;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Specify the label text */
  export let labelText = "";

  /**
   * Set to `true` to enable the light variant
   * For use on $ui-01 backgrounds only. Don't use this to make tile background color same as container background color
   * The light prop for `TextInput` has been deprecated in favor of the new `Layer` Layer component. It will be removed in the next major release
   * @deprecated
   */
  export let light = false;

  /**
   * Specify the maximum number of characters/words allowed
   * This is needed in order for `counter` to display
   * @type {number}
   */
  export let maxCount = undefined;

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /**
   * Set the size of the input
   * @type {"sm" | "md" | "lg"}
   */
  export let size = 'md';

  /**
   * Specify the input value
   * `value` will be set to `null` if `type = "number"` and the value is empty
   * @type {null | number | string}
   */
  export let value = "";

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Set HTML attributes on the `label` element
   * @type {import('svelte/elements').HTMLLabelAttributes}
   */
  export let labelAttributes = {};

  /**
   * Set HTML attributes on the `input` element
   * @type {import('svelte/elements').HTMLInputAttributes}
   */
  export let inputAttributes = {};

  import { createEventDispatcher, getContext } from "svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";

  const ctx = getContext("Form");
  const dispatch = createEventDispatcher();
  let count = 0;

  function parse(raw) {
    if ($$restProps.type !== "number") return raw;
    return raw != "" ? Number(raw) : null;
  }

  /** @type {(e: Event) => void} */
  const onInput = (e) => {
    value = parse(e.target.value);
    if (maxCount && value.length > maxCount) value = value.slice(0, maxCount);
    if (counter && maxCount) updateCount();
    dispatch("input", value);
  };

  /** @type {(e: Event) => void} */
  const onChange = (e) => {
    dispatch("change", parse(e.target.value));
  };

  const updateCount = () => {
    if (counter === "char") {
      count = value.length;
    } else if (counter === "word") {
      count = value.split(/\b\w+\b/).length - 1;
    }
  };

  $: isFluid = !!ctx && ctx.isFluid;
  $: error = invalid && !readonly;
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item="{true}"
  class:bx--text-input-wrapper="{true}"
  class:bx--text-input-wrapper--inline="{inline}"
  class:bx--text-input-wrapper--light="{light}"
  class:bx--text-input-wrapper--readonly="{readonly}"
  on:click
  on:pointerup
  on:pointerover
  on:pointerenter
  on:pointerleave
>
  {#if inline}
    <div class:bx--text-input__label-helper-wrapper="{true}">
      {#if labelText}
        <label
          for="{id}"
          class:bx--label="{true}"
          class:bx--visually-hidden="{hideLabel}"
          class:bx--label--disabled="{disabled}"
          class:bx--label--inline="{inline}"
          class:bx--label--inline--sm="{size === 'sm'}"
          class:bx--label--inline--md="{size === 'md'}"
          class:bx--label--inline--lg="{size === 'lg' || size === 'xl'}"
          {...labelAttributes}
        >
          <slot name="labelText">
            {labelText}
          </slot>
        </label>
        {#if maxCount && counter}
          <div
            class:bx--label="{true}"
            class:bx--text-input__label-counter="{true}"
          >
            {count}/{maxCount}
          </div>
        {/if}
      {/if}
      {#if !isFluid && (helperText || $$slots.helperText)}
        <div
          class:bx--form__helper-text="{true}"
          class:bx--form__helper-text--disabled="{disabled}"
          class:bx--form__helper-text--inline="{inline}"
        >
          <slot name="helperText">
            {helperText}
          </slot>
        </div>
      {/if}
    </div>
  {/if}
  {#if !inline && (labelText || $$slots.labelText)}
    <div class:bx--text-input__label-wrapper="{true}">
      <label
        for="{id}"
        class:bx--label="{true}"
        class:bx--visually-hidden="{hideLabel}"
        class:bx--label--disabled="{disabled}"
        class:bx--label--inline="{inline}"
        class:bx--label--inline-sm="{inline && size === 'sm'}"
        class:bx--label--inline-md="{inline && size === 'md'}"
        class:bx--label--inline-lg="{inline &&
          (size === 'lg' || size === 'xl')}"
        {...labelAttributes}
      >
        <slot name="labelText">
          {labelText}
        </slot>
      </label>
      {#if maxCount && counter}
        <div
          class:bx--label="{true}"
          class:bx--text-input__label-counter="{true}"
          class:fluid-form-fix__label-counter="{isFluid}"
        >
          {count}/{maxCount}
        </div>
      {/if}
    </div>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper="{true}"
    class:bx--text-input__field-outer-wrapper--inline="{inline}"
  >
    <div
      data-invalid="{error || undefined}"
      data-warn="{warn || undefined}"
      class:bx--text-input__field-wrapper="{true}"
      class:bx--text-input__field-wrapper--warning="{!invalid && warn}"
    >
      {#if !readonly}
        {#if invalid}
          {#if isFluid && invalidText.length === 0}
            <WarningFilled
              class="bx--text-input__invalid-icon"
              style="inset-block-start: 3rem;"
            />
          {:else}
            <WarningFilled class="bx--text-input__invalid-icon" />
          {/if}
        {/if}
        {#if !invalid && warn}
          <WarningAltFilled
            class="bx--text-input__invalid-icon
            bx--text-input__invalid-icon--warning"
          />
        {/if}
      {/if}
      <input
        bind:this="{ref}"
        data-invalid="{error || undefined}"
        aria-invalid="{error || undefined}"
        data-warn="{warn || undefined}"
        aria-describedby="{error
          ? errorId
          : warn
          ? warnId
          : helperText
          ? helperId
          : undefined}"
        disabled="{disabled}"
        id="{id}"
        name="{name}"
        placeholder="{placeholder}"
        bind:value="{value}"
        required="{required}"
        readonly="{readonly}"
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--invalid="{error}"
        class:bx--text-input--warning="{warn}"
        class:bx--text-input--sm="{size === 'sm'}"
        class:bx--text-input--md="{size === 'md'}"
        class:bx--text-input--lg="{size === 'lg' || size === 'xl'}"
        class:bx--layout--size-sm="{size === 'sm'}"
        class:bx--layout--size-md="{size === 'md'}"
        class:bx--layout--size-lg="{size === 'lg' || size === 'xl'}"
        {...inputAttributes}
        on:change="{onChange}"
        on:input="{onInput}"
        on:keydown
        on:keyup
        on:focus
        on:blur
        on:paste
      />
      {#if isFluid}
        <hr class:bx--text-input__divider="{true}" />
      {/if}
      {#if isFluid && !inline && invalid}
        <div class:bx--form-requirement="{true}" id="{errorId}">
          <slot name="invalidText">
            {invalidText}
          </slot>
        </div>
      {/if}
      {#if isFluid && !inline && warn}
        <div class:bx--form-requirement="{true}" id="{warnId}">
          <slot name="warnText">{warnText}</slot>
        </div>
      {/if}
    </div>
    {#if !invalid && !warn && !isFluid && !inline && (helperText || $$slots.helperText)}
      <div
        id="{helperId}"
        class:bx--form__helper-text="{true}"
        class:bx--form__helper-text--disabled="{disabled}"
        class:bx--form__helper-text--inline="{inline}"
      >
        <slot name="helperText">
          {helperText}
        </slot>
      </div>
    {/if}
    {#if !isFluid && invalid}
      <div class:bx--form-requirement="{true}" id="{errorId}">
        <slot name="invalidText">
          {invalidText}
        </slot>
      </div>
    {/if}
    {#if !isFluid && !invalid && warn}
      <div class:bx--form-requirement="{true}" id="{warnId}">
        <slot name="warnText">{warnText}</slot>
      </div>
    {/if}
  </div>
</div>

<style>
  .fluid-form-fix__label-counter {
    right: 0;
    inset-inline-start: unset;
    padding-right: 1rem;
  }
</style>
