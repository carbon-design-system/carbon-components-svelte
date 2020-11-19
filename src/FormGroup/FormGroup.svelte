<script>
  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Set to `true` to render a form requirement */
  export let message = false;

  /** Specify the message text */
  export let messageText = "";

  /** Specify the legend text */
  export let legendText = "";
</script>

<fieldset
  data-invalid="{invalid || undefined}"
  class:bx--fieldset="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <legend class:bx--label="{true}">{legendText}</legend>
  <slot />
  {#if message}
    <div class:bx--form__requirement="{true}">{messageText}</div>
  {/if}
</fieldset>
