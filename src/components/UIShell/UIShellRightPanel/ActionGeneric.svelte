<script>
  export let action = undefined;

  import ActionLink from './ActionLink.svelte';
  import ActionComponent from './ActionComponent.svelte';
  import ActionSearch from './ActionSearch.svelte';
  import { leftPanelTypes } from '../constants';
  import { isChildOf } from '../helpers';

  let typeComponent = undefined;
  let componentIsActive = false;
  let typeSearch = undefined;
  let searchIsActive = false;
  let typeLink = undefined;
  let linkIsActive = false;

  let isSearchFocus = false;

  window.addEventListener('mouseup', ({ target }) => {
    checkForClicksTypeComponent(target, typeComponent);
    checkForClicksTypeSearch(target, typeSearch);
    checkForClicksTypeLink(target, typeLink);
  });

  function checkForClicksTypeComponent(target, component) {
    if (component && target) {
      if (
        !isChildOf(target, 'right-panel-action-component') ||
        !isChildOf(target, 'right-panel-action-component-form')
      ) {
        if (component.contains(target) || target === component) {
          componentIsActive = !componentIsActive;
        } else {
          if (componentIsActive) {
            componentIsActive = false;
          }
        }
      }
    }
  }

  function checkForClicksTypeSearch(target, component) {
    if (component && target) {
      if (!isChildOf(target, 'right-panel-action-search')) {
        if (component.contains(target) || target === component) {
          searchIsActive = !searchIsActive;
        } else {
          if (searchIsActive) {
            searchIsActive = false;
          }
        }
      } else {
        if (!searchIsActive && target.id !== 'right-panel-close-search') {
          searchIsActive = true;
        } else if (searchIsActive && isChildOf(target, 'right-panel-close-search')) {
          searchIsActive = false;
        }
      }
    }
  }

  function checkForClicksTypeLink(target, component) {
    if (component && target) {
      if (component.contains(target) || target === component) {
        linkIsActive = !linkIsActive;
      } else {
        if (linkIsActive) {
          linkIsActive = false;
        }
      }
    }
  }
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
</style>

{#if action.isVisible}
  {#if action.type === leftPanelTypes.component}
    <div bind:this={typeComponent}>
      <ActionComponent
        icon={action.icon ? action.icon : undefined}
        content={action.content}
        bind:componentIsActive />
    </div>
  {:else if action.type === leftPanelTypes.search}
    <div
      bind:this={typeSearch}
      class="search-wrapper"
      class:search-wrapper-hidden={!searchIsActive}
      class:search-focus={isSearchFocus || searchIsActive}
      role="search">
      <ActionSearch
        action={action.action}
        icon={action.icon ? action.icon : undefined}
        content={action.content}
        bind:searchIsActive
        focusInputSearch={() => {
          isSearchFocus = true;
        }}
        focusOutInputSearch={() => {
          isSearchFocus = false;
        }}
        on:inputSearch />
    </div>
  {:else if action.type === leftPanelTypes.link || action.type === leftPanelTypes.links}
    <div bind:this={typeLink}>
      <ActionLink
        action={action.action}
        type={action.type}
        icon={action.icon ? action.icon : undefined}
        content={action.content}
        bind:linkIsActive />
    </div>
  {/if}
{/if}
