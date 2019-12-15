<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ToggleSmall from './ToggleSmall.svelte';
  import ToggleSmallSkeleton from './ToggleSmall.Skeleton.svelte';
</script>

<Layout>
  {#if story === 'toggled'}
    <ToggleSmall {...$$props} id="toggle-1" toggled />
  {:else if story === 'skeleton'}
    <ToggleSmallSkeleton />
  {:else}
    <ToggleSmall {...$$props} id="toggle-1" />
  {/if}
</Layout>
