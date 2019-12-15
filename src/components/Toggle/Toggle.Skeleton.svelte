<script>
  let className = undefined;
  export { className as class };
  export let id = undefined;
  export let labelText = undefined;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--form-item', className);
  const ariaLabel = labelText ? null : $$props['aria-label'] || 'Toggle is loading';
</script>

<div {...props} class={_class}>
  <input type="checkbox" class={cx('--toggle --skeleton')} {id} />
  <label class={cx('--toggle__label', '--skeleton')} aria-label={ariaLabel} for={id}>
    {#if labelText}
      <span class={cx('--toggle__label-text')}>{labelText}</span>
    {/if}
    <span class={cx('--toggle__text--left')} />
    <span class={cx('--toggle__appearance')} />
    <span class={cx('--toggle__text--right')} />
  </label>
</div>
