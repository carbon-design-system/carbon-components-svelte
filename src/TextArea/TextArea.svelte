<script>
  // @ts-check

  /** Specify the textarea value */
  export let value = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /**
   * Specify the number of cols
   * @type {number}
   * */
  export let cols = undefined;

  /** Specify the number of rows */
  export let rows = 4;

  /**
   * Specify the max character count
   * @type {number}
   */
  export let maxCount = undefined;

  /**
   * Specify the counter mode
   * @type {"character" | "word"}
   */
  export let counterMode = "character";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the text for the invalid state */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set an id for the textarea element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the textarea HTML element */
  export let ref = null;

  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";

  /** @type {(value: string) => number}*/
  function getTextCount(value) {
    if (counterMode === "character") {
      return value.length;
    } else {
      return value.match(/\w+/g)?.length || 0;
    }
  }

  $: error = invalid && !readonly;
  $: errorId = `error-${id}`;
  $: helperId = `helper-${id}`;
  $: warnId = `warn-${id}`;
</script>

<div class:bx--form-item="{true}">
  <div class:bx--text-area__label-wrapper="{true}">
    {#if (labelText || $$slots.labelText) && !hideLabel}
      <label
        for="{id}"
        class:bx--label="{true}"
        class:bx--visually-hidden="{hideLabel}"
        class:bx--label--disabled="{disabled}"
      >
        <slot name="labelText">
          {labelText}
        </slot>
      </label>
    {/if}
    {#if maxCount}
      <div class:bx--label="{true}" class:bx--label--disabled="{disabled}">
        {getTextCount(value)}/{maxCount}
      </div>
    {/if}
  </div>
  <div
    class:bx--text-area__wrapper="{true}"
    class:bx--text-area__wrapper--readonly="{readonly}"
    class:bx--text-area__wrapper--warn="{warn}"
    data-invalid="{invalid || undefined}"
  >
    {#if invalid}
      <WarningFilled class="bx--text-area__invalid-icon" />
    {:else if warn}
      <WarningAltFilled
        class="bx--text-area__invalid-icon bx--text-area__invalid-icon--warning"
      />
    {/if}
    <textarea
      bind:this="{ref}"
      bind:value="{value}"
      aria-invalid="{invalid || undefined}"
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
      cols="{cols}"
      rows="{rows}"
      placeholder="{placeholder}"
      readonly="{readonly}"
      class:bx--text-area="{true}"
      class:bx--text-area--light="{light}"
      class:bx--text-area--invalid="{invalid}"
      class:bx--text-area--warn="{warn}"
      maxlength="{typeof maxCount === 'number' && counterMode === 'character'
        ? maxCount
        : undefined}"
      style:width="{cols ? undefined : "100%"}"
      style:resize="{cols ? "none" : undefined}"
      {...$$restProps}
      on:change
      on:input
      on:keydown
      on:keyup
      on:focus
      on:blur
      on:paste></textarea>
  </div>
  {#if !invalid && helperText}
    <div
      id="{helperId}"
      class:bx--form__helper-text="{true}"
      class:bx--form__helper-text--disabled="{disabled}"
    >
      {helperText}
    </div>
  {/if}
  {#if !readonly}
    {#if invalid}
      <div id="{errorId}" class:bx--form-requirement="{true}">
        <slot name="invalidText">
          {invalidText}
        </slot>
      </div>
    {/if}
    {#if !invalid && warn}
      <div class:bx--form-requirement="{true}" id="{warnId}">
        <slot name="warnText">{warnText}</slot>
      </div>
    {/if}
  {/if}
</div>
