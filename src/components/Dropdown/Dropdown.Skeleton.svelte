<script>
  let className = undefined;
  export { className as class };
  export let inline = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--skeleton', '--dropdown-v2', '--list-box', '--form-item', inline && '--list-box--inline', className)}
  {style}>
  <div role="button" class={cx('--list-box__field')}>
    <span class={cx('--list-box__label')} />
  </div>
</div>
