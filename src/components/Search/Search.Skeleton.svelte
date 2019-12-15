<script>
  let className = undefined;
  export { className as class };
  export let small = false;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--skeleton', !small && '--search--xl', small && '--search--sm', className);
</script>

<div {...props} class={_class}>
  <span class={cx('--label')} />
  <div class={cx('--search-input')} />
</div>
