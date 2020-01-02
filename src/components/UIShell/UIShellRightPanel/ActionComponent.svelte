<script>
  // export let action = undefined;
  // export let type = undefined;
  export let icon = undefined;
  // export let content = undefined;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
</script>

<button aria-label="Notifications" class={cx('--header__action')} type="button">
  <Icon {...icon} render={icon[0].render} />
</button>
