<script>
  export let href = undefined;
  export let type = undefined;
  export let icon = undefined;
  export let linkIsActive = undefined;
  export let text = undefined;
  import { cx, optional } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
</script>

<style>
  .subject-divider {
    color: #525252;
    padding-bottom: 4px;
    border-bottom: 1px solid #525252;
    margin: 32px 1rem 8px;
  }
</style>

<a
  aria-label={type}
  class={cx('--header__action', linkIsActive && '--header__action--active', text && '--header__action--text')}
  {href}>
  <Icon {...icon} />
  {optional(text)}
</a>
