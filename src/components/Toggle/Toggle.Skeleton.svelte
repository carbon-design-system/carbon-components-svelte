<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let labelText = '';
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <input type="checkbox" class={cx('--toggle --skeleton')} {id} />
  <label
    aria-label={labelText ? undefined : $$props['aria-label'] || 'Toggle is loading'}
    class={cx('--toggle__label', '--skeleton')}
    for={id}>
    {#if labelText}
      <span class={cx('--toggle__label-text')}>{labelText}</span>
    {/if}
    <span class={cx('--toggle__text--left')} />
    <span class={cx('--toggle__appearance')} />
    <span class={cx('--toggle__text--right')} />
  </label>
</div>
