<script>
  let className = undefined;
  export { className as class };
  export let active = true;
  export let description = 'Active loading indicator';
  export let small = false;
  export let style = undefined;
  export let withOverlay = true;

  import { cx } from '../../lib';

  $: loadingId = `loading-${Math.random()}`;
  $: spinnerRadius = small ? '26.8125' : '37.5';
</script>

{#if withOverlay}
  <div class={cx('--loading-overlay', !active && '--loading-overlay--stop')}>
    <div
      aria-atomic="true"
      aria-labelledby={loadingId}
      aria-live={active ? 'assertive' : 'off'}
      class={cx('--loading', small && '--loading--small', !active && '--loading--stop', className)}
      {style}>
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
    aria-atomic="true"
    aria-labelledby={loadingId}
    aria-live={active ? 'assertive' : 'off'}
    class={cx('--loading', small && '--loading--small', !active && '--loading--stop', className)}
    {style}>
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
