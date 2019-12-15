<script>
  let className = undefined;
  export { className as class };
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--radio-button-wrapper', className);
</script>

<div {...props} class={_class}>
  <div class={cx('--radio-button', '--skeleton')} />
  <span class={cx('--radio-button__label', '--skeleton')} />
</div>
