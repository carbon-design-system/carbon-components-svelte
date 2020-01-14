<script>
  export let ariaLabel = undefined;
  export let isOpen = false;

  import { cx } from '../../../lib';
  import Menu20 from 'carbon-icons-svelte/lib/Menu20';
  import Icon from '../../Icon/Icon.svelte';
  import { fly } from "svelte/transition";
  import { closeIcon } from '../constants';

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
  transition:fly={{ x: -200, delay: 50, duration: 250 }}
  aria-label={ariaLabel}
  class={cx('--header__action', '--header__menu-trigger', '--header__menu-toggle')}
  title="Open menu"
  type="button"
  on:click={() => isOpen = !isOpen}>
  <Icon {...iconProps} />
</button>
