<script>
  export let action = undefined;
  export let type = undefined;
  export let icon = undefined;
  export let content = undefined;
  export let linkIsActive = undefined;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { leftPanelActions, leftPanelTypes } from '../constants';
  import { slide } from 'svelte/transition';

  let href = undefined;

  if (type === leftPanelTypes.link) {
    href = content.href;
  }

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

  .subject-divider span {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1rem;
    letter-spacing: 0.32px;
    color: #c6c6c6;
  }
</style>

{#if type === leftPanelTypes.link}
  <a
    aria-label={type}
    class={cx('--header__action', linkIsActive && '--header__action--active')}
    class:action-link={true}
    {href}>
    <Icon {...icon} />
  </a>
{:else}
  <button
    aria-label={type}
    class={cx('--header__action', linkIsActive && '--header__action--active')}
    type="button"
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        linkIsActive = !linkIsActive;
      }
    }}>
    <Icon {...icon} />
  </button>
  {#if linkIsActive && type === leftPanelTypes.links}
    <div
      class={cx('--header-panel', '--header-panel--expanded')}
      transition:slide={{ duration: 200 }}>
      <ul class={cx('--switcher__item')}>
        {#each content as subject}
          {#if subject.subject}
            <li class="subject-divider">
              <span>{subject.subject}</span>
            </li>
          {/if}
          {#each subject.items as link}
            <li class={cx('--switcher__item')}>
              <a class={cx('--switcher__item-link')} href={link.href}>{link.text}</a>
            </li>
          {/each}
        {/each}
      </ul>
    </div>
  {/if}
{/if}
