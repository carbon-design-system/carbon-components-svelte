<script>
  export let rightPanel = undefined;

  import { onMount } from 'svelte';
  import { cx } from '../../../lib';
  import ActionSearch from './ActionSearch.svelte';
  import ActionComponent from './ActionComponent.svelte';
  import ActionLink from './ActionLink.svelte';

  // let switcherAtLast = [];
  // let renderSwitcher = false;

  $: switcherAtLast = rightPanel.map((item, index, array) => {
    if (item.action === 'switcher') {
      if (index !== rightPanel.length) {
        const newItem = array[index];
        return newItem;
      }
    } else {
      return undefined;
    }
  });

  $: renderSwitcher = switcherAtLast ? true : false;

  onMount(()=>{
    console.log(switcherAtLast);
    console.log(renderSwitcher);
  })
</script>

<div class={cx('--header__global')}>
  {#each rightPanel as action, index}
    {#if action.action === 'search'}
      <ActionSearch {...action} />
    {:else if action.action === 'switcher'}
      {#if index === rightPanel.length}
        <ActionLink {...action} />
      {/if}
    {:else if action.type === 'search'}
      <ActionSearch {...action} />
    {:else if action.type === 'component'}
      <ActionComponent {...action} />
    {:else if action.type === 'link'}
      <ActionLink {...action} />
    {/if}
  {/each}
  {#if renderSwitcher}
    <ActionLink {...switcherAtLast} />
  {/if}
</div>
