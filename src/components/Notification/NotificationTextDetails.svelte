<script>
  export let caption = 'caption';
  export let notificationType = 'toast';
  export let subtitle = '';
  export let title = 'title';

  import { cx } from '../../lib';
</script>

{#if notificationType === 'toast'}
  <div class={cx('--toast-notification__details')}>
    <h3 class={cx('--toast-notification__title')}>{title}</h3>
    <div class={cx('--toast-notification__subtitle')}>{subtitle}</div>
    <div class={cx('--toast-notification__caption')}>{caption}</div>
    <slot />
  </div>
{/if}

{#if notificationType === 'inline'}
  <div class={cx('--inline-notification__text-wrapper')}>
    <p class={cx('--inline-notification__title')}>{title}</p>
    <div class={cx('--inline-notification__subtitle')}>{subtitle}</div>
    <slot />
  </div>
{/if}
