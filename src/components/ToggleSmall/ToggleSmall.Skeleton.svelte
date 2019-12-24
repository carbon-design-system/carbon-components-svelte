<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let labelText = '';
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <input type="checkbox" class={cx('--toggle', '--toggle--small', '--skeleton')} {id} />
  <label
    aria-label={labelText ? undefined : $$props['aria-label'] || 'Toggle is loading'}
    class={cx('--toggle__label --skeleton')}
    for={id}>
    {#if labelText}
      <span class={cx('--toggle__label-text')}>{labelText}</span>
    {/if}
    <span class={cx('--toggle__appearance')}>
      <svg class={cx('--toggle__check')} width="6" height="5" viewBox="0 0 6 5">
        <path d="M2.2403 2.7299L4.9245 0 6 1.1117 2.2384 5 0 2.6863 1.0612 1.511z" />
      </svg>
    </span>
  </label>
</div>
