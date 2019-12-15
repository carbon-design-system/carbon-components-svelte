<script>
  let className = undefined;
  export { className as class };
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--form-item', '--checkbox-wrapper', className);
</script>

<div {...props} class={_class}>
  <span class={cx('--checkbox-label', '--skeleton')} />
</div>
