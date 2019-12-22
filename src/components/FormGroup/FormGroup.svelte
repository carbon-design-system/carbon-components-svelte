<script>
  let className = undefined;
  export { className as class };
  export let legendText = '';
  export let invalid = false;
  export let message = false;
  export let messageText = '';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--fieldset', className);
  const _legendClass = cx('--label', className);
</script>

<fieldset
  data-invalid={invalid ? '' : undefined}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={_class}
  {style}>
  <legend class={_legendClass}>{legendText}</legend>
  <slot />
  {#if message}
    <div class={cx('--form__requirements')}>{messageText}</div>
  {/if}
</fieldset>
