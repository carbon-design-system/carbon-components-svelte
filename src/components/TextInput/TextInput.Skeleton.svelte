<script>
  let className = undefined;
  export { className as class };
  export let hideLabel = false;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--form-item', className);
</script>

<div {...props} class={_class}>
  {#if !hideLabel}
    <span class={cx('--label', '--skeleton')} />
  {/if}
  <div class={cx('--skeleton', '--text-area')} />
</div>
