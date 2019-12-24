<script>
  let className = undefined;
  export { className as class };
  export let small = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--skeleton', !small && '--search--xl', small && '--search--sm', className)}
  {style}>
  <span class={cx('--label')} />
  <div class={cx('--search-input')} />
</div>
