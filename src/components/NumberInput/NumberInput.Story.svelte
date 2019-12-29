<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import NumberInput from './NumberInput.svelte';
  import NumberInputSkeleton from './NumberInput.Skeleton.svelte';

  let value = $$props.value;
</script>

<Layout>
  {#if story === 'skeleton'}
    <NumberInputSkeleton {...$$props} />
  {:else}
    <NumberInput
      {...$$props}
      id="slider"
      bind:value
      on:change={({ detail }) => {
        console.log('on:change', detail);
      }} />
  {/if}
</Layout>
