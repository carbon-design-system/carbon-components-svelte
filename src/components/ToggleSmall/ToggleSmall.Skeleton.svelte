<script>
  let className = undefined;
  export { className as class };
  export let id = undefined;
  export let labelText = undefined;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--form-item', className);
  const ariaLabel = labelText ? undefined : $$props['aria-label'] || 'Toggle is loading';
</script>

<div {...props} class={_class}>
  <input type="checkbox" class={cx('--toggle', '--toggle--small', '--skeleton')} {id} />
  <label class={cx('--toggle__label --skeleton')} for={id}>
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
