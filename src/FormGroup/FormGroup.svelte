<script>
  /**
   * Set to `true` to indicate an invalid state
   * @type {boolean} [invalid=false]
   */
  export let invalid = false;

  /**
   * Set to `true` to render a form requirement
   * @type {boolean} [message=false]
   */
  export let message = false;

  /**
   * Specify the message text
   * @type {string} [messageText=""]
   */
  export let messageText = "";

  /**
   * Specify the legend text
   * @type {string} [legendText=""]
   */
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
