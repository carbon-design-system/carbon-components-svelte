<script>
  export let action = undefined;
  export let icon = undefined;
  // export let content = undefined;
  export let searchIsActive = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { leftPanelActions, closeIcon } from '../constants';

  // let searchIconProps = undefined;
  let searchTabIndex = 0;
  let closeTabIndex = -1;
  const dispatch = createEventDispatcher();

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

  $: if (searchIsActive) {
    searchTabIndex = -1;
    closeTabIndex = 0;
  } else {
    searchTabIndex = 0;
    closeTabIndex = -1;
  }
</script>

<style>
  .search-wrapper {
    display: flex;
    flex-grow: 1;
    border-bottom: 1px solid #393939;
  }

  .btn-search {
    width: 3rem;
    height: 100%;
    padding: 0;
    flex-shrink: 0;
    opacity: 1;
    transition: background-color 0.11s cubic-bezier(0.2, 0, 0.38, 0.9),
      opacity 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .btn-search-disabled {
    border: none;
    pointer-events: none;
  }

  .input-search {
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.375rem;
    letter-spacing: 0;
    color: #fff;
    caret-color: #fff;
    background-color: initial;
    border: none;
    outline: none;
    width: 100%;
    height: 3rem;
    padding: 0;
    transition: opacity 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .input-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .btn-clear {
    width: 3rem;
    height: 100%;
    padding: 0;
    flex-shrink: 0;
    opacity: 1;
    transition: background-color 0.11s cubic-bezier(0.2, 0, 0.38, 0.9),
      opacity 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .btn-clear:hover {
    background-color: #4c4c4c;
  }

  .btn-clear-hidden {
    opacity: 0;
  }
</style>

<div
  id="right-panel-action-search"
  class="search-wrapper"
  role="combobox"
  aria-expanded={searchIsActive}>
  <button
    tabindex={searchTabIndex}
    aria-label={action}
    class={cx('--header__action')}
    class:btn-search={true}
    class:btn-search-disabled={searchIsActive}
    on:click={() => dispatch('focusInputSearch')}
    type="button">
    <Icon {...icon} render={icon.render} />
  </button>
  <input
    type="text"
    autocomplete="off"
    tabindex={closeTabIndex}
    class="input-search"
    class:input-hidden={!searchIsActive}
    placeholder="Search"
    on:focus={() => dispatch('focusInputSearch')}
    on:focusout={() => dispatch('focusOutInputSearch')} />
  <button
    id="right-panel-close-search"
    tabindex={closeTabIndex}
    class={cx('--header__action')}
    class:btn-clear={true}
    class:btn-clear-hidden={!searchIsActive}
    type="button"
    aria-label="Clear search">
    <Icon {...closeIcon} render={closeIcon.render} />
  </button>
</div>
