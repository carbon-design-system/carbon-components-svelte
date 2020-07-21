<script>
  export let size = undefined; // "sm" | "xl"
  export let selected = undefined;
  export let inline = false;
  export let light = false;
  export let disabled = false;
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;
  export let invalid = false;
  export let invalidText = "";
  export let helperText = "";
  export let noLabel = false;
  export let labelText = "";
  export let hideLabel = false;
  export let ref = null;

  import { createEventDispatcher, setContext, afterUpdate } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("Select", { selectedValue });

  afterUpdate(() => {
    selected = $selectedValue;
    dispatch("change", $selectedValue);
  });

  $: errorId = `error-${id}`;
  $: selectedValue.set(selected);
</script>

<div class:bx--form-item={true} {...$$restProps}>
  <div
    class:bx--select={true}
    class:bx--select--inline={inline}
    class:bx--select--light={light}
    class:bx--select--invalid={invalid}
    class:bx--select--disabled={disabled}>
    {#if !noLabel}
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}>
        {labelText}
      </label>
    {/if}
    {#if !inline && helperText}
      <div
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}>
        {helperText}
      </div>
    {/if}
    {#if inline}
      <div class:bx--select-input--inline__wrapper={true}>
        <div
          class:bx--select-input__wrapper={true}
          data-invalid={invalid || undefined}>
          <select
            bind:this={ref}
            aria-describedby={invalid ? errorId : undefined}
            aria-invalid={invalid || undefined}
            disabled={disabled || undefined}
            {id}
            {name}
            class:bx--select-input={true}
            class={size && `bx--select-input--${size}`}
            on:change={({ target }) => {
              selectedValue.set(target.value);
            }}
            on:blur>
            <slot />
          </select>
          <ChevronDown16 class="bx--select__arrow" />
          {#if invalid}
            <WarningFilled16 class="bx--select__invalid-icon" />
          {/if}
        </div>
        {#if invalid}
          <div class:bx--form-requirement={true} id={errorId}>
            {invalidText}
          </div>
        {/if}
      </div>
      {#if helperText}
        <div
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={disabled}>
          {helperText}
        </div>
      {/if}
    {/if}
    {#if !inline}
      <div
        class:bx--select-input__wrapper={true}
        data-invalid={invalid || undefined}>
        <select
          bind:this={ref}
          {id}
          {name}
          aria-describedby={invalid ? errorId : undefined}
          disabled={disabled || undefined}
          aria-invalid={invalid || undefined}
          class:bx--select-input={true}
          class={size && `bx--select-input--${size}`}
          on:change={({ target }) => {
            selectedValue.set(target.value);
          }}
          on:blur>
          <slot />
        </select>
        <ChevronDown16 class="bx--select__arrow" />
        {#if invalid}
          <WarningFilled16 class="bx--select__invalid-icon" />
        {/if}
      </div>
      {#if invalid}
        <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
      {/if}
    {/if}
  </div>
</div>
