<script>
  export let ariaLabel = undefined;

  import { cx } from '../../../lib';
  import Menu20 from 'carbon-icons-svelte/lib/Menu20';
  import Icon from '../../Icon/Icon.svelte';
  import { closeIcon } from '../constants';

  let isOpen = false;

  $: iconProps = !isOpen ? {
      class: undefined,
      skeleton: false,
      render: Menu20,
      title: 'Open Menu',
      tabIndex: 0,
      focusable: false,
      style: undefined
    } : closeIcon;
</script>

<button
  aria-label={ariaLabel}
  class={cx('--header__action', '--header__menu-trigger', '--header__menu-toggle')}
  title="Open menu"
  type="button"
  on:click={() => isOpen = !isOpen}>
  <Icon {...iconProps} />
</button>
