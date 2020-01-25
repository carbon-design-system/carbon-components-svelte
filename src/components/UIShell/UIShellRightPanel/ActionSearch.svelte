<script>
  export let action = undefined;
  export let icon = undefined;
  export let searchIsActive = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { leftPanelActions, closeIcon } from '../constants';
  import searchStore from '../searchStore';
  import ActionSearchResult from './ActionSearchResult.svelte';

  let searchTabIndex = '0';
  let closeTabIndex = '-1';
  let inputSearchField = undefined;
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

  function dispatchInputs(event) {
    const params = {
      action: action,
      textInput: event.target.value
    };

    dispatch('inputSearch', params);
  }

  $: if (!searchIsActive) {
    if (inputSearchField) {
      inputSearchField.value = '';
    }
    searchStore.clear();
  }

  $: if (searchIsActive) {
    searchTabIndex = '-1';
    closeTabIndex = '0';
  } else {
    searchTabIndex = '0';
    closeTabIndex = '-1';
  }

  $: showResults = $searchStore ? true : false;
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
    display: block;
    transition: background-color 0.11s cubic-bezier(0.2, 0, 0.38, 0.9),
      opacity 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .btn-clear:hover {
    background-color: #4c4c4c;
  }

  .btn-clear-hidden {
    opacity: 0;
    display: none;
  }

  .search-list {
    position: absolute;
    z-index: 10000;
    padding: 1rem 0;
    left: 0;
    right: 0;
    top: 3rem;
    background-color: #161616;
    border: 1px solid #393939;
    border-top: none;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.5);
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
    type="button"
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        searchIsActive = !searchIsActive;
      }
    }}>
    <Icon {...icon} />
  </button>
  <input
    bind:this={inputSearchField}
    id="input-search-field"
    type="text"
    autocomplete="off"
    tabindex={closeTabIndex}
    class="input-search"
    class:input-hidden={!searchIsActive}
    placeholder="Search"
    on:focus={() => dispatch('focusInputSearch')}
    on:focusout={() => dispatch('focusOutInputSearch')}
    on:input={dispatchInputs} />
  <button
    id="right-panel-close-search"
    tabindex={closeTabIndex}
    class={cx('--header__action')}
    class:btn-clear={true}
    class:btn-clear-hidden={!searchIsActive}
    type="button"
    aria-label="Clear search"
    on:click={() => searchStore.clear()}
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        searchIsActive = !searchIsActive;
      }
    }}>
    <Icon {...closeIcon} />
  </button>
</div>
{#if showResults}
  <ul aria-labelledby="search-label" role="menu" id="search-menu" class="search-list">
    {#each $searchStore as searchItem, index}
      <ActionSearchResult {searchItem} {index} />
    {/each}
  </ul>
{/if}
