<script>
  /** Set to `true` for to remove the bottom margin */
  export let noMargin = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Set to `true` to render a form requirement */
  export let message = false;

  /** Specify the message text */
  export let messageText = "";

  /** Specify the legend text */
  export let legendText = "";

  /** Specify an id for the legend element */
  export let legendId = "";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<fieldset
  data-invalid="{invalid || undefined}"
  class:bx--fieldset="{true}"
  class:bx--fieldset--no-margin="{noMargin}"
  aria-labelledby="{$$restProps['aria-labelledby'] || legendId}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if legendText}
    <legend
      class:bx--label="{true}"
      id="{legendId || $$restProps['aria-labelledby']}">{legendText}</legend
    >
  {/if}
  <slot />
  {#if message}
    <div class:bx--form__requirement="{true}">{messageText}</div>
  {/if}
</fieldset>
