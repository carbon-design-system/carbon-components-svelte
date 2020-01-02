<script>
  export let action = undefined;
  // export let type = undefined;
  // export let icon = undefined;
  // export let content = undefined;

  // import { onMount } from 'svelte';
  import { cx } from '../../../lib';
  import AppSwitcher20 from 'carbon-icons-svelte/lib/AppSwitcher20';
  import Icon from '../../Icon/Icon.svelte';

  console.log(action);

  $: switcherIconProps =
    action === 'switcher'
      ? (switcherIconProps = [
          {
            class: undefined,
            skeleton: false,
            render: AppSwitcher20,
            title: 'Switcher',
            tabIndex: 0,
            focusable: false,
            style: undefined
          }
        ])
      : (switcherIconProps = []);
</script>

{#if action === 'switcher'}
  <button aria-label="Notifications" class={cx('--header__action')} type="button">
    <Icon {...switcherIconProps} render={switcherIconProps[0].render} />
  </button>
{:else}
  <!-- <button aria-label="Notifications" class={cx('--header__action')} type="button">
    <Icon {...icon} render={icon[0].render} />
  </button> -->
{/if}
