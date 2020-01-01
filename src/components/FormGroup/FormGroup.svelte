<script>
  let className = undefined;
  export { className as class };
  export let invalid = false;
  export let legendText = '';
  export let message = false;
  export let messageText = '';
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<fieldset
  data-invalid={invalid || undefined}
  class={cx('--fieldset', className)}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  {style}>
  <legend class={cx('--label', className)}>{legendText}</legend>
  <slot />
  {#if message}
    <div class={cx('--form__requirements')}>{messageText}</div>
  {/if}
</fieldset>
