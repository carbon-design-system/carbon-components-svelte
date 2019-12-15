<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Toggle from './Toggle.svelte';
  import ToggleSkeleton from './Toggle.Skeleton.svelte';
</script>

<Layout>
  {#if story === 'toggled'}
    <Toggle {...$$props} id="toggle-1" toggled />
  {:else if story === 'skeleton'}
    <ToggleSkeleton />
  {:else}
    <Toggle {...$$props} id="toggle-1" />
  {/if}
</Layout>
