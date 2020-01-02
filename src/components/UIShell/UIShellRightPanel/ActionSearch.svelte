<script>
  export let action = undefined;
  // export let type = undefined;
  export let icon = undefined;
  // export let content = undefined;

  // import { onMount } from 'svelte';
  import { cx } from '../../../lib';
  import Search20 from 'carbon-icons-svelte/lib/Search20';
  import Icon from '../../Icon/Icon.svelte';

  $: searchIconProps =
    action === 'search'
      ? (searchIconProps = [
          {
            class: undefined,
            skeleton: false,
            render: Search20,
            title: 'Search',
            tabIndex: 0,
            focusable: false,
            style: undefined
          }
        ])
      : (searchIconProps = []);
</script>

{#if action === 'search'}
  <button aria-label="Notifications" class={cx('--header__action')} type="button">
    <Icon {...searchIconProps} render={searchIconProps[0].render} />
  </button>
{:else}
  <button aria-label="Notifications" class={cx('--header__action')} type="button">
    <Icon {...icon} render={icon[0].render} />
  </button>
{/if}
