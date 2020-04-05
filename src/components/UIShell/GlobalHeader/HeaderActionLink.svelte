<script>
  export let href = undefined;
  export let type = undefined;
  export let icon = undefined;
  export let linkIsActive = undefined;
  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
</script>

<style>
  .action-link {
    text-align: center;
    align-items: center;
    vertical-align: middle;
    justify-content: center;
    padding-top: 10px;
  }
  .subject-divider {
    color: #525252;
    padding-bottom: 4px;
    border-bottom: 1px solid #525252;
    margin: 32px 1rem 8px;
  }
</style>

<a
  aria-label={type}
  class={cx('--header__action', linkIsActive && '--header__action--active')}
  class:action-link={true}
  {href}>
  <Icon {...icon} />
</a>
