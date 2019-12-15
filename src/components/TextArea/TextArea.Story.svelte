<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import TextArea from './TextArea.svelte';
  import TextAreaSkeleton from './TextArea.Skeleton.svelte';

  let value = '';
</script>

<Layout>
  {#if story === 'skeleton'}
    <TextAreaSkeleton {...$$props} />
  {:else}
    <TextArea {...$$props} bind:value />
  {/if}
</Layout>
