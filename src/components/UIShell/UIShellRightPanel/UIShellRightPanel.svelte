<script>
  export let rightPanel = undefined;

  import { cx } from '../../../lib';
  import ActionGeneric from './ActionGeneric.svelte';
  import { leftPanelActions } from '../constants';

  let orderedRightPanel = [];
  let customActions = 1;

  rightPanel.forEach((item, index) => {
    orderedRightPanel[index] = undefined;
    if (item.action) {
      if (
        Object.keys(leftPanelActions).indexOf(
          item.action.charAt(0).toLowerCase() + item.action.slice(1)
        ) === -1
      ) {
        orderedRightPanel[customActions] = rightPanel[index];
        customActions += 1;
      }
    }
  });

  rightPanel.forEach((item, index) => {
    if (item.action) {
      if (item.action === leftPanelActions.search.actionString) {
        orderedRightPanel[0] = rightPanel[index];
      } else if (item.action === leftPanelActions.help.actionString) {
        orderedRightPanel[customActions] = rightPanel[index];
      } else if (item.action === leftPanelActions.notifications.actionString) {
        orderedRightPanel[customActions + 1] = rightPanel[index];
      } else if (item.action === leftPanelActions.account.actionString) {
        orderedRightPanel[customActions + 2] = rightPanel[index];
      } else if (item.action === leftPanelActions.switcher.actionString) {
        orderedRightPanel[customActions + 3] = rightPanel[index];
      }
    }
  });

  orderedRightPanel = orderedRightPanel.filter(item => {
    return item;
  });
</script>

<div class={cx('--header__global')}>
  {#each orderedRightPanel as action, index}
    <ActionGeneric {action} on:inputSearch />
  {/each}
</div>
