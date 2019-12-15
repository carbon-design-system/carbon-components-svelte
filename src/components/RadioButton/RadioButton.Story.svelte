<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ListItem from '../ListItem';
  import RadioButton from './RadioButton.svelte';
  import RadioButtonSkeleton from './RadioButton.Skeleton.svelte';
</script>

<Layout>

  {#if story === 'skeleton'}
    <div>
      <RadioButtonSkeleton />
    </div>
  {:else}
    <RadioButton {...$$props} id="radio-1" />
  {/if}
</Layout>
