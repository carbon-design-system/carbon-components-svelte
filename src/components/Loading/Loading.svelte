<script>
  let className = undefined;
  export { className as class };
  export let active = true;
  export let withOverlay = true;
  export let small = false;
  export let description = 'Active loading indicator';
  export let props = {};

  import { cx } from '../../lib';

  const loadingId = `loading-id-${Math.random()}`;
  const spinnerRadius = small ? '26.8125' : '37.5';
  const _class = cx(
    '--loading',
    small && '--loading--small',
    !active && '--loading--stop',
    className
  );
  const _overlayClass = cx('--loading-overlay', !active && '--loading-overlay--stop');
</script>

{#if withOverlay}
  <div class={_overlayClass}>
    <div
      {...props}
      aria-atomic="true"
      aria-labelledby={loadingId}
      aria-live={active ? 'assertive' : 'off'}
      class={_class}>
      <label id={loadingId} class={cx('--visually-hidden')}>{description}</label>
      <svg class={cx('--loading__svg')} viewBox="-75 -75 150 150">
        <title>{description}</title>
        {#if small}
          <circle class={cx('--loading__background')} cx="0" cy="0" r={spinnerRadius} />
        {/if}
        <circle class={cx('--loading__stroke')} cx="0" cy="0" r={spinnerRadius} />
      </svg>
    </div>
  </div>
{:else}
  <div
    {...props}
    aria-atomic="true"
    aria-labelledby={loadingId}
    aria-live={active ? 'assertive' : 'off'}
    class={_class}>
    <label id={loadingId} class={cx('--visually-hidden')}>{description}</label>
    <svg class={cx('--loading__svg')} viewBox="-75 -75 150 150">
      <title>{description}</title>
      {#if small}
        <circle class={cx('--loading__background')} cx="0" cy="0" r={spinnerRadius} />
      {/if}
      <circle class={cx('--loading__stroke')} cx="0" cy="0" r={spinnerRadius} />
    </svg>
  </div>
{/if}
