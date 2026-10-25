<script>
  /** Specify the number of segments, as on the PinCodeInput it stands in for */
  export let count = 4;
</script>

<div
  class:bx--form-item={true}
  class:bx--text-input--fluid__skeleton={true}
  class:bx--pin-code-input--fluid__skeleton={true}
  style:--ccs-pin-code-count={count}
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--label={true} class:bx--skeleton={true}></span>
  <div class:bx--skeleton={true} class:bx--text-input={true}></div>
</div>
