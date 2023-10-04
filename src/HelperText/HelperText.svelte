<script>
  /** Specify the helper text as parameter */
  export let helperText = "";

  /** Set to `true` for the disabled variant */
  export let disabled = false;

  /** Set to `true` to use inline variant */
  export let inline = false;
</script>

<div
  class:bx--form__helper-text="{true}"
  class:bx--form__helper-text--disabled="{disabled}"
  class:bx--form__helper-text--inline="{inline}"
  {...$$restProps}
>
  <slot>{helperText}</slot>
</div>
