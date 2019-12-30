<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ToggleSmall from './ToggleSmall.svelte';
  import ToggleSmallSkeleton from './ToggleSmall.Skeleton.svelte';

  let toggled = true;

  $: {
    console.log('toggled', toggled);
  }
</script>

<Layout>
  {#if story === 'toggled'}
    <ToggleSmall {...$$props} id="toggle-1" bind:toggled />
  {:else if story === 'skeleton'}
    <ToggleSmallSkeleton />
  {:else}
    <ToggleSmall {...$$props} id="toggle-1" />
  {/if}
</Layout>
