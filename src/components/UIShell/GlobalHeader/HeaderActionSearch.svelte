<script>
  export let searchIsActive = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { closeIcon, searchIcon } from '../constants';
  import searchStore from '../searchStore';

  let searchTabIndex = '0';
  let closeTabIndex = '-1';
  let elInput = undefined;
  let elTypeSearch = undefined;
  let isSearchFocus = false;
  const dispatch = createEventDispatcher();

  function dispatchInputs(event) {
    const params = {
      action: 'search',
      textInput: event.target.value
    };
    dispatch('inputSearch', params);
  }

  function mouseUp({ target }) {
    if (target && elTypeSearch) {
      if (!elTypeSearch.contains(target)) {
        searchIsActive = false;
        isSearchFocus = false;
      }
    }
  }

  $: if (!searchIsActive) {
    if (elInput) {
      elInput.value = '';
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
  $: if (isSearchFocus) {
    elInput.focus();
  }
  $: showResults = $searchStore ? true : false;
</script>

<style>
  .search-wrapper {
    position: relative;
    display: flex;
    max-width: 28rem;
    width: 100%;
    margin-left: 0.5rem;
    height: 3rem;
    background-color: #393939;
    color: #fff;
    transition: max-width 0.11s cubic-bezier(0.2, 0, 0.38, 0.9),
      background 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  .search-wrapper-hidden {
    max-width: 3rem;
    background-color: #161616;
  }
  .search-focus {
    outline: 2px solid #fff;
    outline-offset: -2px;
  }
  .search-wrapper-2 {
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

<svelte:window on:mouseup={mouseUp} />

<div
  bind:this={elTypeSearch}
  class="search-wrapper"
  class:search-wrapper-hidden={!searchIsActive}
  class:search-focus={isSearchFocus || searchIsActive}
  role="search">
  <div
    id="right-panel-action-search"
    class="search-wrapper-2"
    role="combobox"
    aria-expanded={searchIsActive}>
    <button
      tabindex={searchTabIndex}
      aria-label="Search"
      class={cx('--header__action')}
      class:btn-search={true}
      class:btn-search-disabled={searchIsActive}
      on:click={() => {
        isSearchFocus = true;
        searchIsActive = true;
        dispatch('focusInputSearch');
      }}
      type="button"
      on:keydown={({ key }) => {
        if (key === 'Enter') {
          searchIsActive = !searchIsActive;
        }
      }}>
      <Icon {...searchIcon} />
    </button>
    <input
      bind:this={elInput}
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
      on:click={() => {
        isSearchFocus = false;
        searchIsActive = false;
        searchStore.clear();
      }}
      on:keydown={({ key }) => {
        if (key === 'Enter') {
          searchIsActive = !searchIsActive;
        }
      }}>
      <Icon {...closeIcon} />
    </button>
  </div>
</div>
