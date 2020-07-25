<script>
  export let invalid = false;
  export let message = false;
  export let messageText = "";
  export let legendText = "";
</script>

<fieldset
  data-invalid={invalid || undefined}
  class:bx--fieldset={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <legend class:bx--label={true}>{legendText}</legend>
  <slot />
  {#if message}
    <div class:bx--form__requirement={true}>{messageText}</div>
  {/if}
</fieldset>
