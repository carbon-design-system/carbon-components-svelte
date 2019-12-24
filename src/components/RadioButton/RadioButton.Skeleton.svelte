<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--radio-button-wrapper', className)}
  {style}>
  <div class={cx('--radio-button', '--skeleton')} />
  <span class={cx('--radio-button__label', '--skeleton')} />
</div>
