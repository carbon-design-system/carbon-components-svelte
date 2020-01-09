<script>
  export let action = undefined;
  export let type = undefined;
  export let icon = undefined;
  // export let content = undefined;
  export let linkIsActive = undefined;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { leftPanelActions } from '../constants';
  import { slide } from 'svelte/transition';

  if (!icon) {
    const actionsArray = Object.entries(leftPanelActions);

    for (const definedAction of actionsArray) {
      for (const content of definedAction) {
        if (typeof content === 'object') {
          if (content.actionString === action) {
            icon = content.iconProps;
          }
        }
      }
    }
  }
</script>

<button
  aria-label={type}
  class={cx('--header__action', linkIsActive && '--header__action--active')}
  type="button">
  <Icon {...icon} render={icon.render} />
</button>
{#if linkIsActive}
  <div class="bx--header-panel bx--header-panel--expanded" transition:slide={{ duration: 200 }}>
    <ul class="bx--switcher__item">
      <li class="bx--switcher__item">
        <a class="bx--switcher__item-link bx--switcher__item-link--selected" href="/">Link</a>
      </li>
      <li class="bx--switcher__item">
        <a class="bx--switcher__item-link" href="/">Link</a>
      </li>
      <li class="bx--switcher__item">
        <a class="bx--switcher__item-link" href="/">Link</a>
      </li>
      <li class="bx--switcher__item">
        <a class="bx--switcher__item-link" href="/">Link</a>
      </li>
      <li class="bx--switcher__item">
        <a class="bx--switcher__item-link" href="/">Link</a>
      </li>
      <li class="bx--switcher__item">
        <a class="bx--switcher__item-link" href="/">Link</a>
      </li>
    </ul>
  </div>
{/if}
