<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--radio-button-wrapper', className);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <div class={cx('--radio-button', '--skeleton')} />
  <span class={cx('--radio-button__label', '--skeleton')} />
</div>
