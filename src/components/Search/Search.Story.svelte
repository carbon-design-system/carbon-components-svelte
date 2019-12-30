<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Search from './Search.svelte';
  import SearchSkeleton from './Search.Skeleton.svelte';

  let value = '';

  $: {
    if (!value.length) {
      console.log('cleared');
    } else {
      console.log('value', value);
    }
  }
</script>

<Layout>
  <div>
    {#if story === 'skeleton'}
      <SearchSkeleton />
    {:else}
      <Search {...$$props} bind:value />
    {/if}
  </div>
</Layout>
