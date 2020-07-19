<script>
  export let value = "";
  export let placeholder = "";
  export let cols = 50;
  export let rows = 4;
  export let light = false;
  export let disabled = false;
  export let helperText = "";
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;
  export let invalid = false;
  export let invalidText = "";
  export let labelText = "";
  export let hideLabel = false;
  export let ref = null;

  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";

  $: errorId = `error-${id}`;
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class:bx--form-item={true}>
  {#if labelText && !hideLabel}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}>
      {labelText}
    </label>
  {/if}
  {#if helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}>
      {helperText}
    </div>
  {/if}
  <div class:bx--text-area__wrapper={true} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class="bx--text-area__invalid-icon" />
    {/if}
    <textarea
      bind:this={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {disabled}
      {id}
      {name}
      {cols}
      {rows}
      {value}
      {placeholder}
      class:bx--text-area={true}
      class:bx--text-area--light={light}
      class:bx--text-area--invalid={invalid}
      {...$$restProps}
      on:change
      on:input
      on:input={({ target }) => {
        value = target.value;
      }}
      on:focus
      on:blur />
  </div>
  {#if invalid}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
</div>
