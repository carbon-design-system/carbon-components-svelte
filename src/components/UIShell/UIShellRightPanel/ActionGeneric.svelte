<script>
  export let action = undefined;

  import { cx } from '../../../lib';
  import ActionLink from './ActionLink.svelte';
  import ActionComponent from './ActionComponent.svelte';
  import ActionSearch from './ActionSearch.svelte';
  import { leftPanelTypes, actionSearchWhiteList } from '../constants';

  let typeComponent = undefined;
  let componentIsActive = false;
  let typeSearch = undefined;
  let searchIsActive = false;
  let typeLink = undefined;
  let linkIsActive = false;

  let isSearchFocus = false;

  window.addEventListener('mouseup', ({ target }) => {
    checkForClicks(target, typeComponent, leftPanelTypes.component);
    checkForClicksTypeSearch(target, typeSearch, leftPanelTypes.search);
    checkForClicks(target, typeLink, leftPanelTypes.link);
  });

  function checkForClicks(target, component, actionString) {
    try {
      if (component && target) {
        if (component.contains(target) || target === component) {
          if (actionString === leftPanelTypes.component) {
            componentIsActive = !componentIsActive;
          } else if (actionString === leftPanelTypes.link) {
            linkIsActive = !linkIsActive;
          }
        } else {
          if (actionString === leftPanelTypes.component) {
            if (componentIsActive) {
              componentIsActive = false;
            }
          } else if (actionString === leftPanelTypes.link) {
            if (linkIsActive) {
              linkIsActive = false;
            }
          }
        }
      }
    } catch (error) {}
  }

  function checkForClicksTypeSearch(target, component, actionString) {
    let parentFirstLine;
    let parentSecondLine;

    if (component && target) {
      try {
        if (
          target.id !== 'right-panel-action-search' &&
          target.parentNode.id !== 'right-panel-action-search' &&
          target.parentNode.parentNode.id !== 'right-panel-action-search'
        ) {
          if (component.contains(target) || target === component) {
            if (actionString === leftPanelTypes.component) {
              componentIsActive = !componentIsActive;
            } else if (actionString === leftPanelTypes.search) {
              searchIsActive = !searchIsActive;
            } else if (actionString === leftPanelTypes.link) {
              linkIsActive = !linkIsActive;
            }
          } else {
            if (actionString === leftPanelTypes.component) {
              if (componentIsActive) {
                componentIsActive = false;
              }
            } else if (actionString === leftPanelTypes.search) {
              if (searchIsActive) {
                searchIsActive = false;
              }
            } else if (actionString === leftPanelTypes.link) {
              if (linkIsActive) {
                linkIsActive = false;
              }
            }
          }
        } else {
          if (actionString === leftPanelTypes.component) {
            if (!componentIsActive && target.id !== 'right-panel-close-search') {
              componentIsActive = true;
            } else if (
              componentIsActive &&
              (target.id === 'right-panel-close-search' ||
                target.parentNode.id === 'right-panel-close-search')
            ) {
              componentIsActive = false;
            }
          } else if (actionString === leftPanelTypes.search) {
            if (!searchIsActive && target.id !== 'right-panel-close-search') {
              searchIsActive = true;
            } else if (
              searchIsActive &&
              (target.id === 'right-panel-close-search' ||
                target.parentNode.id === 'right-panel-close-search')
            ) {
              searchIsActive = false;
            }
          } else if (actionString === leftPanelTypes.link) {
            if (!linkIsActive && target.id !== 'right-panel-close-search') {
              linkIsActive = true;
            } else if (
              linkIsActive &&
              (target.id === 'right-panel-close-search' ||
                target.parentNode.id === 'right-panel-close-search')
            ) {
              linkIsActive = false;
            }
          }
        }
      } catch (error) {
        if (actionString === leftPanelTypes.component) {
          if (componentIsActive) {
            componentIsActive = false;
          }
        } else if (actionString === leftPanelTypes.search) {
          if (searchIsActive) {
            searchIsActive = false;
          }
        } else if (actionString === leftPanelTypes.link) {
          if (linkIsActive) {
            linkIsActive = false;
          }
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

{#if action.type === leftPanelTypes.component}
  <div bind:this={typeComponent}>
    <ActionComponent
      action={action.action}
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
      }} />
  </div>
{:else if action.type === leftPanelTypes.link || action.type === leftPanelTypes.links}
  <div bind:this={typeLink}>
    <ActionLink
      action={action.action}
      icon={action.icon ? action.icon : undefined}
      content={action.content}
      bind:linkIsActive />
  </div>
{/if}
