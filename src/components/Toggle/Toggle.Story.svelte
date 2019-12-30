<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Toggle from './Toggle.svelte';
  import ToggleSkeleton from './Toggle.Skeleton.svelte';

  let toggled = true;

  $: {
    console.log('toggled', toggled);
  }
</script>

<Layout>
  {#if story === 'toggled'}
    <Toggle {...$$props} id="toggle-1" bind:toggled />
  {:else if story === 'skeleton'}
    <ToggleSkeleton />
  {:else}
    <Toggle {...$$props} id="toggle-1" />
  {/if}
</Layout>
